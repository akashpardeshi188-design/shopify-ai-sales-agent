import Link from "next/link";
import { requireOrganization } from "@/lib/auth/session";

export default async function DashboardPage() {
  const { organization, role } = await requireOrganization();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Signed in to {organization.name} as {role}.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/stores"
          className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black"
        >
          Manage stores
        </Link>
        <Link
          href="/agent"
          className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Configure agent
        </Link>
        <Link
          href="/conversations"
          className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Conversations
        </Link>
        <Link
          href="/insights"
          className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Insights
        </Link>
        <Link
          href="/billing"
          className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Billing
        </Link>
      </div>
    </div>
  );
}
