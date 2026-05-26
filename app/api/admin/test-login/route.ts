import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

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

  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        status: error.status,
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    userId: data.user?.id ?? null,
    email: data.user?.email ?? null,
  });
}
