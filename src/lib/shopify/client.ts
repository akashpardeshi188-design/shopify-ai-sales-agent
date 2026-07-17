const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-01";

// Minimum Admin API scopes the custom app's access token must grant for the
// agent to function (catalog + order/customer context for the sales agent).
export const REQUIRED_SCOPES = ["read_products", "read_orders", "read_customers"];

export class ShopifyApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ShopifyApiError";
    this.status = status;
  }
}

export type ShopifyClient = {
  request: <T>(
    document: string,
    variables?: Record<string, unknown>
  ) => Promise<T>;
};

export function createShopifyClient(
  shopDomain: string,
  accessToken: string
): ShopifyClient {
  const endpoint = `https://${shopDomain}/admin/api/${API_VERSION}/graphql.json`;

  async function request<T>(
    document: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query: document, variables }),
    });

    if (!res.ok) {
      throw new ShopifyApiError(
        `Shopify API request failed with status ${res.status}`,
        res.status
      );
    }

    const json = await res.json();
    if (json.errors?.length) {
      throw new ShopifyApiError(
        json.errors[0]?.message ?? "Shopify GraphQL error",
        res.status
      );
    }

    return json.data as T;
  }

  return { request };
}

// Shopify Admin API GraphQL ids look like "gid://shopify/Product/123456789".
// We store the trailing numeric id since that's what REST-shaped webhook
// payloads (and our own unique constraints) use.
export function gidToId(gid: string): number {
  const id = Number(gid.split("/").pop());
  if (!Number.isFinite(id)) throw new Error(`Could not parse Shopify id: ${gid}`);
  return id;
}

export function normalizeShopDomain(input: string): string {
  const trimmed = input
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  return trimmed.endsWith(".myshopify.com")
    ? trimmed
    : `${trimmed}.myshopify.com`;
}
