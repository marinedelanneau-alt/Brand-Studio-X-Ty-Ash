"use server";

import { revalidatePath } from "next/cache";
import { updateCompletedModuleCookie } from "@/lib/module-completion-fallback";
import {
  isAnswerableExerciseType,
  parseIndexedAnswerItems,
} from "@/lib/exercise-types";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import {
  getWorkspaceData,
  replaceModuleAnswers,
  setProjectModuleCompletion,
} from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

type ModuleState = {
  status: "idle" | "error" | "success";
  message: string;
};

async function persistModuleAnswers(input: {
  accountId: number;
  formData: FormData;
  markModuleCompleted: boolean;
}) {
  const moduleId = Number(input.formData.get("moduleId"));

  if (!Number.isFinite(moduleId) || moduleId <= 0) {
    return {
      status: "error",
      message: "Module introuvable.",
    } satisfies ModuleState;
  }

  try {
    const workspace = await getWorkspaceData(input.accountId);

    if (!workspace.project) {
      return {
        status: "error",
        message: "Crée d'abord ton projet de marque.",
      } satisfies ModuleState;
    }

    const selectedModule = workspace.modules.find((item) => item.id === moduleId);

    if (!selectedModule) {
      return {
        status: "error",
        message: "Ce module n'est pas encore disponible.",
      } satisfies ModuleState;
    }

    const answers = selectedModule.exercises.flatMap((exercise) => {
      if (!isAnswerableExerciseType(exercise.type)) {
        return [];
      }

      const fieldName = `exercise-${exercise.id}`;

      if (exercise.type === "open" || exercise.type === "prompt_open") {
        const values = input.formData
          .getAll(fieldName)
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
        const hasIndexedValues = parseIndexedAnswerItems(values).length > 0;

        return [{
          exerciseId: exercise.id,
          answerText:
            values.length <= 1 && !hasIndexedValues ? (values[0] || null) : null,
          selectedOptions:
            values.length <= 1 && !hasIndexedValues ? ([] as string[]) : values,
        }];
      }

      if (
        exercise.type === "single" ||
        exercise.type === "boolean" ||
        exercise.type === "color"
      ) {
        const values = input.formData
          .getAll(fieldName)
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
        const hasIndexedValues = parseIndexedAnswerItems(values).length > 0;
        const value = values[0] ?? "";

        return [{
          exerciseId: exercise.id,
          answerText: null,
          selectedOptions: hasIndexedValues ? values : value ? [value] : [],
        }];
      }

      const values = input.formData
        .getAll(fieldName)
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);

      return [{
        exerciseId: exercise.id,
        answerText: null,
        selectedOptions: values,
      }];
    });

    await replaceModuleAnswers({
      projectId: workspace.project.id,
      moduleId: selectedModule.id,
      answers,
    });

    if (input.markModuleCompleted) {
      await setProjectModuleCompletion({
        projectId: workspace.project.id,
        moduleId: selectedModule.id,
        isCompleted: true,
      });
      await updateCompletedModuleCookie({
        projectId: workspace.project.id,
        moduleId: selectedModule.id,
        isCompleted: true,
      });
    }

    revalidatePath("/mon-espace");
    revalidatePath(`/mon-espace/module/${moduleId}`);

    return {
      status: "success",
      message: input.markModuleCompleted
        ? "Le module est terminé. Tu pourras revenir plus tard sur les questions laissées en attente."
        : "Tes réponses ont bien été enregistrées.",
    } satisfies ModuleState;
  } catch (error) {
    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    } satisfies ModuleState;
  }
}

export async function saveModuleAnswers(
  _prevState: ModuleState,
  formData: FormData,
): Promise<ModuleState> {
  try {
    const account = await getAuthenticatedAccount();
    if (!(await hasActiveAccess(account.id))) {
      return {
        status: "error",
        message: "Débloque Brand Studio pour enregistrer tes réponses.",
      };
    }

    return persistModuleAnswers({
      accountId: account.id,
      formData,
      markModuleCompleted: true,
    });
  } catch (error) {
    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }
}

export async function saveModuleDraft(formData: FormData): Promise<ModuleState> {
  try {
    const account = await getAuthenticatedAccount();
    if (!(await hasActiveAccess(account.id))) {
      return {
        status: "error",
        message: "Débloque Brand Studio pour enregistrer tes réponses.",
      };
    }

    return persistModuleAnswers({
      accountId: account.id,
      formData,
      markModuleCompleted: false,
    });
  } catch (error) {
    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }
}
