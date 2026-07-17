import type { NextRequest } from "next/server";

// Shared bearer-token check for endpoints meant to be hit by an external
// scheduler (Vercel Cron, GitHub Actions, cron-job.org, etc.), not a browser.
export function isAuthorizedCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
