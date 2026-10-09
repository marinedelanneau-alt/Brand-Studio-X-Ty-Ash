import "server-only";
import { createHash } from "node:crypto";
import { createSupabaseServerClient } from "./supabase/server";
import { getAuthenticatedAdmin } from "./session";
import { normalizeReleaseSnapshotModules } from "./content-release-diff";
import { validateReleaseModules } from "./release-content-validation";

// Only used while the official snapshot is exactly empty. Never reads an admin
// draft for a user, and never imports a global/other-project Storage current.json.
export async function getBootstrapPublishedModules() {
  const { getModulesWithExercises } = await import("./training");
  return validateReleaseModules(normalizeReleaseSnapshotModules(await getModulesWithExercises()));
}

export async function getBootstrapAdminSnapshot() {
  const account = await getAuthenticatedAdmin();
  const db = createSupabaseServerClient();
  const project = await db.from("brand_projects").select("id").eq("account_id", account.id).maybeSingle<{ id: number }>();
  if (project.error) throw new Error(project.error.message);
  let modules: unknown[];
  if (project.data) {
    const result = await db.from("brand_exports").select("guide_snapshot").eq("project_id", project.data.id)
      .eq("export_type", "admin_module_draft").order("generated_at", { ascending: false }).limit(1)
      .maybeSingle<{ guide_snapshot: { version: number; modules: unknown[] } }>();
    if (result.error) throw new Error(result.error.message);
    if (result.data) {
      if (result.data.guide_snapshot?.version !== 1 || !Array.isArray(result.data.guide_snapshot.modules)) throw new Error("Invalid saved admin draft.");
      modules = result.data.guide_snapshot.modules;
    } else modules = await getBootstrapPublishedModules();
  } else modules = await getBootstrapPublishedModules();
  const normalized = normalizeReleaseSnapshotModules(modules);
  return {
    modules: validateReleaseModules(normalized),
    revision: `bootstrap:${createHash("sha256").update(JSON.stringify(normalized)).digest("hex")}`,
  };
}
