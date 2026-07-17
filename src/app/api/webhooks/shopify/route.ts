import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/shopify/webhooks";
import type {
  ShopifyCustomerWebhookPayload,
  ShopifyOrderWebhookPayload,
  ShopifyProductWebhookPayload,
} from "@/lib/shopify/webhooks";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const shopDomain = request.headers.get("x-shopify-shop-domain");
  const topic = request.headers.get("x-shopify-topic");
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");

  if (!shopDomain || !topic) {
    return NextResponse.json({ error: "Missing Shopify headers" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: store } = await db
    .from("stores")
    .select("id, webhook_secret")
    .eq("shop_domain", shopDomain)
    .maybeSingle();

  if (!store?.webhook_secret) {
    // Unknown store, or a store connected without a webhook secret — nothing
    // to verify against, so refuse rather than trust an unverifiable payload.
    return NextResponse.json({ error: "Unknown store" }, { status: 404 });
  }

  if (!verifyWebhookSignature(rawBody, hmacHeader, store.webhook_secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const eventId = request.headers.get("x-shopify-webhook-id") ?? crypto.randomUUID();
  const { error: dedupeError } = await db
    .from("webhook_events")
    .insert({ source: "shopify", event_id: eventId, event_type: topic, payload: JSON.parse(rawBody) });
  if (dedupeError?.code === "23505") {
    // Already processed this exact delivery (Shopify retries on timeout).
    return NextResponse.json({ ok: true });
  }

  const payload = JSON.parse(rawBody);

  switch (topic) {
    case "products/update": {
      await upsertProduct(db, store.id, payload as ShopifyProductWebhookPayload);
      break;
    }
    case "products/delete": {
      await db
        .from("products")
        .delete()
        .eq("store_id", store.id)
        .eq("shopify_product_id", (payload as { id: number }).id);
      break;
    }
    case "customers/update": {
      await upsertCustomer(db, store.id, payload as ShopifyCustomerWebhookPayload);
      break;
    }
    case "orders/create":
    case "orders/updated": {
      await upsertOrder(db, store.id, payload as ShopifyOrderWebhookPayload);
      break;
    }
    case "app/uninstalled": {
      await db.from("stores").update({ status: "disconnected" }).eq("id", store.id);
      break;
    }
  }

  return NextResponse.json({ ok: true });
}

async function upsertProduct(
  db: ReturnType<typeof createAdminClient>,
  storeId: string,
  payload: ShopifyProductWebhookPayload
) {
  const { data: product, error } = await db
    .from("products")
    .upsert(
      {
        store_id: storeId,
        shopify_product_id: payload.id,
        title: payload.title,
        description: payload.body_html,
        vendor: payload.vendor,
        product_type: payload.product_type,
        tags: payload.tags ? payload.tags.split(",").map((t) => t.trim()) : [],
        status: payload.status,
        handle: payload.handle,
        image_url: payload.image?.src ?? null,
        price_min: payload.variants.length
          ? Math.min(...payload.variants.map((v) => Number(v.price)))
          : null,
        price_max: payload.variants.length
          ? Math.max(...payload.variants.map((v) => Number(v.price)))
          : null,
      },
      { onConflict: "store_id,shopify_product_id" }
    )
    .select("id")
    .single();
  if (error || !product) return;

  const variantRows = payload.variants.map((v) => ({
    product_id: product.id,
    shopify_variant_id: v.id,
    title: v.title,
    sku: v.sku,
    price: v.price ? Number(v.price) : null,
    compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
    inventory_quantity: v.inventory_quantity,
  }));
  if (variantRows.length) {
    await db
      .from("product_variants")
      .upsert(variantRows, { onConflict: "product_id,shopify_variant_id" });
  }
}

async function upsertCustomer(
  db: ReturnType<typeof createAdminClient>,
  storeId: string,
  payload: ShopifyCustomerWebhookPayload
) {
  await db.from("customers").upsert(
    {
      store_id: storeId,
      shopify_customer_id: payload.id,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      total_spent: payload.total_spent ? Number(payload.total_spent) : 0,
      orders_count: payload.orders_count ?? 0,
    },
    { onConflict: "store_id,shopify_customer_id" }
  );
}

async function upsertOrder(
  db: ReturnType<typeof createAdminClient>,
  storeId: string,
  payload: ShopifyOrderWebhookPayload
) {
  let customerId: string | null = null;
  if (payload.customer) {
    const { data: customer } = await db
      .from("customers")
      .select("id")
      .eq("store_id", storeId)
      .eq("shopify_customer_id", payload.customer.id)
      .maybeSingle();
    customerId = customer?.id ?? null;
  }

  await db.from("orders").upsert(
    {
      store_id: storeId,
      shopify_order_id: payload.id,
      customer_id: customerId,
      order_number: payload.name,
      total_price: payload.total_price ? Number(payload.total_price) : null,
      currency: payload.currency,
      financial_status: payload.financial_status,
      fulfillment_status: payload.fulfillment_status,
      line_items: payload.line_items.map((li) => ({
        title: li.title,
        quantity: li.quantity,
        price: li.price,
      })),
    },
    { onConflict: "store_id,shopify_order_id" }
  );
}
