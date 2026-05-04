import type { ModuleExercise, WorkspaceModule } from "@/lib/training-types";
import {
  getFillBlankCount,
  parseChecklistEntries,
  parseIndexedAnswerItems,
  parseStoredExerciseQuestionConfig,
  parseStoredTableConfig,
  serializeChecklistEntries,
  serializeIndexedAnswerItem,
  splitFillBlankText,
} from "@/lib/exercise-types";

export const MODULE_ANSWER_AI_MODEL = "gpt-4o-mini";

type AssistanceMode = "suggest" | "improve";

type QuestionSpec = {
  questionIndex: number;
  prompt: string;
  kind: "text" | "list";
  slotCount: number;
  currentValues: string[];
};

type WorkspaceAnswerContextItem = {
  moduleTitle: string;
  submoduleTitle: string | null;
  question: string;
  answer: string;
};

type AssistanceResponse = {
  overview: string;
  questions: Array<{
    questionIndex: number;
    values: string[];
  }>;
};

export function supportsModuleAnswerAi(exercise: ModuleExercise) {
  return (
    exercise.type === "open" ||
    exercise.type === "prompt_open" ||
    exercise.type === "group_open" ||
    exercise.type === "checklist" ||
    exercise.type === "fill_blank" ||
    exercise.type === "table"
  );
}

function getQuestionValues(exercise: ModuleExercise, rawValues: string[], questionIndex: number) {
  const questionConfig = parseStoredExerciseQuestionConfig(exercise.type, exercise.options);

  if (questionConfig.items.length === 0) {
    return questionIndex === 0 ? rawValues : [];
  }

  return parseIndexedAnswerItems(rawValues)
    .filter((item) => item.questionIndex === questionIndex)
    .sort((left, right) => left.valueIndex - right.valueIndex)
    .map((item) => item.value);
}

function getQuestionSpecs(
  exercise: ModuleExercise,
  rawValues: string[],
  mode: AssistanceMode,
) {
  const questionConfig = parseStoredExerciseQuestionConfig(exercise.type, exercise.options);
  const prompts =
    questionConfig.items.length > 0 ? questionConfig.items : [exercise.question];

  return prompts.map((prompt, questionIndex) => {
    const currentValues = getQuestionValues(exercise, rawValues, questionIndex);

    if (exercise.type === "checklist") {
      const currentEntries = parseChecklistEntries(currentValues);

      return {
        questionIndex,
        prompt,
        kind: "list",
        slotCount:
          mode === "improve" && currentEntries.length > 0
            ? currentEntries.length
            : Math.max(currentEntries.length, 6),
        currentValues: currentEntries.map((entry) => entry.label),
      } satisfies QuestionSpec;
    }

    if (exercise.type === "fill_blank") {
      return {
        questionIndex,
        prompt,
        kind: "text",
        slotCount: Math.max(getFillBlankCount(prompt), 1),
        currentValues,
      } satisfies QuestionSpec;
    }

    if (exercise.type === "table") {
      return {
        questionIndex,
        prompt,
        kind: "text",
        slotCount: Math.max(
          parseStoredTableConfig(exercise.options).rows *
            parseStoredTableConfig(exercise.options).columns,
          1,
        ),
        currentValues,
      } satisfies QuestionSpec;
    }

    return {
      questionIndex,
      prompt,
      kind: "text",
      slotCount: 1,
      currentValues: currentValues.slice(0, 1),
    } satisfies QuestionSpec;
  });
}

function formatQuestionAnswerForContext(exercise: ModuleExercise, rawValues: string[]) {
  const questionConfig = parseStoredExerciseQuestionConfig(exercise.type, exercise.options);

  if (exercise.type === "checklist") {
    const prompts = questionConfig.items.length > 0 ? questionConfig.items : [exercise.question];
    const blocks = prompts
      .map((prompt, questionIndex) => {
        const labels = parseChecklistEntries(getQuestionValues(exercise, rawValues, questionIndex))
          .map((entry) => `${entry.checked ? "[x]" : "[ ]"} ${entry.label}`)
          .join(", ");

        return `${prompt || `Question ${questionIndex + 1}`} : ${labels || "Aucune entree"}`;
      })
      .filter(Boolean);

    return blocks.join(" | ");
  }

  if (exercise.type === "fill_blank") {
    const prompts = questionConfig.items.length > 0 ? questionConfig.items : [exercise.question];
    const blocks = prompts.map((prompt, questionIndex) => {
      const values = getQuestionValues(exercise, rawValues, questionIndex);
      const promptParts = splitFillBlankText(prompt);
      const renderedValues = Array.from(
        { length: Math.max(getFillBlankCount(prompt), values.length) },
        (_, index) => `${promptParts[index] ?? ""}[${values[index] ?? ""}]`,
      )
        .concat(promptParts.at(-1) ?? "")
        .join("");

      return renderedValues.trim();
    });

    return blocks.join(" | ");
  }

  if (exercise.type === "table") {
    const tableConfig = parseStoredTableConfig(exercise.options);
    const prompts = questionConfig.items.length > 0 ? questionConfig.items : [exercise.question];

    const blocks = prompts.map((prompt, questionIndex) => {
      const values = getQuestionValues(exercise, rawValues, questionIndex);
      const rows = Array.from({ length: tableConfig.rows }, (_, rowIndex) => {
        const cells = Array.from({ length: tableConfig.columns }, (_, columnIndex) => {
          const cellIndex = rowIndex * tableConfig.columns + columnIndex;
          const columnLabel = tableConfig.columnLabels[columnIndex] || `Colonne ${columnIndex + 1}`;
          return `${columnLabel}: ${values[cellIndex] ?? ""}`.trim();
        }).join(", ");
        const rowLabel = tableConfig.rowLabels[rowIndex] || `Ligne ${rowIndex + 1}`;
        return `${rowLabel} -> ${cells}`;
      });

      return `${prompt || "Tableau"} : ${rows.join(" | ")}`;
    });

    return blocks.join(" || ");
  }

  if (questionConfig.items.length > 0) {
    return questionConfig.items
      .map((prompt, questionIndex) => {
        const values = getQuestionValues(exercise, rawValues, questionIndex).join(" | ");
        return `${prompt} : ${values || "Sans reponse"}`;
      })
      .join(" || ");
  }

  return rawValues.join(" | ");
}

function buildWorkspaceAnswerContext(input: {
  module: WorkspaceModule;
  workspaceModules: WorkspaceModule[];
  currentAnswers: Record<number, string[]>;
  currentExerciseId: number;
}) {
  const contextItems: WorkspaceAnswerContextItem[] = [];

  for (const workspaceModule of input.workspaceModules) {
    if (workspaceModule.position > input.module.position) {
      continue;
    }

    const answersMap =
      workspaceModule.id === input.module.id
        ? {
            ...workspaceModule.answers,
            ...input.currentAnswers,
          }
        : workspaceModule.answers;

    for (const exercise of workspaceModule.exercises) {
      if (exercise.id === input.currentExerciseId) {
        continue;
      }

      const rawValues = answersMap[exercise.id] ?? [];
      const formattedAnswer = formatQuestionAnswerForContext(exercise, rawValues).trim();

      if (!formattedAnswer) {
        continue;
      }

      const submoduleTitle =
        workspaceModule.submodules.find((submodule) => submodule.id === exercise.submodule_id)
          ?.title ?? null;

      contextItems.push({
        moduleTitle: workspaceModule.title,
        submoduleTitle,
        question: exercise.question,
        answer: formattedAnswer,
      });
    }
  }

  return contextItems;
}

function buildRawValuesFromAssistance(input: {
  exercise: ModuleExercise;
  currentRawValues: string[];
  response: AssistanceResponse;
  mode: AssistanceMode;
}) {
  const specs = getQuestionSpecs(input.exercise, input.currentRawValues, input.mode);
  const questionConfig = parseStoredExerciseQuestionConfig(
    input.exercise.type,
    input.exercise.options,
  );
  const questionCount = specs.length;
  const valuesByQuestion = new Map(
    specs.map((spec) => {
      const responseQuestion = input.response.questions.find(
        (item) => item.questionIndex === spec.questionIndex,
      );

      const normalizedValues = (responseQuestion?.values ?? [])
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, spec.slotCount);

      const filledValues =
        spec.kind === "text" && spec.slotCount > 1
          ? Array.from({ length: spec.slotCount }, (_, index) => normalizedValues[index] ?? "")
          : normalizedValues;

      if (spec.kind === "list") {
        const currentEntries = parseChecklistEntries(
          getQuestionValues(input.exercise, input.currentRawValues, spec.questionIndex),
        );
        const nextEntries = filledValues.map((label, index) => ({
          label,
          checked: currentEntries[index]?.checked ?? false,
        }));

        return [spec.questionIndex, serializeChecklistEntries(nextEntries)] as const;
      }

      return [spec.questionIndex, filledValues] as const;
    }),
  );

  if (questionConfig.items.length === 0) {
    return valuesByQuestion.get(0) ?? [];
  }

  return Array.from({ length: questionCount }, (_, questionIndex) =>
    (valuesByQuestion.get(questionIndex) ?? []).map((value, valueIndex) =>
      serializeIndexedAnswerItem(questionIndex, valueIndex, value),
    ),
  ).flat();
}

function getChatCompletionContent(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const choices = "choices" in payload ? payload.choices : undefined;

  if (!Array.isArray(choices) || choices.length === 0) {
    return "";
  }

  const message = choices[0]?.message;

  if (!message || typeof message !== "object") {
    return "";
  }

  if ("content" in message && typeof message.content === "string") {
    return message.content;
  }

  return "";
}

export async function generateModuleAnswerAssistance(input: {
  module: WorkspaceModule;
  exercise: ModuleExercise;
  mode: AssistanceMode;
  currentAnswers: Record<number, string[]>;
  workspaceModules: WorkspaceModule[];
  projectName: string;
  clientName?: string | null;
  companyName?: string | null;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("La variable OPENAI_API_KEY est manquante.");
  }

  if (!supportsModuleAnswerAi(input.exercise)) {
    throw new Error("Ce type d'exercice ne prend pas encore l'assistance IA en charge.");
  }

  const currentRawValues = input.currentAnswers[input.exercise.id] ?? [];
  const questionSpecs = getQuestionSpecs(input.exercise, currentRawValues, input.mode);
  const submoduleTitle =
    input.module.submodules.find((submodule) => submodule.id === input.exercise.submodule_id)
      ?.title ?? null;
  const contextItems = buildWorkspaceAnswerContext({
    module: input.module,
    workspaceModules: input.workspaceModules,
    currentAnswers: input.currentAnswers,
    currentExerciseId: input.exercise.id,
  });
  const currentDraft = formatQuestionAnswerForContext(input.exercise, currentRawValues).trim();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODULE_ANSWER_AI_MODEL,
      temperature: input.mode === "suggest" ? 0.8 : 0.55,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "module_answer_assistance",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["overview", "questions"],
            properties: {
              overview: {
                type: "string",
              },
              questions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["questionIndex", "values"],
                  properties: {
                    questionIndex: {
                      type: "integer",
                    },
                    values: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "Tu es un directeur artistique senior dans une agence de communication. Tu accompagnes un candidat qui construit sa marque. Reponds toujours en francais. Tes propositions doivent etre credibles, concretes, coherentes avec les reponses deja donnees et utiles pour une plateforme de formation de marque. Tu dois tenir compte explicitement du nom de marque fourni et, s'il existe, du nom d'entreprise du client. Si le contexte est incomplet, formule une hypothese raisonnable plutot qu'un discours vague. En mode improve, preserve l'intention du candidat tout en rendant la formulation plus claire, plus specifique et plus impactante. Ne fournis pas de meta-commentaire dans les champs de reponse.",
        },
        {
          role: "user",
          content: JSON.stringify({
            mode: input.mode,
            brandName: input.projectName,
            clientName: input.clientName ?? "",
            companyName: input.companyName ?? "",
            moduleTitle: input.module.title,
            submoduleTitle,
            exerciseType: input.exercise.type,
            exerciseQuestion: input.exercise.question,
            exerciseExplanation: input.exercise.explanation,
            questionSpecs,
            currentDraft,
            previousAnswers: contextItems,
            instructions: [
              "Le nom de marque est prioritaire: ancre tes propositions dans cet univers de marque et reutilise-le quand cela rend la reponse plus juste.",
              "Prends en compte toutes les reponses precedentes fournies dans previousAnswers pour rester coherent avec le positionnement, le ton et les choix deja exprimes.",
              "Si currentDraft contient deja une intention exploitable, preserve-la et fais-la monter en qualite au lieu de repartir de zero.",
              "Ignore totalement les exemples de reponse eventuellement affiches en placeholder dans l'interface. Ils ne doivent pas influencer le fond ni la formulation.",
              "Remplis chaque questionIndex present dans questionSpecs.",
              "Respecte exactement le nombre attendu de valeurs par question.",
              "Pour kind=list, renvoie uniquement des libelles brefs, distinctifs et directement exploitables.",
              "Pour kind=text, renvoie des formulations directement integrables dans le champ.",
              "Le champ overview doit contenir un conseil court et actionnable en une ou deux phrases maximum.",
            ],
          }),
        },
      ],
      max_completion_tokens: 1200,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : "Le service OpenAI n'a pas repondu correctement.";
    throw new Error(message);
  }

  const content = getChatCompletionContent(payload);

  if (!content) {
    throw new Error("La reponse IA est vide.");
  }

  const parsed = JSON.parse(content) as AssistanceResponse;

  return {
    coachingNote: parsed.overview.trim(),
    values: buildRawValuesFromAssistance({
      exercise: input.exercise,
      currentRawValues,
      response: parsed,
      mode: input.mode,
    }),
  };
}
