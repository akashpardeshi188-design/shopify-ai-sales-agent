export type PlanId = "starter" | "growth" | "pro";

// priceLabel is display copy only — actual billing amount is whatever price
// the env-configured Stripe Price id charges. Update both together.
export const PLANS: Record<
  PlanId,
  { name: string; priceId: string | undefined; priceLabel: string; monthlyMessageLimit: number }
> = {
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_ID_STARTER,
    priceLabel: "$29/mo",
    monthlyMessageLimit: 1000,
  },
  growth: {
    name: "Growth",
    priceId: process.env.STRIPE_PRICE_ID_GROWTH,
    priceLabel: "$79/mo",
    monthlyMessageLimit: 5000,
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    priceLabel: "$199/mo",
    monthlyMessageLimit: 20000,
  },
};

export const TRIAL_MONTHLY_MESSAGE_LIMIT = 100;

export function getMonthlyMessageLimit(plan: string): number {
  return plan in PLANS ? PLANS[plan as PlanId].monthlyMessageLimit : TRIAL_MONTHLY_MESSAGE_LIMIT;
}

export function getPlanIdFromPriceId(priceId: string): PlanId | null {
  for (const [planId, plan] of Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]) {
    if (plan.priceId === priceId) return planId;
  }
  return null;
}
