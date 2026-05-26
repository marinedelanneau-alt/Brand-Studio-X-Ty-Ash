import { NextResponse } from "next/server";
import { findAccountByEmail } from "@/lib/access-codes";
import { upsertSubscription } from "@/lib/subscriptions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = (await request.json()) as {
    email?: string;
  };

  const email = input.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const account = await findAccountByEmail(email);

  if (!account || !account.is_admin) {
    return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
  }

  await upsertSubscription({
    userId: account.id,
    plan: "brand_studio_admin",
    status: "active",
    accessGranted: true,
  });

  return NextResponse.json({ ok: true, accountId: account.id });
}
