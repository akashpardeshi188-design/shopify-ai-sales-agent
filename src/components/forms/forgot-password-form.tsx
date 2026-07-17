"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/forms/submit-button";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.email && (
          <p className="text-sm text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {state.message}
        </p>
      )}

      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}
