export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">AI Sales Agent Dashboard</h1>
        <p className="text-gray-500">
          Welcome back! Here's an overview of your account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-6 shadow">
          <h2 className="text-sm text-gray-500">Current Plan</h2>
          <p className="mt-2 text-2xl font-bold">Starter</p>
        </div>

        <div className="rounded-xl border p-6 shadow">
          <h2 className="text-sm text-gray-500">Monthly Usage</h2>
          <p className="mt-2 text-2xl font-bold">0 / 500</p>
        </div>

        <div className="rounded-xl border p-6 shadow">
          <h2 className="text-sm text-gray-500">Total Conversations</h2>
          <p className="mt-2 text-2xl font-bold">0</p>
        </div>
      </div>

      <div className="rounded-xl border p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Quick Access</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <a href="/profile" className="rounded border p-3">
            👤 Profile
          </a>

          <a href="/billing" className="rounded border p-3">
            💳 Billing
          </a>

          <a href="/insights" className="rounded border p-3">
            📊 Analytics
          </a>

          <a href="/settings" className="rounded border p-3">
            ⚙️ Settings
          </a>
        </div>
      </div>
    </div>
  );
}