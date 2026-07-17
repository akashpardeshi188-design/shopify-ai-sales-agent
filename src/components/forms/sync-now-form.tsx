"use client";

import { useActionState } from "react";
import { triggerSync } from "@/lib/shopify/actions";
import { SubmitButton } from "@/components/forms/submit-button";

export function SyncNowForm({ storeId }: { storeId: string }) {
  const [state, action] = useActionState(triggerSync, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="storeId" value={storeId} />
      {state?.message && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {state.message}
        </p>
      )}
      <div className="w-fit">
        <SubmitButton pendingText="Syncing…">Sync now</SubmitButton>
      </div>
    </form>
  );
}
