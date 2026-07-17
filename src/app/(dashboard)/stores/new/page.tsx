import { ConnectStoreForm } from "@/components/forms/connect-store-form";

export default function NewStorePage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Connect a store</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Create a custom app in your Shopify admin (Settings → Apps and sales
        channels → Develop apps), grant it read_products, read_orders, and
        read_customers, then paste its credentials below.
      </p>
      <div className="mt-6">
        <ConnectStoreForm />
      </div>
    </div>
  );
}
