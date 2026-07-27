"use server";

import { revalidatePath } from "next/cache";
import { updateCompletedModuleCookie } from "@/lib/module-completion-fallback";
import {
  isAnswerableExerciseType,
  parseIndexedAnswerItems,
  type ExerciseType,
} from "@/lib/exercise-types";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import {
  backupModuleAnswers,
  getWorkspaceData,
  replaceModuleAnswers,
  setProjectModuleCompletion,
  upsertStableModuleAnswers,
} from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

type ModuleState = {
  status: "idle" | "error" | "success";
  message: string;
};

const STRUCTURED_VALUE_EXERCISE_TYPES = new Set<ExerciseType>([
  "fill_blank",
  "table",
  "group_open",
  "brand_persona",
  "spectrum",
  "color_palette",
  "typography",
  "editorial_calendar",
  "moodboard",
]);

function shouldKeepStructuredAnswerValues(type: ExerciseType) {
  return STRUCTURED_VALUE_EXERCISE_TYPES.has(type);
}

function getSubmittedAnswerValues(formData: FormData, fieldName: string, type: ExerciseType) {
  const values = formData
    .getAll(fieldName)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim());

  return shouldKeepStructuredAnswerValues(type)
    ? values
    : values.filter(Boolean);
}

function getSubmittedExerciseIds(formData: FormData) {
  return new Set(
    formData
      .getAll("submittedExerciseId")
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0),
  );
}

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

    const submittedExerciseIds = getSubmittedExerciseIds(input.formData);
    const hasSubmittedExerciseScope = submittedExerciseIds.size > 0;

    const answers = selectedModule.exercises.flatMap((exercise) => {
      if (!isAnswerableExerciseType(exercise.type)) {
        return [];
      }

      if (hasSubmittedExerciseScope && !submittedExerciseIds.has(exercise.id)) {
        return [];
      }

      const fieldName = `exercise-${exercise.id}`;

      if (exercise.type === "open" || exercise.type === "prompt_open") {
        const values = getSubmittedAnswerValues(
          input.formData,
          fieldName,
          exercise.type,
        );
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
        const values = getSubmittedAnswerValues(
          input.formData,
          fieldName,
          exercise.type,
        );
        const hasIndexedValues = parseIndexedAnswerItems(values).length > 0;
        const value = values[0] ?? "";

        return [{
          exerciseId: exercise.id,
          answerText: null,
          selectedOptions: hasIndexedValues ? values : value ? [value] : [],
        }];
      }

      const values = getSubmittedAnswerValues(
        input.formData,
        fieldName,
        exercise.type,
      );

      return [{
        exerciseId: exercise.id,
        answerText: null,
        selectedOptions: values,
      }];
    });

    const exerciseById = new Map(
      selectedModule.exercises.map((exercise) => [exercise.id, exercise]),
    );

    await upsertStableModuleAnswers({
      userId: workspace.project.account_id,
      projectId: workspace.project.id,
      moduleId: selectedModule.id,
      modulePosition: selectedModule.position,
      answers: answers.map((answer) => ({
        exerciseId: answer.exerciseId,
        exercisePosition: exerciseById.get(answer.exerciseId)?.position ?? answer.exerciseId,
        values: answer.answerText ? [answer.answerText] : answer.selectedOptions,
        clientUpdatedAt: Number(
          input.formData.get(`exerciseUpdatedAt-${answer.exerciseId}`),
        ),
      })),
    });

    await backupModuleAnswers({
      projectId: workspace.project.id,
      modulePosition: selectedModule.position,
      answers: answers.flatMap((answer) => {
        const exercise = exerciseById.get(answer.exerciseId);
        if (!exercise) {
          return [];
        }

        return [{
          exercisePosition: exercise.position,
          values: answer.answerText ? [answer.answerText] : answer.selectedOptions,
        }];
      }),
    });

    await replaceModuleAnswers({
      projectId: workspace.project.id,
      moduleId: selectedModule.id,
      answers,
      exerciseIds: hasSubmittedExerciseScope ? [...submittedExerciseIds] : undefined,
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

    // Draft autosaves must not refresh the active React tree: doing so can race with
    // the user's next keystroke. Completion is the only mutation that needs revalidation.
    if (input.markModuleCompleted) {
      revalidatePath("/mon-espace");
      revalidatePath(`/mon-espace/module/${moduleId}`);
    }

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
