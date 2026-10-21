import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const resetPasswordUrl = new URL("/auth/reset-password", requestUrl.origin);

  // Brevo carries the Supabase token hash. Verify it on this origin so the
  // session cookies are available when Julien chooses his first password.
  if (tokenHash && (type === "invite" || type === "recovery")) {
    const supabase = await createSupabaseAuthServerClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) resetPasswordUrl.searchParams.set("error", "invalid_or_expired");
    const response = NextResponse.redirect(resetPasswordUrl);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }

  if (!code) {
    resetPasswordUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(resetPasswordUrl);
  }

  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    resetPasswordUrl.searchParams.set("error", "invalid_or_expired");
  }

  return NextResponse.redirect(resetPasswordUrl);
}
