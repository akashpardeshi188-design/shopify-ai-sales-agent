"use client";

import { useActionState } from "react";
import { signup } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/forms/submit-button";

export function SignupForm() {
  const [state, action] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.fullName && (
          <p className="text-sm text-red-600">{state.errors.fullName[0]}</p>
        )}
      </div>

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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {state.message}
        </p>
      )}

      <SubmitButton pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
