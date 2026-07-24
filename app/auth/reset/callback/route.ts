import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const resetPasswordUrl = new URL("/auth/reset-password", requestUrl.origin);

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
