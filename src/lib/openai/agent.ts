import type { SupabaseClient } from "@supabase/supabase-js";
import { getOpenAIClient } from "@/lib/openai/client";
import { formatContextForPrompt, retrieveContext } from "@/lib/openai/retrieval";
import { ESCALATION_MARKER } from "@/lib/openai/constants";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type AgentConfig = {
  model: string;
  system_prompt: string;
  tone: string;
  temperature: number;
  escalation_email: string | null;
};

const TONE_GUIDANCE: Record<string, string> = {
  friendly: "Be warm, upbeat, and conversational.",
  professional: "Be polished, concise, and businesslike.",
  playful: "Be light-hearted and show some personality, without being unprofessional.",
  concise: "Keep every reply as short as possible while still being helpful.",
};

function buildInstructions(agentConfig: AgentConfig, contextBlock: string) {
  const escalation = agentConfig.escalation_email
    ? `If you cannot resolve the customer's issue, let them know you'll connect them with the team, then end your entire reply with the exact text ${ESCALATION_MARKER} on its own line.`
    : `If you cannot resolve the customer's issue, let them know a team member will follow up, then end your entire reply with the exact text ${ESCALATION_MARKER} on its own line.`;

  return [
    agentConfig.system_prompt,
    TONE_GUIDANCE[agentConfig.tone] ?? "",
    "Only state product facts (names, prices, descriptions) and policies that appear in the context below — never invent products, prices, or policies that aren't there.",
    "Keep replies short enough for a chat widget: a few sentences, occasionally a short list.",
    escalation,
    "",
    contextBlock,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function streamAgentReply({
  db,
  storeId,
  shopDomain,
  currency,
  agentConfig,
  history,
  userMessage,
}: {
  db: SupabaseClient;
  storeId: string;
  shopDomain: string;
  currency: string | null;
  agentConfig: AgentConfig;
  history: ChatTurn[];
  userMessage: string;
}) {
  const { products, knowledge } = await retrieveContext(db, storeId, userMessage);
  const contextBlock = formatContextForPrompt(shopDomain, currency, products, knowledge);
  const instructions = buildInstructions(agentConfig, contextBlock);

  const openai = getOpenAIClient();
  const stream = await openai.responses.create({
    model: agentConfig.model,
    instructions,
    temperature: agentConfig.temperature,
    input: [...history, { role: "user", content: userMessage }],
    stream: true,
  });

  return { stream, matchedProducts: products };
}

// Converts the Responses API event stream into a plain text byte stream —
// the widget and playground just want the assistant's words, not OpenAI's
// event schema. `onComplete` receives the full accumulated text once the
// stream ends, for persisting the assistant message.
export function toEventStream(
  stream: AsyncIterable<{ type: string; delta?: string }>,
  onComplete: (fullText: string) => Promise<void> | void
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let fullText = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "response.output_text.delta" && event.delta) {
            fullText += event.delta;
            controller.enqueue(encoder.encode(event.delta));
          }
        }
        await onComplete(fullText);
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
