import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const hmac = url.searchParams.get("hmac");

  if (!shop || !code || !state || !hmac) {
    return NextResponse.json(
      { error: "Missing OAuth parameters" },
      { status: 400 }
    );
  }

  const cookieState = request.cookies.get("shopify_oauth_state")?.value;

  if (!cookieState || cookieState !== state) {
    return NextResponse.json(
      { error: "Invalid state" },
      { status: 400 }
    );
  }

  const params = [...url.searchParams.entries()]
    .filter(([key]) => key !== "hmac")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const generatedHmac = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
    .update(params)
    .digest("hex");

  if (generatedHmac !== hmac) {
    return NextResponse.json(
      { error: "Invalid HMAC" },
      { status: 401 }
    );
  }

  const tokenResponse = await fetch(
    `https://${shop}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    }
  );

  const tokenData = await tokenResponse.json();

  return NextResponse.json({
    success: true,
    shop,
    accessToken: tokenData.access_token,
    scope: tokenData.scope,
  });
}