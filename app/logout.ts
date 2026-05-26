"use server";

import { cookies } from "next/headers";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createSupabaseAuthServerClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete("formation-access");
  cookieStore.delete("formation-client-name");
}
