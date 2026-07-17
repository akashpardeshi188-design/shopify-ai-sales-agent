import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Only the main authenticated app surface is gated here. /onboarding and
// /update-password run their own DB-backed checks in the page itself (the
// Data Access Layer) — proxy only performs the cheap, cookie-based check.
const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PAGE_PREFIXES = ["/login", "/signup"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() (not getSession()) re-validates against the Supabase Auth
  // server and refreshes the token if needed. Skipping this call is the
  // single most common cause of random logouts with @supabase/ssr.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const isAuthPage = AUTH_PAGE_PREFIXES.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `redirect=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
