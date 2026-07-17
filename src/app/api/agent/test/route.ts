import { NextResponse, type NextRequest } from "next/server";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { streamAgentReply, toEventStream } from "@/lib/openai/agent";
import { handleEscalation } from "@/lib/openai/escalation";

export async function POST(request: NextRequest) {
  const membership = await requireOrganization();
  const body = await request.json().catch(() => null);
  const message = body?.message;
  const requestedConversationId = body?.conversationId as string | undefined;

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id, shop_domain, currency")
    .eq("organization_id", membership.organization.id)
    .order("connected_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!store) {
    return NextResponse.json({ error: "Connect a store first" }, { status: 400 });
  }

  const { data: agentConfig } = await supabase
    .from("agent_configs")
    .select("model, system_prompt, tone, temperature, escalation_email")
    .eq("store_id", store.id)
    .maybeSingle();
  if (!agentConfig) {
    return NextResponse.json({ error: "Agent not configured" }, { status: 400 });
  }

  // Playground conversations are real conversation/message rows (channel:
  // "playground") so they go through the exact same retrieval + generation
  // path the storefront widget uses — what a merchant sees here is what
  // their customers will see. Writes use the service-role client since
  // conversations/messages have no client-facing write policy.
  const db = createAdminClient();

  let conversationId = requestedConversationId;
  if (conversationId) {
    const { data: existing } = await db
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("store_id", store.id)
      .eq("channel", "playground")
      .maybeSingle();
    if (!existing) conversationId = undefined;
  }

  if (!conversationId) {
    const { data: conversation, error: createError } = await db
      .from("conversations")
      .insert({
        store_id: store.id,
        visitor_id: `playground:${membership.organization.id}`,
        channel: "playground",
      })
      .select("id")
      .single();
    if (createError || !conversation) {
      return NextResponse.json({ error: "Could not start conversation" }, { status: 500 });
    }
    conversationId = conversation.id;
  }
  if (!conversationId) {
    return NextResponse.json({ error: "Could not start conversation" }, { status: 500 });
  }

  const { data: historyRows } = await db
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  await db.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
  });

  const { stream } = await streamAgentReply({
    db,
    storeId: store.id,
    shopDomain: store.shop_domain,
    currency: store.currency,
    agentConfig,
    history: (historyRows ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    userMessage: message,
  });

  const finalConversationId = conversationId;
  const responseBody = toEventStream(stream, async (fullText) => {
    const content = await handleEscalation(db, {
      conversationId: finalConversationId,
      channel: "playground",
      shopDomain: store.shop_domain,
      escalationEmail: agentConfig.escalation_email,
      fullText,
    });
    await db.from("messages").insert({
      conversation_id: finalConversationId,
      role: "assistant",
      content,
    });
  });

  return new Response(responseBody, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Conversation-Id": finalConversationId,
    },
  });
}
