import { requireUser } from "@/lib/auth/session";
import { UpdatePasswordForm } from "@/components/forms/update-password-form";

export default async function UpdatePasswordPage() {
  // Reached only via the recovery-link callback, which already established a
  // session — if there isn't one, the user followed a stale or invalid link.
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Choose a new password</h1>
      </div>
      <UpdatePasswordForm />
    </div>
  );
}
