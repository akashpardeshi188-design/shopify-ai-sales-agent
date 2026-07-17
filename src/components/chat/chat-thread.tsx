"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/components/chat/use-streaming-chat";
import { ESCALATION_MARKER } from "@/lib/openai/constants";

// The marker can arrive mid-stream (it's appended at the end of the raw
// text) — strip it from what's rendered even before the stream finishes.
function displayContent(content: string) {
  return content.split(ESCALATION_MARKER).join("").trim();
}

export function ChatThread({
  messages,
  isStreaming,
  onSend,
}: {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSend: (text: string) => void;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm " +
              (m.role === "user"
                ? "ml-auto bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50")
            }
          >
            {displayContent(m.content) || (isStreaming && i === messages.length - 1 ? "…" : "")}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          onSend(input);
          setInput("");
        }}
        className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={isStreaming}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
        >
          Send
        </button>
      </form>
    </div>
  );
}
