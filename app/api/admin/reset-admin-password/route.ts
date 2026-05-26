import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = input.email?.trim().toLowerCase();
  const password = input.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
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

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      password,
      email_confirm: true,
    },
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.json(
      { error: signInError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
