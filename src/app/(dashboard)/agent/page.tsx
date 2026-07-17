import Link from "next/link";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AgentConfigForm } from "@/components/forms/agent-config-form";
import { IndexProductsForm } from "@/components/forms/index-products-form";

export default async function AgentPage() {
  const membership = await requireOrganization();
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, widget_public_key")
    .eq("organization_id", membership.organization.id)
    .order("connected_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!store) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Agent</h1>
        <p className="mt-2 text-sm text-zinc-500">
          <Link href="/stores/new" className="font-medium underline">
            Connect a store
          </Link>{" "}
          before configuring the sales agent.
        </p>
      </div>
    );
  }

  const { data: config } = await supabase
    .from("agent_configs")
    .select(
      "store_id, display_name, system_prompt, tone, welcome_message, temperature, escalation_email, is_enabled"
    )
    .eq("store_id", store.id)
    .single();

  const embedSnippet = `<script src="${process.env.APP_URL}/widget.js" data-key="${store.widget_public_key}" async></script>`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agent</h1>
        <Link
          href="/agent/playground"
          className="flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Test in playground
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium">Embed on your storefront</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Paste this before <code>&lt;/body&gt;</code> in your theme.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
          {embedSnippet}
        </pre>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium">Product knowledge</h2>
        <p className="mt-1 text-sm text-zinc-500">
          The agent only recommends products it has indexed. Re-run this
          after syncing new or updated products.
        </p>
        <div className="mt-3">
          <IndexProductsForm storeId={store.id} />
        </div>
      </section>

      <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-sm font-medium">Behavior</h2>
        <div className="mt-3">
          <AgentConfigForm config={config!} />
        </div>
      </section>
    </div>
  );
}
