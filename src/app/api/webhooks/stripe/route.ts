import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { getPlanIdFromPriceId } from "@/lib/stripe/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentFailedEmail, sendSubscriptionCanceledEmail } from "@/lib/resend/send";

type SubscriptionTableStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";

// Stripe's subscription statuses are more granular than what we track —
// collapse the ones we don't distinguish on down to the closest one we do.
function toSubscriptionTableStatus(status: Stripe.Subscription.Status): SubscriptionTableStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "incomplete":
      return "incomplete";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "unpaid":
    case "paused":
      return "past_due";
  }
}

// organizations.subscription_status has no "incomplete" state — an org with
// an incomplete subscription has no working access yet, same as past_due.
function toOrganizationStatus(
  status: SubscriptionTableStatus
): "trialing" | "active" | "past_due" | "canceled" {
  return status === "incomplete" ? "past_due" : status;
}

// Two queries, not an embedded select: organization_members and profiles
// both reference auth.users by id, but aren't directly related to each
// other by a foreign key PostgREST can join across.
async function getOrgOwnerEmail(
  db: ReturnType<typeof createAdminClient>,
  organizationId: string
): Promise<string | null> {
  const { data: membership } = await db
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const { data: profile } = await db
    .from("profiles")
    .select("email")
    .eq("id", membership.user_id)
    .maybeSingle();
  return profile?.email ?? null;
}

async function syncSubscription(
  db: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const organizationId = subscription.metadata?.organization_id;
  if (!organizationId) return;

  const item = subscription.items.data[0];
  const priceId = item?.price.id;
  const planId = priceId ? getPlanIdFromPriceId(priceId) : null;
  const status = toSubscriptionTableStatus(subscription.status);

  await db.from("subscriptions").upsert(
    {
      organization_id: organizationId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId ?? null,
      plan: planId ?? "starter",
      status,
      current_period_start: item ? new Date(item.current_period_start * 1000).toISOString() : null,
      current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "stripe_subscription_id" }
  );

  if (planId) {
    await db
      .from("organizations")
      .update({ plan: planId, subscription_status: toOrganizationStatus(status) })
      .eq("id", organizationId);
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripeClient();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const db = createAdminClient();
  const { error: dedupeError } = await db
    .from("webhook_events")
    .insert({ source: "stripe", event_id: event.id, event_type: event.type, payload: event as object });
  if (dedupeError?.code === "23505") {
    return NextResponse.json({ ok: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.client_reference_id;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (organizationId && customerId) {
        await db
          .from("organizations")
          .update({ stripe_customer_id: customerId })
          .eq("id", organizationId);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      await syncSubscription(db, event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(db, subscription);

      const organizationId = subscription.metadata?.organization_id;
      if (organizationId) {
        const { data: org } = await db
          .from("organizations")
          .select("name")
          .eq("id", organizationId)
          .single();
        const email = await getOrgOwnerEmail(db, organizationId);
        if (org && email) await sendSubscriptionCanceledEmail(email, org.name);
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        const { data: org } = await db
          .from("organizations")
          .select("id, name")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (org) {
          const email = await getOrgOwnerEmail(db, org.id);
          if (email) await sendPaymentFailedEmail(email, org.name);
        }
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
