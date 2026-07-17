"use client";

import { useEffect } from "react";
import { useStreamingChat } from "@/components/chat/use-streaming-chat";
import { ChatThread } from "@/components/chat/chat-thread";

function getOrCreateVisitorId(widgetKey: string) {
  const storageKey = `agent_visitor_id:${widgetKey}`;
  let id = localStorage.getItem(storageKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(storageKey, id);
  }
  return id;
}

export function StorefrontWidget({
  widgetKey,
  displayName,
  welcomeMessage,
}: {
  widgetKey: string;
  displayName: string;
  welcomeMessage: string;
}) {
  // Only ever read inside event handlers (sendMessage), never during render,
  // so there's no SSR/hydration concern accessing localStorage here.
  const { messages, isStreaming, sendMessage, conversationId } = useStreamingChat({
    endpoint: "/api/widget/chat",
    initialMessages: [{ role: "assistant", content: welcomeMessage }],
    buildBody: (message, storedConversationId) => ({
      widgetKey,
      visitorId: getOrCreateVisitorId(widgetKey),
      message,
      conversationId:
        storedConversationId ?? localStorage.getItem(`agent_conversation_id:${widgetKey}`),
    }),
  });

  // Persist the conversation id as soon as the server assigns one.
  useEffect(() => {
    const id = conversationId.current;
    if (id) localStorage.setItem(`agent_conversation_id:${widgetKey}`, id);
  }, [conversationId, widgetKey, messages.length]);

  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="border-b border-zinc-200 px-4 py-3">
        <p className="text-sm font-medium">{displayName}</p>
      </header>
      <ChatThread messages={messages} isStreaming={isStreaming} onSend={sendMessage} />
    </div>
  );
}
