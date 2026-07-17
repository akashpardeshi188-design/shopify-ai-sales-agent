import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { streamAgentReply, toEventStream } from "@/lib/openai/agent";
import { handleEscalation } from "@/lib/openai/escalation";
import { isOverMessageLimit, recordAgentMessageUsage } from "@/lib/stripe/usage";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONVERSATION_MESSAGES = 200;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const widgetKey = body?.widgetKey;
  const visitorId = body?.visitorId;
  const message = body?.message;
  const requestedConversationId = body?.conversationId as string | undefined;

  if (
    typeof widgetKey !== "string" ||
    typeof visitorId !== "string" ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: store } = await db
    .from("stores")
    .select("id, shop_domain, currency, status, organization_id, organizations(plan, subscription_status)")
    .eq("widget_public_key", widgetKey)
    .maybeSingle();
  if (!store || store.status !== "active") {
    return NextResponse.json({ error: "Chat unavailable" }, { status: 404 });
  }

  const organization = Array.isArray(store.organizations) ? store.organizations[0] : store.organizations;
  if (!organization || organization.subscription_status === "canceled") {
    return NextResponse.json({ error: "Chat unavailable" }, { status: 404 });
  }
  if (await isOverMessageLimit(db, store.organization_id, organization.plan)) {
    return NextResponse.json(
      { error: "This store has reached its plan's monthly message limit." },
      { status: 429 }
    );
  }

  const { data: agentConfig } = await db
    .from("agent_configs")
    .select("model, system_prompt, tone, temperature, escalation_email, is_enabled")
    .eq("store_id", store.id)
    .maybeSingle();
  if (!agentConfig?.is_enabled) {
    return NextResponse.json({ error: "Chat unavailable" }, { status: 404 });
  }

  // Only reuse a conversation id if it actually belongs to this store AND
  // visitor — otherwise a guessed/stale id would let one visitor read into
  // another visitor's chat history.
  let conversationId: string | undefined;
  if (requestedConversationId) {
    const { data: existing } = await db
      .from("conversations")
      .select("id")
      .eq("id", requestedConversationId)
      .eq("store_id", store.id)
      .eq("visitor_id", visitorId)
      .maybeSingle();
    conversationId = existing?.id;
  }

  if (!conversationId) {
    const { data: conversation, error: createError } = await db
      .from("conversations")
      .insert({ store_id: store.id, visitor_id: visitorId, channel: "storefront_widget" })
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

  const { count } = await db
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", conversationId);
  if ((count ?? 0) >= MAX_CONVERSATION_MESSAGES) {
    return NextResponse.json({ error: "Conversation limit reached" }, { status: 429 });
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
  await recordAgentMessageUsage(db, store.organization_id, store.id);

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
      channel: "storefront_widget",
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
