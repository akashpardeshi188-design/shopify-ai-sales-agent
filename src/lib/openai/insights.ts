import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CHAT_MODEL, getOpenAIClient } from "@/lib/openai/client";

type OrderLineItem = { title: string; quantity: number; price: string | null };

const INSIGHT_INSTRUCTIONS = `You are a sales analyst summarizing a Shopify store's last 7 days for the merchant who owns it. Write 2-3 short paragraphs in plain text (no markdown headers, no bullet preamble): what happened, what stood out, and 1-2 concrete, actionable suggestions. Reference the actual numbers given. If a number is zero, say so plainly rather than padding the summary.`;

export async function generateInsight(db: SupabaseClient, storeId: string) {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [{ data: orders }, { data: conversations }, { count: messageCount }] = await Promise.all([
    db
      .from("orders")
      .select("total_price, currency, line_items")
      .eq("store_id", storeId)
      .gte("created_at", periodStart.toISOString()),
    db
      .from("conversations")
      .select("id, status")
      .eq("store_id", storeId)
      .gte("started_at", periodStart.toISOString()),
    db
      .from("messages")
      .select("id, conversations!inner(store_id)", { count: "exact", head: true })
      .eq("conversations.store_id", storeId)
      .gte("created_at", periodStart.toISOString()),
  ]);

  const productTotals = new Map<string, { quantity: number; revenue: number }>();
  let totalRevenue = 0;
  let currency: string | null = null;

  for (const order of orders ?? []) {
    totalRevenue += Number(order.total_price ?? 0);
    currency = currency ?? order.currency ?? null;
    for (const item of (order.line_items as OrderLineItem[]) ?? []) {
      const entry = productTotals.get(item.title) ?? { quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += Number(item.price ?? 0) * item.quantity;
      productTotals.set(item.title, entry);
    }
  }

  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([title, stats]) => ({ title, ...stats }));

  const summaryData = {
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
    orderCount: orders?.length ?? 0,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    currency,
    conversationCount: conversations?.length ?? 0,
    escalatedConversationCount: (conversations ?? []).filter((c) => c.status === "escalated").length,
    messageCount: messageCount ?? 0,
    topProducts,
  };

  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: DEFAULT_CHAT_MODEL,
    instructions: INSIGHT_INSTRUCTIONS,
    input: JSON.stringify(summaryData),
  });

  const { data: insight, error } = await db
    .from("insights")
    .insert({
      store_id: storeId,
      type: "weekly_summary",
      title: `Week of ${summaryData.periodStart}`,
      content: response.output_text,
      data: summaryData,
      period_start: summaryData.periodStart,
      period_end: summaryData.periodEnd,
    })
    .select("id, title, content, generated_at")
    .single();
  if (error) throw error;

  return insight;
}
