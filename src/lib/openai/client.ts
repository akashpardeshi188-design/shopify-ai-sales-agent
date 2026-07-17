import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const DEFAULT_CHAT_MODEL = "gpt-5.4-mini";
