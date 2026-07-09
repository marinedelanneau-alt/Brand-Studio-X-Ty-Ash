import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseAuthServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  redirect("/auth/reset-password");
}
