import { notFound } from "next/navigation";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DisconnectStoreForm } from "@/components/forms/disconnect-store-form";

export default async function StoreSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  await requireOrganization();
  const { storeId } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, shop_domain, scopes, status, connected_at")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) notFound();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Store settings</h1>

      <dl className="mt-6 grid gap-3 text-sm">
        <div>
          <dt className="text-zinc-500">Domain</dt>
          <dd className="font-medium">{store.shop_domain}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Granted scopes</dt>
          <dd className="font-medium">{store.scopes ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Connected</dt>
          <dd className="font-medium">
            {new Date(store.connected_at).toLocaleString()}
          </dd>
        </div>
      </dl>

      <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-red-600">Danger zone</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Disconnecting removes the access token and deletes all synced
          products, customers, orders, and conversations for this store.
        </p>
        <div className="mt-4">
          <DisconnectStoreForm storeId={store.id} />
        </div>
      </div>
    </div>
  );
}
