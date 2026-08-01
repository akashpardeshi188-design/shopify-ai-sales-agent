export const SHOPIFY_SCOPES = [
  "read_products",
  "read_orders",
  "read_customers",
  "write_products",
  "write_customers",
].join(",");

export const SHOPIFY_API_VERSION =
  process.env.SHOPIFY_API_VERSION ?? "2025-01";

export const SHOPIFY_APP_URL =
  process.env.SHOPIFY_APP_URL!;