"use client";

import { useActionState } from "react";
import { disconnectStore } from "@/lib/shopify/actions";

export function DisconnectStoreForm({ storeId }: { storeId: string }) {
  const [state, action] = useActionState(disconnectStore, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Disconnect this store? All synced data will be deleted.")) {
          e.preventDefault();
        }
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="storeId" value={storeId} />
      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      <button
        type="submit"
        className="h-10 w-fit rounded-md border border-red-300 px-4 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
      >
        Disconnect store
      </button>
    </form>
  );
}
