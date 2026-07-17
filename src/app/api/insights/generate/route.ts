import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInsight } from "@/lib/openai/insights";
import { isAuthorizedCronRequest } from "@/lib/cron";

export async function POST(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: stores } = await db.from("stores").select("id").eq("status", "active");

  const results = await Promise.allSettled(
    (stores ?? []).map((store) => generateInsight(db, store.id))
  );

  return NextResponse.json({
    generated: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  });
}
