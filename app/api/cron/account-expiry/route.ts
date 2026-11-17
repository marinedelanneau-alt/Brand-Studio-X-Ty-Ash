import { timingSafeEqual } from "node:crypto";
import { runAccountExpiryJobs } from "@/lib/account-expiry-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !received || Buffer.byteLength(expected) !== Buffer.byteLength(received)
    || !timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runAccountExpiryJobs();
    if (result.errors.length) console.error("Account expiry jobs require retry", result.errors);
    return Response.json(result, { status: result.errors.length ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Account expiry jobs failed");
    return Response.json({ error: "Account expiry jobs failed" }, { status: 503 });
  }
}
