import { PlaygroundChat } from "@/components/chat/playground-chat";

export default function AgentPlaygroundPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Playground</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Try the agent exactly as a customer would see it on your storefront.
      </p>
      <div className="mt-6">
        <PlaygroundChat />
      </div>
    </div>
  );
}
