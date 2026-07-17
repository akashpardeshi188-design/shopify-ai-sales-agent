"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
}: {
  children: React.ReactNode;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
    >
      {pending ? (pendingText ?? "Please wait…") : children}
    </button>
  );
}
