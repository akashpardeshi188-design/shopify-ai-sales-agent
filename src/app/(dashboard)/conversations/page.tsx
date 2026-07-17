import Link from "next/link";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function ConversationsPage() {
  await requireOrganization();
  const supabase = await createClient();

  // No manual store filtering needed — the conversations_select RLS policy
  // already scopes results to stores this org owns.
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, channel, status, started_at, customer_email, stores(shop_domain)")
    .order("started_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Conversations</h1>

      {!conversations?.length ? (
        <p className="mt-8 text-sm text-zinc-500">No conversations yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {conversations.map((conversation) => {
            const store = Array.isArray(conversation.stores)
              ? conversation.stores[0]
              : conversation.stores;
            return (
              <li key={conversation.id}>
                <Link
                  href={`/conversations/${conversation.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {conversation.customer_email ?? "Anonymous visitor"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {store?.shop_domain} · {conversation.channel} ·{" "}
                      {new Date(conversation.started_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={
                      "text-xs font-medium " +
                      (conversation.status === "escalated"
                        ? "text-red-600"
                        : conversation.status === "closed"
                          ? "text-zinc-500"
                          : "text-green-600")
                    }
                  >
                    {conversation.status}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
