"use client";

import { useActionState } from "react";
import { connectStore } from "@/lib/shopify/actions";
import { SubmitButton } from "@/components/forms/submit-button";

export function ConnectStoreForm() {
  const [state, action] = useActionState(connectStore, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="shopDomain" className="text-sm font-medium">
          Store domain
        </label>
        <input
          id="shopDomain"
          name="shopDomain"
          placeholder="my-shop.myshopify.com"
          required
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.shopDomain && (
          <p className="text-sm text-red-600">{state.errors.shopDomain[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="accessToken" className="text-sm font-medium">
          Admin API access token
        </label>
        <input
          id="accessToken"
          name="accessToken"
          type="password"
          autoComplete="off"
          required
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="text-xs text-zinc-500">
          From your custom app&apos;s API credentials page. Needs read_products,
          read_orders, and read_customers scopes.
        </p>
        {state?.errors?.accessToken && (
          <p className="text-sm text-red-600">{state.errors.accessToken[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="webhookSecret" className="text-sm font-medium">
          Webhook signing secret
        </label>
        <input
          id="webhookSecret"
          name="webhookSecret"
          type="password"
          autoComplete="off"
          required
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="text-xs text-zinc-500">
          Also on the API credentials page — used to verify webhooks really
          came from your store.
        </p>
        {state?.errors?.webhookSecret && (
          <p className="text-sm text-red-600">{state.errors.webhookSecret[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <SubmitButton pendingText="Connecting…">Connect store</SubmitButton>
    </form>
  );
}
