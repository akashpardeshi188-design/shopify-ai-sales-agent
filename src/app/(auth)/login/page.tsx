import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Welcome back to your sales agent dashboard.
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
          Sign up
        </Link>
      </p>
    </div>
  );
}
