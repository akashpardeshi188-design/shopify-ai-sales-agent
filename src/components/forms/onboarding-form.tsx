"use client";

import { useActionState } from "react";
import { createOrganization } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/forms/submit-button";

export function OnboardingForm() {
  const [state, action] = useActionState(createOrganization, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="organizationName" className="text-sm font-medium">
          Store or business name
        </label>
        <input
          id="organizationName"
          name="organizationName"
          autoComplete="organization"
          required
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.organizationName && (
          <p className="text-sm text-red-600">
            {state.errors.organizationName[0]}
          </p>
        )}
      </div>

      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <SubmitButton pendingText="Creating workspace…">
        Create workspace
      </SubmitButton>
    </form>
  );
}
