import type { SupabaseClient } from "@supabase/supabase-js";
import { ESCALATION_MARKER } from "@/lib/openai/constants";
import { sendEscalationEmail } from "@/lib/resend/send";

// Called from each chat route's stream-completion callback with the raw
// assistant text. Strips the marker, records the escalation, and (for real
// customer conversations only — not the merchant's own playground testing)
// emails the store's configured escalation address. Returns the text that
// should actually be persisted as the stored message.
export async function handleEscalation(
  db: SupabaseClient,
  params: {
    conversationId: string;
    channel: "storefront_widget" | "playground";
    shopDomain: string;
    escalationEmail: string | null;
    fullText: string;
  }
): Promise<string> {
  if (!params.fullText.includes(ESCALATION_MARKER)) {
    return params.fullText;
  }

  const cleaned = params.fullText.split(ESCALATION_MARKER).join("").trim();

  await db.from("conversations").update({ status: "escalated" }).eq("id", params.conversationId);
  await db.from("conversation_events").insert({
    conversation_id: params.conversationId,
    event_type: "escalated_to_human",
    metadata: {},
  });

  if (params.channel === "storefront_widget" && params.escalationEmail) {
    await sendEscalationEmail(params.escalationEmail, {
      storeName: params.shopDomain,
      conversationId: params.conversationId,
      transcript: cleaned,
    });
  }

  return cleaned;
}
