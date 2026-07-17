"use client";

import { useActionState } from "react";
import { generateInsightAction } from "@/lib/openai/actions";
import { SubmitButton } from "@/components/forms/submit-button";

export function GenerateInsightForm({ storeId }: { storeId: string }) {
  const [state, action] = useActionState(generateInsightAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="storeId" value={storeId} />
      {state?.message && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{state.message}</p>
      )}
      <div className="w-fit">
        <SubmitButton pendingText="Generating…">Generate insight</SubmitButton>
      </div>
    </form>
  );
}
