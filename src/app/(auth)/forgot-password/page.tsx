import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-zinc-500">
          We&apos;ll email you a link to set a new password.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-zinc-500">
        <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
