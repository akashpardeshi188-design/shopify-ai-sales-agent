import crypto from "crypto";
import { SHOPIFY_SCOPES } from "./config";

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function buildInstallUrl(shop: string, state: string): string {
  const apiKey = process.env.SHOPIFY_API_KEY!;
  const appUrl = process.env.SHOPIFY_APP_URL!;

 

  const redirectUri = `${appUrl}/api/shopify/callback`;
  return `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${encodeURIComponent(
  SHOPIFY_SCOPES
)}&redirect_uri=${encodeURIComponent(
  redirectUri
)}&state=${state}`;

 }