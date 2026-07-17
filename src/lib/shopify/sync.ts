import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createShopifyClient, gidToId, type ShopifyClient } from "@/lib/shopify/client";
import { decrypt } from "@/lib/shopify/encryption";
import {
  COLLECTIONS_QUERY,
  CUSTOMERS_QUERY,
  ORDERS_QUERY,
  PRODUCTS_QUERY,
} from "@/lib/shopify/queries";
import type {
  Connection,
  ShopifyCollectionNode,
  ShopifyCustomerNode,
  ShopifyOrderNode,
  ShopifyProductNode,
} from "@/lib/shopify/types";

// Caps each entity to 2,000 records per sync run so a single run can't run
// past typical serverless function time limits. Safe in practice because
// re-syncs after the first one are incremental (filtered by last_synced_at);
// very large catalogs simply catch up over a couple of "Sync now" clicks.
const PAGE_SIZE = 50;
const MAX_PAGES = 40;

async function fetchAllPages<TNode>(
  shopify: ShopifyClient,
  document: string,
  rootKey: string,
  filter?: string
): Promise<TNode[]> {
  const results: TNode[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;
  let pages = 0;

  while (hasNextPage && pages < MAX_PAGES) {
    const data: Record<string, Connection<TNode>> = await shopify.request(
      document,
      { first: PAGE_SIZE, after: cursor, filter }
    );
    const connection: Connection<TNode> = data[rootKey];
    for (const edge of connection.edges) results.push(edge.node);
    hasNextPage = connection.pageInfo.hasNextPage;
    cursor = connection.edges.at(-1)?.cursor ?? null;
    pages += 1;
  }

  return results;
}

function updatedSinceFilter(since?: string | null) {
  return since ? `updated_at:>='${since}'` : undefined;
}

async function syncCollections(
  shopify: ShopifyClient,
  db: SupabaseClient,
  storeId: string
) {
  const nodes = await fetchAllPages<ShopifyCollectionNode>(
    shopify,
    COLLECTIONS_QUERY,
    "collections"
  );
  if (nodes.length === 0) return 0;

  const rows = nodes.map((n) => ({
    store_id: storeId,
    shopify_collection_id: gidToId(n.id),
    title: n.title,
    handle: n.handle,
  }));

  const { error } = await db
    .from("collections")
    .upsert(rows, { onConflict: "store_id,shopify_collection_id" });
  if (error) throw error;

  return rows.length;
}

async function syncProducts(
  shopify: ShopifyClient,
  db: SupabaseClient,
  storeId: string,
  since?: string | null
) {
  const nodes = await fetchAllPages<ShopifyProductNode>(
    shopify,
    PRODUCTS_QUERY,
    "products",
    updatedSinceFilter(since)
  );
  if (nodes.length === 0) return 0;

  const { data: localCollections } = await db
    .from("collections")
    .select("id, shopify_collection_id")
    .eq("store_id", storeId);
  const collectionIdMap = new Map<number, string>(
    localCollections?.map((c) => [c.shopify_collection_id, c.id]) ?? []
  );

  const productRows = nodes.map((n) => ({
    store_id: storeId,
    shopify_product_id: gidToId(n.id),
    title: n.title,
    description: n.description,
    vendor: n.vendor,
    product_type: n.productType,
    tags: n.tags,
    status: n.status.toLowerCase(),
    handle: n.handle,
    image_url: n.featuredImage?.url ?? null,
    price_min: n.priceRangeV2?.minVariantPrice?.amount
      ? Number(n.priceRangeV2.minVariantPrice.amount)
      : null,
    price_max: n.priceRangeV2?.maxVariantPrice?.amount
      ? Number(n.priceRangeV2.maxVariantPrice.amount)
      : null,
  }));

  const { data: upserted, error } = await db
    .from("products")
    .upsert(productRows, { onConflict: "store_id,shopify_product_id" })
    .select("id, shopify_product_id");
  if (error) throw error;

  const productIdMap = new Map<number, string>(
    upserted.map((p) => [p.shopify_product_id, p.id])
  );

  const variantRows: Record<string, unknown>[] = [];
  const productCollectionRows: Record<string, unknown>[] = [];

  for (const n of nodes) {
    const productId = productIdMap.get(gidToId(n.id));
    if (!productId) continue;

    for (const edge of n.variants.edges) {
      const v = edge.node;
      variantRows.push({
        product_id: productId,
        shopify_variant_id: gidToId(v.id),
        title: v.title,
        sku: v.sku,
        price: v.price ? Number(v.price) : null,
        compare_at_price: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        inventory_quantity: v.inventoryQuantity,
        available: v.availableForSale,
      });
    }

    for (const edge of n.collections.edges) {
      const collectionId = collectionIdMap.get(gidToId(edge.node.id));
      if (collectionId) {
        productCollectionRows.push({
          product_id: productId,
          collection_id: collectionId,
        });
      }
    }
  }

  if (variantRows.length) {
    const { error: variantError } = await db
      .from("product_variants")
      .upsert(variantRows, { onConflict: "product_id,shopify_variant_id" });
    if (variantError) throw variantError;
  }

  if (productCollectionRows.length) {
    const { error: pcError } = await db
      .from("product_collections")
      .upsert(productCollectionRows, { onConflict: "product_id,collection_id" });
    if (pcError) throw pcError;
  }

  return productRows.length;
}

async function syncCustomers(
  shopify: ShopifyClient,
  db: SupabaseClient,
  storeId: string,
  since?: string | null
) {
  const nodes = await fetchAllPages<ShopifyCustomerNode>(
    shopify,
    CUSTOMERS_QUERY,
    "customers",
    updatedSinceFilter(since)
  );
  if (nodes.length === 0) return 0;

  const rows = nodes.map((n) => ({
    store_id: storeId,
    shopify_customer_id: gidToId(n.id),
    email: n.email,
    first_name: n.firstName,
    last_name: n.lastName,
    total_spent: n.amountSpent?.amount ? Number(n.amountSpent.amount) : 0,
    orders_count: n.numberOfOrders ? Number(n.numberOfOrders) : 0,
  }));

  const { error } = await db
    .from("customers")
    .upsert(rows, { onConflict: "store_id,shopify_customer_id" });
  if (error) throw error;

  return rows.length;
}

async function syncOrders(
  shopify: ShopifyClient,
  db: SupabaseClient,
  storeId: string,
  since?: string | null
) {
  const nodes = await fetchAllPages<ShopifyOrderNode>(
    shopify,
    ORDERS_QUERY,
    "orders",
    updatedSinceFilter(since)
  );
  if (nodes.length === 0) return 0;

  const customerShopifyIds = nodes
    .map((n) => n.customer && gidToId(n.customer.id))
    .filter((id): id is number => Boolean(id));

  const { data: localCustomers } = await db
    .from("customers")
    .select("id, shopify_customer_id")
    .eq("store_id", storeId)
    .in("shopify_customer_id", customerShopifyIds.length ? customerShopifyIds : [-1]);
  const customerIdMap = new Map<number, string>(
    localCustomers?.map((c) => [c.shopify_customer_id, c.id]) ?? []
  );

  const rows = nodes.map((n) => ({
    store_id: storeId,
    shopify_order_id: gidToId(n.id),
    customer_id: n.customer ? customerIdMap.get(gidToId(n.customer.id)) ?? null : null,
    order_number: n.name,
    total_price: n.totalPriceSet?.shopMoney?.amount
      ? Number(n.totalPriceSet.shopMoney.amount)
      : null,
    currency: n.totalPriceSet?.shopMoney?.currencyCode ?? null,
    financial_status: n.displayFinancialStatus,
    fulfillment_status: n.displayFulfillmentStatus,
    line_items: n.lineItems.edges.map((e) => ({
      title: e.node.title,
      quantity: e.node.quantity,
      price: e.node.originalUnitPriceSet?.shopMoney?.amount ?? null,
    })),
  }));

  const { error } = await db
    .from("orders")
    .upsert(rows, { onConflict: "store_id,shopify_order_id" });
  if (error) throw error;

  return rows.length;
}

export type SyncResult = Record<
  string,
  { status: "succeeded" | "failed"; count?: number; error?: string }
>;

export async function runFullSync(storeId: string): Promise<SyncResult> {
  const db = createAdminClient();

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("shop_domain, access_token, last_synced_at")
    .eq("id", storeId)
    .single();
  if (storeError || !store) throw new Error("Store not found");

  const shopify = createShopifyClient(store.shop_domain, decrypt(store.access_token));
  const since = store.last_synced_at as string | null;

  const steps: [string, () => Promise<number>][] = [
    ["collections", () => syncCollections(shopify, db, storeId)],
    ["products", () => syncProducts(shopify, db, storeId, since)],
    ["customers", () => syncCustomers(shopify, db, storeId, since)],
    ["orders", () => syncOrders(shopify, db, storeId, since)],
  ];

  const results: SyncResult = {};

  for (const [syncType, run] of steps) {
    const { data: log } = await db
      .from("store_sync_logs")
      .insert({ store_id: storeId, sync_type: syncType })
      .select("id")
      .single();

    try {
      const count = await run();
      results[syncType] = { status: "succeeded", count };
      if (log) {
        await db
          .from("store_sync_logs")
          .update({
            status: "succeeded",
            records_synced: count,
            finished_at: new Date().toISOString(),
          })
          .eq("id", log.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown sync error";
      results[syncType] = { status: "failed", error: message };
      if (log) {
        await db
          .from("store_sync_logs")
          .update({
            status: "failed",
            error_message: message,
            finished_at: new Date().toISOString(),
          })
          .eq("id", log.id);
      }
    }
  }

  const allFailed = Object.values(results).every((r) => r.status === "failed");
  await db
    .from("stores")
    .update({
      last_synced_at: new Date().toISOString(),
      status: allFailed ? "error" : "active",
    })
    .eq("id", storeId);

  return results;
}
