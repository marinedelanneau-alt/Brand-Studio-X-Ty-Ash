import "server-only";
import { createSupabaseServerClient } from "./supabase/server";
import type { WorkspaceModule } from "./training-types";
import { tyashRefonteEnabled } from "./tyash-questionnaire-refonte";

export type TyashPrefill = { project_id: number; module_key: string; question_key: string; values: string[]; updated_at: string };

export async function getTyashPrefills(projectId: number): Promise<TyashPrefill[]> {
  const { data, error } = await createSupabaseServerClient().from("tyash_questionnaire_prefills").select("project_id,module_key,question_key,values,updated_at").eq("project_id", projectId);
  if (error) throw new Error("Le préremplissage TYASH est indisponible. Vérifiez la migration dédiée avant de publier le questionnaire.");
  return data ?? [];
}

export function applyTyashPrefills<T extends Pick<WorkspaceModule, "tyashQuestionnaireRevision" | "exercises" | "answers" | "answerVersions" | "stableKey">>(modules: T[], prefills: TyashPrefill[]): T[] {
  return modules.map(module => {
    if (!tyashRefonteEnabled(module)) return module;
    const answers = { ...module.answers };
    const prefilledQuestionKeys: string[] = [];
    for (const e of module.exercises) {
      const prefill = prefills.find(p => p.module_key === module.stableKey && p.question_key === e.stableKey);
      if (!prefill || !e.tyashQuestionnaire?.prefill) continue;
      prefilledQuestionKeys.push(e.stableKey!);
      // A persisted client value, including an explicit empty answer, always wins.
      if (!module.answerVersions[e.id] && !(answers[e.id]?.length)) answers[e.id] = prefill.values;
    }
    return { ...module, answers, prefilledQuestionKeys };
  });
}
