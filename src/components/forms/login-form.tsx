"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/forms/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);

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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-zinc-500 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.password && (
          <p className="text-sm text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
