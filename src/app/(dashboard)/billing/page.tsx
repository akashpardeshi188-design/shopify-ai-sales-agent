import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getMonthlyMessageUsage } from "@/lib/stripe/usage";
import { PLANS, getMonthlyMessageLimit, type PlanId } from "@/lib/stripe/plans";
import { CheckoutForm } from "@/components/forms/checkout-form";
import { BillingPortalForm } from "@/components/forms/billing-portal-form";

export default async function BillingPage() {
  const membership = await requireOrganization();
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("plan, subscription_status, trial_ends_at, stripe_customer_id")
    .eq("id", membership.organization.id)
    .single();

  const used = await getMonthlyMessageUsage(supabase, membership.organization.id);
  const limit = getMonthlyMessageLimit(org?.plan ?? "trial");
  const usagePercent = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Billing</h1>

      <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium capitalize">{org?.plan ?? "trial"} plan</p>
            <p className="text-xs text-zinc-500 capitalize">{org?.subscription_status}</p>
          </div>
          {org?.stripe_customer_id && <BillingPortalForm />}
        </div>

        {org?.plan === "trial" && org?.trial_ends_at && (
          <p className="mt-2 text-xs text-zinc-500">
            Trial ends {new Date(org.trial_ends_at).toLocaleDateString()}
          </p>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Agent messages this month</span>
            <span>
              {used} / {limit}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-900">
            <div
              className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-50"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </div>

      <h2 className="mt-10 text-sm font-medium">Plans</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(([planId, plan]) => (
          <div
            key={planId}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div>
              <p className="text-sm font-medium">{plan.name}</p>
              <p className="text-xs text-zinc-500">{plan.priceLabel}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {plan.monthlyMessageLimit.toLocaleString()} messages/mo
              </p>
            </div>
            <CheckoutForm
              plan={planId}
              label={org?.plan === planId ? "Current plan" : "Choose"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
