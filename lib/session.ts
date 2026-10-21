import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findAccountByAuthUserId, findAccountByCode } from "@/lib/access-codes";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";
import { canAdminister, canReadClients, isClientViewer } from "./account-permissions";

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

  if (!account || account.is_active === false || isClientViewer(account)) {
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
  const account = await getCurrentAccount();
  if (!account) redirect("/");

  if (!canAdminister(account)) {
    redirect(isClientViewer(account) ? "/admin" : "/mon-espace");
  }

  return account;
}

// Client-directory reads require a verified Supabase identity. Legacy access
// cookies remain available to existing learner/Admin flows, never to this reader.
export async function getAuthenticatedClientReader() {
  const supabase = await createSupabaseAuthServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/");
  const account = await findAccountByAuthUserId(user.id);
  if (!account || account.is_active === false) redirect("/");
  if (!canReadClients(account)) redirect("/mon-espace");
  return account;
}

export async function getAuthenticatedInvitationAdmin() {
  const account = await getAuthenticatedClientReader();
  if (!canAdminister(account)) redirect("/admin/clients");
  return account;
}
