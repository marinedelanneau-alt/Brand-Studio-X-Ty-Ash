import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { compareModuleVersions, validateModuleVersion, type ModuleVersionContent } from "@/lib/editorial-versioning";

type VersionRow = {
  id: string; module_id: string; version_number: number; status: "draft"|"scheduled"|"published"|"archived";
  title: string; created_at: string; updated_at: string; published_at: string|null;
  scheduled_publish_at: string|null; publication_timezone: string; publication_notes: string|null;
  based_on_version_id: string|null; editorial_modules: { module_key: string };
};

export async function listEditorialVersions() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("module_versions")
    .select("*, editorial_modules!inner(module_key)").order("created_at", { ascending: false }).returns<VersionRow[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function loadVersionContent(versionId: string): Promise<ModuleVersionContent> {
  const supabase = createSupabaseServerClient();
  const [versionResult, exercisesResult, questionsResult] = await Promise.all([
    supabase.from("module_versions").select("*, editorial_modules!inner(module_key)").eq("id", versionId).single<VersionRow>(),
    supabase.from("exercise_versions").select("*").eq("module_version_id", versionId).order("sort_order"),
    supabase.from("question_versions").select("*").eq("module_version_id", versionId).order("sort_order"),
  ]);
  const error = versionResult.error ?? exercisesResult.error ?? questionsResult.error;
  if (error) throw new Error(error.message);
  const version = versionResult.data;
  if (!version) throw new Error("Version introuvable.");
  return {
    id: version.id, moduleKey: version.editorial_modules.module_key, versionNumber: version.version_number,
    status: version.status, title: version.title,
    exercises: (exercisesResult.data ?? []).map((item) => ({ exerciseKey: item.exercise_key, submoduleKey: item.submodule_key,
      exerciseType: item.exercise_type, sortOrder: item.sort_order, configuration: item.configuration ?? {} })),
    questions: (questionsResult.data ?? []).map((item) => ({ questionKey: item.question_key, fieldKey: item.field_key,
      exerciseKey: item.exercise_key, label: item.label, questionType: item.question_type, sortOrder: item.sort_order,
      isRequired: item.is_required, configuration: item.configuration ?? {} })),
  };
}

export async function getVersionReview(versionId: string) {
  const draft = await loadVersionContent(versionId);
  const versions = await listEditorialVersions();
  const publishedRow = versions.find((item) => item.module_id === versions.find((v) => v.id === versionId)?.module_id && item.status === "published");
  const published = publishedRow ? await loadVersionContent(publishedRow.id) : null;
  return { draft, published, issues: validateModuleVersion(draft), changes: published ? compareModuleVersions(published, draft) : [] };
}

export async function callEditorialRpc(name: string, parameters: Record<string, unknown>) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc(name, parameters);
  if (error) throw new Error(error.message);
  return data;
}
