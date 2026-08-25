import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findAccountByAuthUserId, findAccountByCode } from "@/lib/access-codes";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export const getCurrentAccount = cache(async function getCurrentAccount() {
  let userId: string | null = null;

  const authSupabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
    error: authError,
  } = await authSupabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    throw authError;
  }
  userId = user?.id ?? null;

  if (userId) {
    const account = await findAccountByAuthUserId(userId);

    if (account && account.is_active !== false) {
      return account;
    }
  }

  const cookieStore = await cookies();
  const accessCode = cookieStore.get("formation-access")?.value;

  if (!accessCode) {
    return null;
  }

  const account = await findAccountByCode(accessCode);

  if (!account || account.is_active === false) {
    return null;
  }

  return account;
});

export async function getAuthenticatedAccount() {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/");
  }

  return account;
}

export async function getAuthenticatedAdmin() {
  const account = await getAuthenticatedAccount();

  if (account.role !== "admin" && !account.is_admin) {
    redirect("/mon-espace");
  }

  return account;
}
