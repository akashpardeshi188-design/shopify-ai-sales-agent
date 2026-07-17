import Link from "next/link";
import { SignupForm } from "@/components/forms/signup-form";

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Set up an AI sales agent for your Shopify store.
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
          Sign in
        </Link>
      </p>
    </div>
  );
}
