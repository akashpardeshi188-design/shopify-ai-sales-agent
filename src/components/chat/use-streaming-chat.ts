"use client";

import { useRef, useState } from "react";

export type ChatMessage = { role: "user" | "assistant"; content: string };

// Shared by the public storefront widget and the authenticated playground —
// both stream plain text from their respective API route and just need to
// append it to the last assistant bubble as it arrives.
export function useStreamingChat({
  endpoint,
  initialMessages = [],
  buildBody,
}: {
  endpoint: string;
  initialMessages?: ChatMessage[];
  buildBody: (message: string, conversationId: string | null) => Record<string, unknown>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationIdRef = useRef<string | null>(null);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;

    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(text, conversationIdRef.current)),
      });

      const conversationId = res.headers.get("X-Conversation-Id");
      if (conversationId) conversationIdRef.current = conversationId;

      if (!res.ok || !res.body) {
        throw new Error("Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { role: "assistant", content: last.content + chunk };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return { messages, isStreaming, sendMessage, conversationId: conversationIdRef };
}
