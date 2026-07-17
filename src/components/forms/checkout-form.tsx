"use client";

import { useActionState } from "react";
import { createCheckoutSession } from "@/lib/stripe/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import type { PlanId } from "@/lib/stripe/plans";

export function CheckoutForm({ plan, label }: { plan: PlanId; label: string }) {
  const [state, action] = useActionState(createCheckoutSession, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="plan" value={plan} />
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <SubmitButton pendingText="Redirecting…">{label}</SubmitButton>
    </form>
  );
}
