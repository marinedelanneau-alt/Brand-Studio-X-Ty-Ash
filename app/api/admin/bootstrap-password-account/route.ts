import { NextResponse } from "next/server";
import {
  attachAuthUserToAccount,
  findAccountByCode,
} from "@/lib/access-codes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = (await request.json()) as {
    code?: string;
    email?: string;
    password?: string;
  };

  const code = input.code?.trim().toUpperCase();
  const email = input.email?.trim().toLowerCase();
  const password = input.password ?? "";

  if (!code || !email || !password) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  const account = await findAccountByCode(code);

  if (!account || !account.is_admin) {
    return NextResponse.json({ error: "Admin code not found" }, { status: 404 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      client_name: account.client_name ?? "Admin",
      company_name: account.company_name ?? "Brand Studio",
      is_admin: true,
    },
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to create auth user" },
      { status: 500 },
    );
  }

  await attachAuthUserToAccount({
    accountId: account.id,
    authUserId: data.user.id,
  });

  return NextResponse.json({ ok: true });
}
