import { createHmac, timingSafeEqual } from "crypto";
import type { ShopifyClient } from "@/lib/shopify/client";
import { WEBHOOK_SUBSCRIPTION_CREATE_MUTATION } from "@/lib/shopify/queries";

// Topics kept in sync via webhooks rather than waiting for the next
// scheduled/manual sync. Each is mapped to an upsert in the route handler.
export const WEBHOOK_TOPICS = [
  "ORDERS_CREATE",
  "ORDERS_UPDATED",
  "PRODUCTS_UPDATE",
  "PRODUCTS_DELETE",
  "CUSTOMERS_UPDATE",
  "APP_UNINSTALLED",
] as const;

type WebhookSubscriptionCreateResult = {
  webhookSubscriptionCreate: {
    webhookSubscription: { id: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

// Shopify signs every webhook for a custom app with that app's single
// (account-level) signing secret, regardless of which API created the
// subscription — so registering via GraphQL here still gets verified
// against the `webhook_secret` the merchant pasted in from their custom
// app's API credentials page.
export async function registerWebhooks(shopify: ShopifyClient) {
  const callbackUrl = `${process.env.APP_URL}/api/webhooks/shopify`;

  for (const topic of WEBHOOK_TOPICS) {
    const result = await shopify.request<WebhookSubscriptionCreateResult>(
      WEBHOOK_SUBSCRIPTION_CREATE_MUTATION,
      { topic, webhookSubscription: { callbackUrl, format: "JSON" } }
    );

    const errors = result.webhookSubscriptionCreate.userErrors;
    const alreadyExists = errors.some((e) =>
      e.message.toLowerCase().includes("already")
    );
    if (errors.length && !alreadyExists) {
      throw new Error(
        `Failed to register ${topic} webhook: ${errors[0].message}`
      );
    }
  }
}

export function verifyWebhookSignature(
  rawBody: string,
  hmacHeader: string | null,
  secret: string
): boolean {
  if (!hmacHeader) return false;

  const computed = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(hmacHeader, "base64");
  } catch {
    return false;
  }

  return (
    computed.length === provided.length && timingSafeEqual(computed, provided)
  );
}

// Webhook payloads use the legacy REST resource shape (snake_case, plain
// numeric ids) even when the subscription was created via the GraphQL Admin
// API — distinct from the GraphQL node shapes in lib/shopify/types.ts used
// by the polling sync in lib/shopify/sync.ts.
export type ShopifyProductWebhookPayload = {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string | null;
  product_type: string | null;
  tags: string;
  status: string;
  handle: string;
  image: { src: string } | null;
  variants: {
    id: number;
    title: string;
    sku: string | null;
    price: string;
    compare_at_price: string | null;
    inventory_quantity: number | null;
  }[];
};

export type ShopifyCustomerWebhookPayload = {
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  orders_count: number;
  total_spent: string;
};

export type ShopifyOrderWebhookPayload = {
  id: number;
  name: string;
  customer: { id: number } | null;
  total_price: string;
  currency: string;
  financial_status: string | null;
  fulfillment_status: string | null;
  line_items: { title: string; quantity: number; price: string }[];
};
