"use client";

import { useStreamingChat } from "@/components/chat/use-streaming-chat";
import { ChatThread } from "@/components/chat/chat-thread";

export function PlaygroundChat() {
  const { messages, isStreaming, sendMessage } = useStreamingChat({
    endpoint: "/api/agent/test",
    initialMessages: [
      { role: "assistant", content: "Ask me anything a customer might — I'll answer using your real catalog." },
    ],
    buildBody: (message, conversationId) => ({ message, conversationId }),
  });

  return (
    <div className="h-[600px] rounded-lg border border-zinc-200 dark:border-zinc-800">
      <ChatThread messages={messages} isStreaming={isStreaming} onSend={sendMessage} />
    </div>
  );
}
