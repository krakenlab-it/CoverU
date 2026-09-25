import { NextResponse } from "next/server";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { getAuthSiteUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeInternalPath(requestUrl.searchParams.get("next"));

  const siteUrl = getAuthSiteUrl();
  const redirectUrl = new URL(next, siteUrl);

  if (!code) {
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  if (!supabase) {
    const loginUrl = new URL("/login", siteUrl);
    loginUrl.searchParams.set("error", "setup");
    return NextResponse.redirect(loginUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", siteUrl);
    loginUrl.searchParams.set("redirect", next);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(redirectUrl);
}
