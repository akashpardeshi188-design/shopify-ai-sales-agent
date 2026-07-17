import { redirect } from "next/navigation";
import { getCurrentMembership, requireUser } from "@/lib/auth/session";
import { OnboardingForm } from "@/components/forms/onboarding-form";

export default async function OnboardingPage() {
  await requireUser();

  // Already has a workspace — nothing to onboard.
  const membership = await getCurrentMembership();
  if (membership) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Set up your workspace</h1>
          <p className="mt-1 text-sm text-zinc-500">
            This becomes the account your team and connected stores belong to.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
