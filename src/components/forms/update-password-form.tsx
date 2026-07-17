"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/forms/submit-button";

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePassword, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.password && (
          <ul className="text-sm text-red-600">
            {state.errors.password.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}
      </div>

      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <SubmitButton pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
