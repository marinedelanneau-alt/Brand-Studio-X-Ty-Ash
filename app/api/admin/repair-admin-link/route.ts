import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = (await request.json()) as {
    email?: string;
  };

  const email = input.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: usersData, error: usersError } =
    await supabase.auth.admin.listUsers();

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const user = usersData.users.find(
    (item) => item.email?.toLowerCase() === email,
  );

  if (!user) {
    return NextResponse.json({ error: "Auth user not found" }, { status: 404 });
  }

  const { data: account, error: accountError } = await supabase
    .from("client_access_codes")
    .select("id,email,is_admin,is_active")
    .eq("email", email)
    .maybeSingle<{ id: number; email: string; is_admin: boolean; is_active: boolean }>();

  if (accountError) {
    return NextResponse.json({ error: accountError.message }, { status: 500 });
  }

  if (!account) {
    return NextResponse.json({ error: "Client account not found" }, { status: 404 });
  }

  const { error: clearError } = await supabase
    .from("client_access_codes")
    .update({ auth_user_id: null })
    .eq("auth_user_id", user.id)
    .neq("id", account.id);

  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("client_access_codes")
    .update({
      auth_user_id: user.id,
      code: null,
      is_admin: true,
      is_active: true,
    })
    .eq("id", account.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: user.id, accountId: account.id });
}
