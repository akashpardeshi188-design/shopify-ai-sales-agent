import type { SupabaseClient } from "@supabase/supabase-js";
import { EMBEDDING_MODEL, getOpenAIClient } from "@/lib/openai/client";

export async function embedText(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

function productEmbeddingContent(product: {
  title: string;
  description: string | null;
  vendor: string | null;
  product_type: string | null;
  tags: string[];
}) {
  return [
    product.title,
    product.vendor,
    product.product_type,
    product.tags?.join(", "),
    product.description,
  ]
    .filter(Boolean)
    .join("\n");
}

// Embeds any product the store has synced that doesn't have an embedding yet,
// or whose embedding predates the product's last update. Deliberately
// separate from lib/shopify/sync.ts — embedding is an OpenAI-billed operation
// the merchant should trigger explicitly, not something that rides along
// with every Shopify sync.
export async function indexStoreProducts(db: SupabaseClient, storeId: string) {
  const { data: products, error } = await db
    .from("products")
    .select(
      "id, title, description, vendor, product_type, tags, updated_at, product_embeddings(updated_at)"
    )
    .eq("store_id", storeId)
    .eq("status", "active");
  if (error) throw error;

  const stale = products.filter((p) => {
    const embedding = Array.isArray(p.product_embeddings)
      ? p.product_embeddings[0]
      : p.product_embeddings;
    if (!embedding) return true;
    return new Date(embedding.updated_at) < new Date(p.updated_at);
  });

  let indexed = 0;
  for (const product of stale) {
    const content = productEmbeddingContent(product);
    const embedding = await embedText(content);
    const { error: upsertError } = await db.from("product_embeddings").upsert({
      product_id: product.id,
      content,
      embedding,
      updated_at: new Date().toISOString(),
    });
    if (!upsertError) indexed += 1;
  }

  return { total: products.length, indexed };
}
