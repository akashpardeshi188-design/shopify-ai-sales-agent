import { NextRequest, NextResponse } from "next/server";
import { buildInstallUrl, generateState } from "@/lib/shopify/oauth";

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get("shop");

  if (!shop) {
    return NextResponse.json(
      { error: "Missing shop parameter" },
      { status: 400 }
    );
  }

  const state = generateState();

  const response = NextResponse.redirect(buildInstallUrl(shop, state));

  response.cookies.set("shopify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}