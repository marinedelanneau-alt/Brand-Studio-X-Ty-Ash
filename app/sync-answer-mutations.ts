"use server";

import { isAnswerableExerciseType } from "@/lib/exercise-types";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import {
  getWorkspaceData,
  upsertStableModuleAnswers,
} from "@/lib/training";

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

  await upsertStableModuleAnswers({
    userId: account.id,
    projectId: workspace.project.id,
    moduleId,
    answers: validMutations.map((mutation) => ({
      exerciseId: mutation.exerciseId,
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
