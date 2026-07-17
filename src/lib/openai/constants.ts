// Appended by the model to signal a human needs to follow up. Shared by both
// server code (lib/openai/agent.ts, lib/openai/escalation.ts) and the chat
// UI (components/chat/chat-thread.tsx) — kept in its own file with no other
// imports so the client component never pulls in server-only OpenAI/Supabase
// modules just to read this string.
export const ESCALATION_MARKER = "[[ESCALATE]]";
