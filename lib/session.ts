import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findAccountByCode } from "@/lib/access-codes";

export async function getCurrentAccount() {
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
}

export async function getAuthenticatedAccount() {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/");
  }

  return account;
}

export async function getAuthenticatedAdmin() {
  const account = await getAuthenticatedAccount();

  if (!account.is_admin) {
    redirect("/mon-espace");
  }

  return account;
}
