import { requireOrganization } from "@/lib/auth/session";
import { logout } from "@/lib/auth/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organization } = await requireOrganization();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <span className="text-sm font-medium">{organization.name}</span>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
