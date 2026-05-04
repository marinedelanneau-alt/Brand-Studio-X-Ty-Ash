"use server";

import { cookies } from "next/headers";

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("formation-access");
  cookieStore.delete("formation-client-name");
}
