import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findAccountByCode } from "@/lib/access-codes";

export async function getAuthenticatedAccount() {
  const cookieStore = await cookies();
  const accessCode = cookieStore.get("formation-access")?.value;

  if (!accessCode) {
    redirect("/");
  }

  const account = await findAccountByCode(accessCode);

  if (!account || account.is_active === false) {
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
