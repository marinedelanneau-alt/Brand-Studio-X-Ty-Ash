import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { retryPendingActivationEmails } from "@/lib/activation-email-delivery";
import { verifyCurrentDraft } from "@/lib/admin-content-release";

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createSupabaseServerClient();
  const activationEmails = await retryPendingActivationEmails();
  const { data: releaseSchedules, error: releaseSchedulesError } = await supabase
    .from("content_release_schedules")
    .select("id,release_id")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .limit(10)
    .returns<Array<{ id: string; release_id: string }>>();
  if (releaseSchedulesError) {
    return NextResponse.json({ error: releaseSchedulesError.message }, { status: 500 });
  }
  let releaseDeployments = 0;
  if (!releaseSchedulesError) {
    for (const schedule of releaseSchedules ?? []) {
      const { data: claimed } = await supabase
        .from("content_release_schedules")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", schedule.id)
        .eq("status", "scheduled")
        .select("id")
        .maybeSingle();
      if (!claimed) continue;
      try {
        await verifyCurrentDraft(schedule.release_id);
        const { error } = await supabase.rpc("publish_scheduled_content_release", { target_schedule_id: schedule.id });
        if (error) throw new Error(error.message);
        releaseDeployments += 1;
      } catch (error) {
        await supabase
          .from("content_release_schedules")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Publication impossible.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", schedule.id);
      }
    }
  }
  return NextResponse.json({
    releaseDeployments,
    activationEmails,
  });
}
