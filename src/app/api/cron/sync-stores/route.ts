import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runFullSync } from "@/lib/shopify/sync";
import { isAuthorizedCronRequest } from "@/lib/cron";

export async function POST(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: stores } = await db.from("stores").select("id").eq("status", "active");

  const results = await Promise.allSettled(
    (stores ?? []).map((store) => runFullSync(store.id))
  );

  return NextResponse.json({
    synced: results.length,
    failed: results.filter((r) => r.status === "rejected").length,
  });
}
