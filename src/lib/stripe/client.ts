import Stripe from "stripe";

let client: Stripe | null = null;

// No explicit apiVersion — let the SDK use the version it was built against
// rather than hardcoding a string that can drift out of sync with it.
export function getStripeClient() {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return client;
}
