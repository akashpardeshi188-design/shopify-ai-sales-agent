import Link from "next/link";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function StoresPage() {
  await requireOrganization();
  const supabase = await createClient();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, shop_domain, store_name, status, last_synced_at")
    .order("connected_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stores</h1>
        <Link
          href="/stores/new"
          className="flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black"
        >
          Connect a store
        </Link>
      </div>

      {!stores?.length ? (
        <p className="mt-8 text-sm text-zinc-500">
          No stores connected yet.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {stores.map((store) => (
            <li key={store.id}>
              <Link
                href={`/stores/${store.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div>
                  <p className="text-sm font-medium">
                    {store.store_name ?? store.shop_domain}
                  </p>
                  <p className="text-xs text-zinc-500">{store.shop_domain}</p>
                </div>
                <span
                  className={
                    "text-xs font-medium " +
                    (store.status === "active"
                      ? "text-green-600"
                      : store.status === "error"
                        ? "text-red-600"
                        : "text-zinc-500")
                  }
                >
                  {store.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
