import { notFound } from "next/navigation";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SyncNowForm } from "@/components/forms/sync-now-form";

export default async function StoreSyncPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  await requireOrganization();
  const { storeId } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, shop_domain")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) notFound();

  const { data: logs } = await supabase
    .from("store_sync_logs")
    .select("id, sync_type, status, records_synced, error_message, started_at, finished_at")
    .eq("store_id", storeId)
    .order("started_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sync</h1>
        <SyncNowForm storeId={store.id} />
      </div>

      {!logs?.length ? (
        <p className="mt-8 text-sm text-zinc-500">No syncs yet.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Records</th>
              <th className="py-2 font-medium">Started</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2">{log.sync_type}</td>
                <td className="py-2">
                  <span
                    className={
                      log.status === "succeeded"
                        ? "text-green-600"
                        : log.status === "failed"
                          ? "text-red-600"
                          : "text-zinc-500"
                    }
                  >
                    {log.status}
                  </span>
                  {log.error_message && (
                    <p className="text-xs text-red-500">{log.error_message}</p>
                  )}
                </td>
                <td className="py-2">{log.records_synced}</td>
                <td className="py-2">
                  {new Date(log.started_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
