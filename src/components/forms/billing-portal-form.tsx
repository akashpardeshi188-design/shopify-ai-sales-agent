"use client";

import { useActionState } from "react";
import { createBillingPortalSession } from "@/lib/stripe/actions";
import { SubmitButton } from "@/components/forms/submit-button";

export function BillingPortalForm() {
  const [state, action] = useActionState(createBillingPortalSession, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      {state?.message && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{state.message}</p>
      )}
      <div className="w-fit">
        <SubmitButton pendingText="Redirecting…">Manage billing</SubmitButton>
      </div>
    </form>
  );
}
