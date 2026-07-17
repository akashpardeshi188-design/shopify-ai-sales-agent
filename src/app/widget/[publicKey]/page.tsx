import { createAdminClient } from "@/lib/supabase/admin";
import { StorefrontWidget } from "@/components/chat/storefront-widget";

type AgentConfigRow = {
  display_name: string;
  welcome_message: string;
  is_enabled: boolean;
};

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ publicKey: string }>;
}) {
  const { publicKey } = await params;
  const db = createAdminClient();

  const { data: store } = await db
    .from("stores")
    .select("status, agent_configs(display_name, welcome_message, is_enabled)")
    .eq("widget_public_key", publicKey)
    .maybeSingle();

  const agentConfig = (
    Array.isArray(store?.agent_configs) ? store?.agent_configs[0] : store?.agent_configs
  ) as AgentConfigRow | undefined;

  if (!store || store.status !== "active" || !agentConfig?.is_enabled) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-4 text-center text-sm text-zinc-500">
        Chat is currently unavailable.
      </div>
    );
  }

  return (
    <StorefrontWidget
      widgetKey={publicKey}
      displayName={agentConfig.display_name}
      welcomeMessage={agentConfig.welcome_message}
    />
  );
}
