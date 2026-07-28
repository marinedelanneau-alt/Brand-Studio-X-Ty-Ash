"use server";

import { isAnswerableExerciseType } from "@/lib/exercise-types";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import {
  getWorkspaceData,
  upsertStableModuleAnswers,
} from "@/lib/training";
import {
  getAdminPreviewAnswers,
  saveAdminPreviewAnswers,
} from "@/lib/content-releases";

export type AnswerSyncMutationInput = {
  id: string;
  userId: number;
  projectId: number;
  moduleId: number;
  exerciseId: number;
  values: string[];
  revision: number;
  updatedAt: number;
  operation: "upsert" | "delete";
};

export async function syncAnswerMutations(mutations: AnswerSyncMutationInput[]) {
  const account = await getAuthenticatedAccount();
  if (!(await hasActiveAccess(account.id))) {
    throw new Error("Accès requis pour synchroniser les réponses.");
  }

  if (mutations.length === 0) {
    return { answers: [] };
  }

  const workspace = await getWorkspaceData(account.id);
  if (!workspace.project || workspace.project.account_id !== account.id) {
    throw new Error("Projet utilisateur introuvable.");
  }

  const moduleId = mutations[0].moduleId;
  const selectedModule = workspace.modules.find((module) => module.id === moduleId);
  if (!selectedModule) {
    throw new Error("Module introuvable.");
  }

  const exerciseById = new Map(
    selectedModule.exercises
      .filter((exercise) => isAnswerableExerciseType(exercise.type))
      .map((exercise) => [exercise.id, exercise]),
  );
  const submodulePositionById = new Map(
    selectedModule.submodules.map((submodule) => [submodule.id, submodule.position]),
  );
  const validMutations = mutations.filter(
    (mutation) =>
      mutation.userId === account.id &&
      mutation.projectId === workspace.project?.id &&
      mutation.moduleId === moduleId &&
      exerciseById.has(mutation.exerciseId) &&
      Number.isFinite(mutation.updatedAt) &&
      Number.isFinite(mutation.revision),
  );

  if (validMutations.length !== mutations.length) {
    throw new Error("Une mutation de réponse est invalide.");
  }

  if (
    workspace.contentPreview.isPreviewMode &&
    workspace.contentPreview.previewMode === "new_user" &&
    workspace.contentPreview.release
  ) {
    const moduleKey =
      "stableKey" in selectedModule &&
      typeof selectedModule.stableKey === "string"
        ? selectedModule.stableKey
        : `module_${selectedModule.id}`;
    const stored = await getAdminPreviewAnswers({
      accountId: account.id,
      releaseId: workspace.contentPreview.release.id,
    });
    const moduleAnswers = { ...(stored[moduleKey] ?? {}) };
    for (const mutation of validMutations) {
      const exercise = exerciseById.get(mutation.exerciseId)!;
      const exerciseKey =
        "stableKey" in exercise && typeof exercise.stableKey === "string"
          ? exercise.stableKey
          : `exercise_${mutation.exerciseId}`;
      moduleAnswers[exerciseKey] =
        mutation.operation === "delete" ? [] : mutation.values;
    }
    await saveAdminPreviewAnswers({
      releaseId: workspace.contentPreview.release.id,
      moduleKey,
      answers: moduleAnswers,
    });
    return {
      answers: validMutations.map((mutation) => ({
        exerciseId: mutation.exerciseId,
        values: mutation.operation === "delete" ? [] : mutation.values,
        revision: mutation.revision,
        updatedAt: mutation.updatedAt,
        deleted: mutation.operation === "delete",
      })),
    };
  }

  await upsertStableModuleAnswers({
    userId: account.id,
    projectId: workspace.project.id,
    moduleId,
    modulePosition: selectedModule.position,
    answers: validMutations.map((mutation) => ({
      exerciseId: mutation.exerciseId,
      exercisePosition: exerciseById.get(mutation.exerciseId)!.position,
      submodulePosition: (() => {
        const submoduleId = exerciseById.get(mutation.exerciseId)!.submodule_id;
        return submoduleId === null
          ? null
          : (submodulePositionById.get(submoduleId) ?? null);
      })(),
      values: mutation.operation === "delete" ? [] : mutation.values,
      clientUpdatedAt: mutation.updatedAt,
      revision: mutation.revision,
    })),
  });

  const refreshedWorkspace = await getWorkspaceData(account.id);
  const refreshedModule = refreshedWorkspace.modules.find((module) => module.id === moduleId);

  return {
    answers: validMutations.map((mutation) => {
      const version = refreshedModule?.answerVersions[mutation.exerciseId];
      return {
        exerciseId: mutation.exerciseId,
        values: refreshedModule?.answers[mutation.exerciseId] ?? [],
        revision: version?.revision ?? 0,
        updatedAt: version?.updatedAt ?? 0,
        deleted: (refreshedModule?.answers[mutation.exerciseId] ?? []).length === 0,
      };
    }),
  };
}
