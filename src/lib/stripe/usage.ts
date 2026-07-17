import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthlyMessageLimit } from "@/lib/stripe/plans";

function currentBillingPeriod() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return { periodStart: start.toISOString().slice(0, 10), periodEnd: end.toISOString().slice(0, 10) };
}

export async function recordAgentMessageUsage(
  db: SupabaseClient,
  organizationId: string,
  storeId: string
) {
  const { periodStart, periodEnd } = currentBillingPeriod();
  await db.from("usage_records").insert({
    organization_id: organizationId,
    store_id: storeId,
    metric: "agent_messages",
    quantity: 1,
    period_start: periodStart,
    period_end: periodEnd,
  });
}

export async function getMonthlyMessageUsage(db: SupabaseClient, organizationId: string) {
  const { periodStart, periodEnd } = currentBillingPeriod();
  const { data } = await db
    .from("usage_records")
    .select("quantity")
    .eq("organization_id", organizationId)
    .eq("metric", "agent_messages")
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd);
  return (data ?? []).reduce((sum, r) => sum + r.quantity, 0);
}

// Storefront-widget-facing check — playground usage (merchants testing their
// own setup) deliberately doesn't count against this.
export async function isOverMessageLimit(
  db: SupabaseClient,
  organizationId: string,
  plan: string
) {
  const used = await getMonthlyMessageUsage(db, organizationId);
  return used >= getMonthlyMessageLimit(plan);
}
