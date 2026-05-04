"use server";

import { unstable_rethrow } from "next/navigation";
import { getAuthenticatedAccount } from "@/lib/session";
import { generateModuleAnswerAssistance, supportsModuleAnswerAi } from "@/lib/module-answer-ai";
import { getWorkspaceData } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

type AssistanceMode = "suggest" | "improve";

type AssistanceResult = {
  status: "success" | "error";
  message: string;
  coachingNote: string;
  values: string[];
};

function sanitizeAnswersMap(value: unknown) {
  if (!value || typeof value !== "object") {
    return {} as Record<number, string[]>;
  }

  return Object.fromEntries(
    Object.entries(value).map(([exerciseId, answers]) => [
      Number(exerciseId),
      Array.isArray(answers)
        ? answers
            .filter((answer): answer is string => typeof answer === "string")
            .map((answer) => answer.trim())
        : [],
    ]),
  ) as Record<number, string[]>;
}

export async function requestModuleAnswerAssistance(input: {
  moduleId: number;
  exerciseId: number;
  mode: AssistanceMode;
  currentAnswers: Record<number, string[]>;
}): Promise<AssistanceResult> {
  try {
    const account = await getAuthenticatedAccount();
    const workspace = await getWorkspaceData(account.id);
    const currentAnswers = sanitizeAnswersMap(input.currentAnswers);

    if (!workspace.project) {
      return {
        status: "error",
        message: "Creez d'abord votre projet de marque.",
        coachingNote: "",
        values: [],
      };
    }

    const selectedModule = workspace.modules.find((item) => item.id === input.moduleId);

    if (!selectedModule || !selectedModule.progress.isUnlocked) {
      return {
        status: "error",
        message: "Ce module n'est pas accessible.",
        coachingNote: "",
        values: [],
      };
    }

    const exercise = selectedModule.exercises.find((item) => item.id === input.exerciseId);

    if (!exercise) {
      return {
        status: "error",
        message: "La question demandee est introuvable.",
        coachingNote: "",
        values: [],
      };
    }

    if (!supportsModuleAnswerAi(exercise)) {
      return {
        status: "error",
        message: "L'assistance IA n'est pas disponible pour ce format de question.",
        coachingNote: "",
        values: [],
      };
    }

    const result = await generateModuleAnswerAssistance({
      module: selectedModule,
      exercise,
      mode: input.mode,
      currentAnswers,
      workspaceModules: workspace.modules,
      projectName: workspace.project.name,
      clientName: account.client_name,
      companyName: account.company_name,
    });

    return {
      status: "success",
      message:
        input.mode === "suggest"
          ? "Une proposition a ete injectee dans le champ."
          : "La reponse a ete retravaillee par l'IA.",
      coachingNote: result.coachingNote,
      values: result.values,
    };
  } catch (error) {
    unstable_rethrow(error);

    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
      coachingNote: "",
      values: [],
    };
  }
}
