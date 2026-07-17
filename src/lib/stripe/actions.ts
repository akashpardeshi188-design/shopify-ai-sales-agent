"use server";

import { redirect } from "next/navigation";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { PLANS, type PlanId } from "@/lib/stripe/plans";
import type { FormState } from "@/lib/auth/actions";

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export async function createCheckoutSession(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const membership = await requireOrganization();
  if (membership.role === "member") {
    return { message: "Only organization admins can manage billing." };
  }

  const planId = formData.get("plan") as PlanId;
  const plan = PLANS[planId];
  if (!plan?.priceId) {
    return { message: "This plan isn't configured yet." };
  }

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", membership.organization.id)
    .single();

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan.priceId, quantity: 1 }],
    customer: org?.stripe_customer_id ?? undefined,
    client_reference_id: membership.organization.id,
    subscription_data: { metadata: { organization_id: membership.organization.id } },
    success_url: `${appUrl()}/billing/success`,
    cancel_url: `${appUrl()}/billing`,
  });

  if (!session.url) return { message: "Could not start checkout." };
  redirect(session.url);
}

// Both params are required to match the useActionState action signature even
// though this action needs no form input.
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function createBillingPortalSession(
  _state: FormState,
  _formData: FormData
): Promise<FormState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const membership = await requireOrganization();
  if (membership.role === "member") {
    return { message: "Only organization admins can manage billing." };
  }

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", membership.organization.id)
    .single();
  if (!org?.stripe_customer_id) {
    return { message: "No billing account yet — subscribe to a plan first." };
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${appUrl()}/billing`,
  });

  redirect(session.url);
}
