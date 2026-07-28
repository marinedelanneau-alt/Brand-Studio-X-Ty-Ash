import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publishScheduledAdminModuleSnapshot } from "@/lib/training";
import type { BrandModule, BrandSubmodule, ModuleExercise } from "@/lib/training-types";
import { retryPendingActivationEmails } from "@/lib/activation-email-delivery";

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
  const { data, error } = await supabase.rpc("publish_due_module_versions");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: schedules, error: schedulesError } = await supabase
    .from("admin_deployment_schedules").select("id,account_id,draft_snapshot")
    .eq("status", "scheduled").lte("scheduled_at", new Date().toISOString()).limit(10)
    .returns<Array<{ id: string; account_id: number; draft_snapshot: { modules?: Array<BrandModule & { submodules: Array<BrandSubmodule & { exercises: ModuleExercise[] }>; exercises: ModuleExercise[] }> } }>>();
  if (schedulesError) return NextResponse.json({ error: schedulesError.message }, { status: 500 });
  let deployments = 0;
  for (const schedule of schedules ?? []) {
    const { data: claimed } = await supabase.from("admin_deployment_schedules")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", schedule.id).eq("status", "scheduled").select("id").maybeSingle();
    if (!claimed) continue;
    try {
      await publishScheduledAdminModuleSnapshot(schedule.account_id, schedule.draft_snapshot.modules ?? []);
      await supabase.from("admin_deployment_schedules").update({ status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", schedule.id);
      deployments += 1;
    } catch (cause) {
      await supabase.from("admin_deployment_schedules").update({ status: "failed", error_message: cause instanceof Error ? cause.message : "Erreur inconnue", updated_at: new Date().toISOString() }).eq("id", schedule.id);
    }
  }
  const { data: releaseSchedules, error: releaseSchedulesError } = await supabase
    .from("content_release_schedules")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .limit(10)
    .returns<Array<{ id: string }>>();
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
      const { error: publicationError } = await supabase.rpc(
        "publish_scheduled_content_release",
        { target_schedule_id: schedule.id },
      );
      if (publicationError) {
        await supabase
          .from("content_release_schedules")
          .update({
            status: "failed",
            error_message: publicationError.message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", schedule.id);
      } else {
        releaseDeployments += 1;
      }
    }
  }
  return NextResponse.json({
    publishedVersions: data ?? 0,
    deployments,
    releaseDeployments,
    activationEmails,
  });
}
