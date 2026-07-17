import Link from "next/link";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { GenerateInsightForm } from "@/components/forms/generate-insight-form";

const DAYS = 14;

function dateKey(value: string) {
  return value.slice(0, 10);
}

function getSinceISOString(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function buildSeries(days: number) {
  const series = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    series.set(d.toISOString().slice(0, 10), 0);
  }
  return series;
}

export default async function InsightsPage() {
  const membership = await requireOrganization();
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, store_name, shop_domain")
    .eq("organization_id", membership.organization.id)
    .order("connected_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!store) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Insights</h1>
        <p className="mt-2 text-sm text-zinc-500">
          <Link href="/stores/new" className="font-medium underline">
            Connect a store
          </Link>{" "}
          to see analytics here.
        </p>
      </div>
    );
  }

  const since = getSinceISOString(DAYS);

  const [{ data: orders }, { data: conversations }, { data: insights }] = await Promise.all([
    supabase
      .from("orders")
      .select("total_price, created_at")
      .eq("store_id", store.id)
      .gte("created_at", since),
    supabase
      .from("conversations")
      .select("started_at")
      .eq("store_id", store.id)
      .gte("started_at", since),
    supabase
      .from("insights")
      .select("id, title, content, generated_at")
      .eq("store_id", store.id)
      .order("generated_at", { ascending: false })
      .limit(10),
  ]);

  const revenueSeries = buildSeries(DAYS);
  for (const order of orders ?? []) {
    const key = dateKey(order.created_at);
    if (revenueSeries.has(key)) {
      revenueSeries.set(key, (revenueSeries.get(key) ?? 0) + Number(order.total_price ?? 0));
    }
  }

  const conversationSeries = buildSeries(DAYS);
  for (const conversation of conversations ?? []) {
    const key = dateKey(conversation.started_at);
    if (conversationSeries.has(key)) {
      conversationSeries.set(key, (conversationSeries.get(key) ?? 0) + 1);
    }
  }

  const revenueData = [...revenueSeries.entries()].map(([date, value]) => ({
    date,
    value: Math.round(value * 100) / 100,
  }));
  const conversationData = [...conversationSeries.entries()].map(([date, value]) => ({
    date,
    value,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Insights</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {store.store_name ?? store.shop_domain} — last {DAYS} days
      </p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium">Revenue</h2>
          <TimeSeriesChart data={revenueData} valueLabel="Revenue" color="#16a34a" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Agent conversations</h2>
          <TimeSeriesChart data={conversationData} valueLabel="Conversations" color="#2563eb" />
        </div>
      </div>

      <section className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">AI-generated summaries</h2>
          <GenerateInsightForm storeId={store.id} />
        </div>

        {!insights?.length ? (
          <p className="mt-4 text-sm text-zinc-500">No summaries yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {insights.map((insight) => (
              <li
                key={insight.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(insight.generated_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                  {insight.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
