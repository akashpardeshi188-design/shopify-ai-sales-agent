"use client";

import { useActionState } from "react";
import { updateAgentConfig } from "@/lib/openai/actions";
import { SubmitButton } from "@/components/forms/submit-button";

type AgentConfig = {
  store_id: string;
  display_name: string;
  system_prompt: string;
  tone: "friendly" | "professional" | "playful" | "concise";
  welcome_message: string;
  temperature: number;
  escalation_email: string | null;
  is_enabled: boolean;
};

export function AgentConfigForm({ config }: { config: AgentConfig }) {
  const [state, action] = useActionState(updateAgentConfig, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={config.store_id} />

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="isEnabled"
          defaultChecked={config.is_enabled}
          className="h-4 w-4"
        />
        Agent enabled on storefront
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className="text-sm font-medium">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          defaultValue={config.display_name}
          required
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.displayName && (
          <p className="text-sm text-red-600">{state.errors.displayName[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="welcomeMessage" className="text-sm font-medium">
          Welcome message
        </label>
        <input
          id="welcomeMessage"
          name="welcomeMessage"
          defaultValue={config.welcome_message}
          required
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tone" className="text-sm font-medium">
          Tone
        </label>
        <select
          id="tone"
          name="tone"
          defaultValue={config.tone}
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="friendly">Friendly</option>
          <option value="professional">Professional</option>
          <option value="playful">Playful</option>
          <option value="concise">Concise</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="systemPrompt" className="text-sm font-medium">
          Instructions
        </label>
        <textarea
          id="systemPrompt"
          name="systemPrompt"
          defaultValue={config.system_prompt}
          rows={5}
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.systemPrompt && (
          <p className="text-sm text-red-600">{state.errors.systemPrompt[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="temperature" className="text-sm font-medium">
          Creativity (0 = strict, 2 = creative)
        </label>
        <input
          id="temperature"
          name="temperature"
          type="number"
          min={0}
          max={2}
          step={0.1}
          defaultValue={config.temperature}
          className="h-11 w-32 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="escalationEmail" className="text-sm font-medium">
          Escalation email (optional)
        </label>
        <input
          id="escalationEmail"
          name="escalationEmail"
          type="email"
          defaultValue={config.escalation_email ?? ""}
          placeholder="support@yourstore.com"
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.escalationEmail && (
          <p className="text-sm text-red-600">{state.errors.escalationEmail[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{state.message}</p>
      )}

      <div className="w-fit">
        <SubmitButton pendingText="Saving…">Save</SubmitButton>
      </div>
    </form>
  );
}
