"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { agentConfigSchema } from "@/lib/validations/agent";
import { indexStoreProducts } from "@/lib/openai/embeddings";
import { generateInsight } from "@/lib/openai/insights";
import type { FormState } from "@/lib/auth/actions";

export async function updateAgentConfig(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  await requireOrganization();
  const storeId = formData.get("storeId") as string;

  const validated = agentConfigSchema.safeParse({
    displayName: formData.get("displayName"),
    systemPrompt: formData.get("systemPrompt"),
    tone: formData.get("tone"),
    welcomeMessage: formData.get("welcomeMessage"),
    temperature: formData.get("temperature"),
    escalationEmail: formData.get("escalationEmail"),
    isEnabled: formData.get("isEnabled"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  // RLS (agent_configs_update_admin) enforces org-admin-only — user-scoped
  // client, no service role needed for a merchant editing their own config.
  const supabase = await createClient();
  const { error } = await supabase
    .from("agent_configs")
    .update({
      display_name: validated.data.displayName,
      system_prompt: validated.data.systemPrompt,
      tone: validated.data.tone,
      welcome_message: validated.data.welcomeMessage,
      temperature: validated.data.temperature,
      escalation_email: validated.data.escalationEmail || null,
      is_enabled: validated.data.isEnabled,
    })
    .eq("store_id", storeId);
  if (error) return { message: error.message };

  revalidatePath("/agent");
  return { message: "Saved." };
}

export async function indexProducts(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const storeId = formData.get("storeId") as string;

  // indexStoreProducts runs on the service-role client (writes to a table
  // with no client-facing policies) — confirm the caller can see this store
  // via RLS before spending OpenAI calls on its behalf.
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) return { message: "Store not found." };

  const db = createAdminClient();
  try {
    const result = await indexStoreProducts(db, storeId);
    revalidatePath("/agent");
    return { message: `Indexed ${result.indexed} of ${result.total} active products.` };
  } catch (err) {
    return { message: err instanceof Error ? err.message : "Indexing failed." };
  }
}

export async function generateInsightAction(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const storeId = formData.get("storeId") as string;

  // generateInsight reads/writes via the service-role client — confirm the
  // caller can see this store via RLS before spending an OpenAI call on it.
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) return { message: "Store not found." };

  const db = createAdminClient();
  try {
    await generateInsight(db, storeId);
    revalidatePath("/insights");
    return { message: "Insight generated." };
  } catch (err) {
    return { message: err instanceof Error ? err.message : "Could not generate insight." };
  }
}
