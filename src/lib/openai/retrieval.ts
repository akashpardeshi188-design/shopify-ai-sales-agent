import type { SupabaseClient } from "@supabase/supabase-js";
import { embedText } from "@/lib/openai/embeddings";

export type MatchedProduct = {
  product_id: string;
  title: string;
  handle: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  image_url: string | null;
  similarity: number;
};

export type MatchedKnowledge = {
  knowledge_id: string;
  question: string;
  answer: string;
  similarity: number;
};

export async function retrieveContext(
  db: SupabaseClient,
  storeId: string,
  query: string
) {
  const queryEmbedding = await embedText(query);

  const [{ data: products }, { data: knowledge }] = await Promise.all([
    db.rpc("match_products", {
      p_store_id: storeId,
      p_query_embedding: queryEmbedding,
      p_match_count: 5,
    }),
    db.rpc("match_agent_knowledge", {
      p_store_id: storeId,
      p_query_embedding: queryEmbedding,
      p_match_count: 3,
    }),
  ]);

  return {
    products: (products ?? []) as MatchedProduct[],
    knowledge: (knowledge ?? []) as MatchedKnowledge[],
  };
}

export function formatContextForPrompt(
  shopDomain: string,
  currency: string | null,
  products: MatchedProduct[],
  knowledge: MatchedKnowledge[]
) {
  const productBlock = products.length
    ? products
        .map((p) => {
          const price =
            p.price_min === p.price_max
              ? `${p.price_min} ${currency ?? ""}`
              : `${p.price_min}–${p.price_max} ${currency ?? ""}`;
          return `- ${p.title} (${price.trim()}): ${p.description?.slice(0, 200) ?? "No description."} — https://${shopDomain}/products/${p.handle}`;
        })
        .join("\n")
    : "No matching products found in the catalog.";

  const knowledgeBlock = knowledge.length
    ? knowledge.map((k) => `Q: ${k.question}\nA: ${k.answer}`).join("\n\n")
    : "";

  return [
    "Relevant products from the store catalog:",
    productBlock,
    knowledgeBlock && "Relevant store policies/FAQs:",
    knowledgeBlock,
  ]
    .filter(Boolean)
    .join("\n\n");
}
