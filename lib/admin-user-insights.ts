import "server-only";

import { cache } from "react";
import { getAuthenticatedClientReader } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isTyAshContent, requireTyAshKey } from "./tyash-answer-identity";
import { getApplicationReleaseState, getContentReleaseSnapshot, isControlledProductionContentEnabled } from "./content-releases";
import { validateReleaseModules } from "./release-content-validation";
import { getModulesWithExercises, getModuleProgress } from "@/lib/training";
import { isAnswerableExerciseType } from "@/lib/exercise-types";
import { getStableExerciseAnswerKey } from "@/lib/stable-answer-keys";

export type AdminAnswerView = {
  moduleId: number;
  moduleTitle: string;
  modulePosition: number;
  submoduleTitle: string;
  exerciseId: number;
  exerciseTitle: string;
  exerciseType: string;
  values: string[];
  updatedAt: string | null;
};

export type AdminUserView = {
  id: number;
  name: string;
  company: string;
  email: string;
  createdAt: string;
  lastActivityAt: string;
  progress: number;
  status: "Nouveau" | "En cours" | "Terminé";
  projectId: number | null;
  guideExists: boolean;
  moduleProgress: Array<{ id: number; title: string; progress: number }>;
  answers: AdminAnswerView[];
};

type StableAnswerRow = {
  user_id: number;
  project_id: number;
  module_key: string;
  question_key: string;
  answer_value: unknown;
  updated_at: string;
  client_updated_at: string;
};

function valuesOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return typeof value === "string" ? [value] : [];
}

function hasValue(values: string[]) {
  return values.some((value) => value.trim().length > 0);
}

function latestDate(...dates: Array<string | null | undefined>) {
  return dates.filter((date): date is string => Boolean(date)).sort().at(-1) ?? "";
}

export const getAdminUsers = cache(async function getAdminUsers(): Promise<AdminUserView[]> {
  await getAuthenticatedClientReader();
  const db = createSupabaseServerClient();
  const modules = isControlledProductionContentEnabled()
    ? validateReleaseModules((await getContentReleaseSnapshot((await getApplicationReleaseState()).published_release_id))?.modules) as unknown as Awaited<ReturnType<typeof getModulesWithExercises>>
    : await getModulesWithExercises();
  const [accountsResult, projectsResult, stableResult, legacyResult, exportsResult] = await Promise.all([
    db.from("client_access_codes").select("id,email,client_name,company_name,created_at,is_admin,role").order("created_at", { ascending: false }),
    db.from("brand_projects").select("id,account_id,name,created_at,updated_at"),
    db.from("user_answers").select("user_id,project_id,module_key,question_key,answer_value,updated_at,client_updated_at"),
    db.from("project_exercise_answers").select("project_id,module_id,exercise_id,answer_text,selected_options,updated_at"),
    db.from("brand_exports").select("project_id,generated_at").eq("export_type", "brand_guide"),
  ]);
  const error = accountsResult.error ?? projectsResult.error ?? stableResult.error ?? legacyResult.error ?? exportsResult.error;
  if (error) throw new Error(error.message);

  const projects = projectsResult.data ?? [];
  const stable = (stableResult.data ?? []) as StableAnswerRow[];
  const legacy = legacyResult.data ?? [];
  const guideProjects = new Set((exportsResult.data ?? []).map((item) => item.project_id));

  return (accountsResult.data ?? [])
    .filter((account) => !account.is_admin && account.role !== "admin")
    .map((account) => {
      const project = projects.find((item) => item.account_id === account.id) ?? null;
      const stableForUser = stable.filter((item) => item.user_id === account.id && item.project_id === project?.id);
      const legacyForProject = project ? legacy.filter((item) => item.project_id === project.id) : [];
      const answers: AdminAnswerView[] = [];
      const moduleProgress = modules.map((moduleItem) => {
        const answerable = moduleItem.exercises.filter((exercise) => isAnswerableExerciseType(exercise.type));
        const answerMap: Record<number, string[]> = {};
        for (const exercise of answerable) {
          const submodule = moduleItem.submodules.find((item) => item.id === exercise.submodule_id);
          const stableKey = getStableExerciseAnswerKey({
            modulePosition: moduleItem.position,
            submodulePosition: submodule?.position ?? null,
            exercisePosition: exercise.position,
          });
          const stableAnswer = stableForUser
            .filter((item) => isTyAshContent(moduleItem) ? item.module_key === requireTyAshKey(moduleItem) && item.question_key === requireTyAshKey(exercise) : (item.question_key === stableKey || item.question_key === `question_${exercise.id}`))
            .sort((a, b) => latestDate(a.client_updated_at, a.updated_at).localeCompare(latestDate(b.client_updated_at, b.updated_at)))
            .at(-1);
          const legacyAnswer = isTyAshContent(moduleItem) ? undefined : legacyForProject.find((item) => item.exercise_id === exercise.id);
          const values = stableAnswer
            ? valuesOf(stableAnswer.answer_value)
            : legacyAnswer?.answer_text
              ? [legacyAnswer.answer_text]
              : valuesOf(legacyAnswer?.selected_options);
          answerMap[exercise.id] = values;
          if (hasValue(values)) {
            answers.push({
              moduleId: moduleItem.id,
              moduleTitle: moduleItem.title,
              modulePosition: moduleItem.position,
              submoduleTitle: submodule?.title ?? "Repères essentiels",
              exerciseId: exercise.id,
              exerciseTitle: exercise.question || `Exercice ${exercise.position}`,
              exerciseType: exercise.type,
              values,
              updatedAt: stableAnswer ? latestDate(stableAnswer.client_updated_at, stableAnswer.updated_at) : legacyAnswer?.updated_at ?? null,
            });
          }
        }
        return {
          id: moduleItem.id,
          title: moduleItem.title,
          progress: getModuleProgress(moduleItem, moduleItem.exercises, answerMap, 1, false).completionPercent,
        };
      });
      const progress = moduleProgress.length === 0
        ? 0
        : Math.round(moduleProgress.reduce((sum, item) => sum + item.progress, 0) / moduleProgress.length);
      const lastActivityAt = latestDate(
        account.created_at,
        project?.updated_at,
        ...stableForUser.flatMap((item) => [item.client_updated_at, item.updated_at]),
        ...legacyForProject.map((item) => item.updated_at),
      );
      return {
        id: account.id,
        name: account.client_name?.trim() || "Sans nom",
        company: account.company_name?.trim() || project?.name?.trim() || "Non renseignée",
        email: account.email,
        createdAt: account.created_at,
        lastActivityAt,
        progress,
        status: progress === 0 ? "Nouveau" : progress === 100 ? "Terminé" : "En cours",
        projectId: project?.id ?? null,
        guideExists: project ? guideProjects.has(project.id) : false,
        moduleProgress,
        answers: answers.sort((a, b) => a.modulePosition - b.modulePosition),
      } satisfies AdminUserView;
    });
});

export async function getAdminUser(userId: number) {
  return (await getAdminUsers()).find((user) => user.id === userId) ?? null;
}

export async function getAdminUserNeighbors(userId: number) {
  const users = await getAdminUsers();
  const index = users.findIndex((user) => user.id === userId);
  return {
    previous: index > 0 ? users[index - 1] : null,
    next: index >= 0 && index < users.length - 1 ? users[index + 1] : null,
  };
}
