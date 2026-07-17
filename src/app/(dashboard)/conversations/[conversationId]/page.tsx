import { notFound } from "next/navigation";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  await requireOrganization();
  const { conversationId } = await params;
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, channel, status, started_at, customer_email, stores(shop_domain)")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const store = Array.isArray(conversation.stores) ? conversation.stores[0] : conversation.stores;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {conversation.customer_email ?? "Anonymous visitor"}
          </h1>
          <p className="text-sm text-zinc-500">
            {store?.shop_domain} · {conversation.channel} ·{" "}
            {new Date(conversation.started_at).toLocaleString()}
          </p>
        </div>
        <span className="text-xs font-medium text-zinc-500">{conversation.status}</span>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {(messages ?? [])
          .filter((m) => m.role !== "system")
          .map((message) => (
            <div
              key={message.id}
              className={
                "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm " +
                (message.role === "user"
                  ? "bg-zinc-100 dark:bg-zinc-900"
                  : "ml-auto bg-zinc-900 text-white dark:bg-zinc-50 dark:text-black")
              }
            >
              {message.content}
            </div>
          ))}
      </div>
    </div>
  );
}
