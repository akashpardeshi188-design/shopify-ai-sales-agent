import { escapeHtml } from "@/lib/utils";

export function escalationEmail({
  storeName,
  conversationUrl,
  transcript,
}: {
  storeName: string;
  conversationUrl: string;
  transcript: string;
}) {
  return {
    subject: `A customer needs your help — ${storeName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #18181b;">
        <h1 style="font-size: 18px;">Your AI agent couldn't resolve a customer's question</h1>
        <p>Store: <strong>${escapeHtml(storeName)}</strong></p>
        <p style="white-space: pre-wrap; background: #f4f4f5; padding: 12px; border-radius: 8px; font-size: 14px;">${escapeHtml(transcript)}</p>
        <p><a href="${conversationUrl}">View the full conversation →</a></p>
      </div>
    `,
  };
}
