import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  await requireOrganization();
  const { storeId } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, shop_domain, store_name, status, currency, shopify_plan_name, last_synced_at")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) notFound();

  const [{ count: productCount }, { count: customerCount }, { count: orderCount }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId),
    ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {store.store_name ?? store.shop_domain}
          </h1>
          <p className="text-sm text-zinc-500">{store.shop_domain}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/stores/${store.id}/sync`}
            className="flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Sync
          </Link>
          <Link
            href={`/stores/${store.id}/settings`}
            className="flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Settings
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">Products</p>
          <p className="text-2xl font-semibold">{productCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">Customers</p>
          <p className="text-2xl font-semibold">{customerCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">Orders</p>
          <p className="text-2xl font-semibold">{orderCount ?? 0}</p>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-zinc-500">Status</dt>
          <dd className="font-medium">{store.status}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Plan</dt>
          <dd className="font-medium">{store.shopify_plan_name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Currency</dt>
          <dd className="font-medium">{store.currency ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Last synced</dt>
          <dd className="font-medium">
            {store.last_synced_at
              ? new Date(store.last_synced_at).toLocaleString()
              : "Never"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
