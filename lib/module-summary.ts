import {
  getTableCellCount,
  getPromptOpenLabel,
  isAnswerableExerciseType,
  parseIndexedAnswerItems,
  parseChecklistEntries,
  parseColorOption,
  parseStoredExerciseQuestionConfig,
  parseStoredTableConfig,
  splitFillBlankText,
} from "@/lib/exercise-types";
import {
  getBrandPersonaFields,
  parseStoredBrandPersonaConfig,
} from "@/lib/brand-persona";
import type { WorkspaceModule } from "@/lib/training-types";

export type ModuleSummaryHighlight = {
  label: string;
  value: string;
};

export type ModuleSubmoduleSummary = {
  id: number;
  title: string;
  position: number;
  summary: string;
  highlights: ModuleSummaryHighlight[];
};

export type ModuleSummaryCard = {
  eyebrow: string;
  title: string;
  subtitle: string;
  hero: string;
  insight: string;
  focusWords: string[];
  highlights: ModuleSummaryHighlight[];
  quickRecap: ModuleSummaryHighlight[];
  submoduleRecaps: ModuleSubmoduleSummary[];
  footer: string;
};

export function buildModuleSummaryCard(input: {
  projectName: string;
  module: WorkspaceModule;
}) {
  const detailedHighlights = input.module.exercises.flatMap((exercise) => {
    const values = input.module.answers[exercise.id] ?? [];
    const summary = summarizeExerciseAnswer(exercise, values);

    return summary ? [summary] : [];
  });

  const heroSource =
    detailedHighlights.find((item) => item.value.length >= 32) ??
    detailedHighlights[0];
  const focusWords = collectFocusWords(input.module).slice(0, 8);
  const highlights = detailedHighlights.slice(0, 5);
  const quickRecap =
    buildModuleSpecificQuickRecap(input.module) ?? buildGenericQuickRecap(input.module);
  const submoduleRecaps = buildSubmoduleRecaps(input.module);

  return {
    eyebrow: `Module ${input.module.position}`,
    title: input.module.title,
    subtitle: input.projectName.trim() || "Mon projet de marque",
    hero: heroSource?.value || "Les idees principales de ce module sont maintenant posees.",
    insight: buildInsightSentence(detailedHighlights.length > 0 ? detailedHighlights : quickRecap),
    focusWords,
    highlights,
    quickRecap,
    submoduleRecaps,
    footer:
      "Un récap rapide de ce qui a été formulé pendant le module, à relire et compléter quand tu le souhaites.",
  } satisfies ModuleSummaryCard;
}

function buildSubmoduleRecaps(module: WorkspaceModule) {
  return module.submodules.map((submodule) => {
    const highlights = submodule.exercises.flatMap((exercise) => {
      const values = module.answers[exercise.id] ?? [];
      const summary = summarizeExerciseAnswer(exercise, values);

      return summary ? [summary] : [];
    });
    const completedHighlights = highlights.filter(
      (highlight) => !isPlaceholderSummaryValue(highlight.value),
    );

    return {
      id: submodule.id,
      title: submodule.title,
      position: submodule.position,
      summary: buildSubmoduleInsightSentence(submodule.title, completedHighlights),
      highlights: completedHighlights.slice(0, 4),
    } satisfies ModuleSubmoduleSummary;
  });
}

function buildModuleSpecificQuickRecap(module: WorkspaceModule) {
  const normalizedTitle = normalizeForSearch(module.title);

  if (!normalizedTitle.includes("vision") || !normalizedTitle.includes("marque")) {
    return null;
  }

  const recap = [
    {
      label: "Description de la marque",
      item: findExerciseHighlight(
        module,
        [["decrire", "activite"], ["description", "marque"]],
        "Description de la marque",
      ),
    },
    {
      label: "Objectif du rebranding",
      item: findExerciseHighlight(
        module,
        [["objectif", "branding"], ["objectif", "rebranding"]],
        "Objectif du rebranding",
      ),
    },
    {
      label: "Mission",
      item: findPromptHighlight(module, "mission", "Mission"),
    },
    {
      label: "Vision",
      item: findPromptHighlight(module, "vision", "Vision"),
    },
    {
      label: "Valeurs",
      item: findValuesHighlight(module),
    },
    {
      label: "Promesse",
      item: findPromptHighlight(module, "promesse", "Promesse"),
    },
  ].map(({ label, item }) => item ?? buildEmptyHighlight(label, "À compléter"));

  return recap;
}

function buildGenericQuickRecap(module: WorkspaceModule) {
  const answerableExercises = module.exercises.filter((exercise) =>
    isAnswerableExerciseType(exercise.type),
  );

  if (answerableExercises.length === 0) {
    return [
      buildEmptyHighlight(
        "Contenu du module",
        "Ce module contient surtout de la lecture ou de l'inspiration.",
      ),
    ];
  }

  return answerableExercises.slice(0, 8).map((exercise) => {
    const values = module.answers[exercise.id] ?? [];
    const summary = summarizeExerciseAnswer(exercise, values);

    return (
      summary ??
      buildEmptyHighlight(getExerciseSummaryLabel(exercise), "A completer")
    );
  });
}

function summarizeExerciseAnswer(
  exercise: WorkspaceModule["exercises"][number],
  values: string[],
) {
  if (values.length === 0) {
    return null;
  }

  if (exercise.type === "open" || exercise.type === "prompt_open") {
    return buildHighlight(exercise.question, values[0]);
  }

  if (exercise.type === "single" || exercise.type === "boolean") {
    return buildHighlight(exercise.question, values[0]);
  }

  if (exercise.type === "multiple") {
    return buildHighlight(exercise.question, values.join(", "));
  }

  if (exercise.type === "color") {
    const colorLabels = values.map((value) => parseColorOption(value).label);
    return buildHighlight(exercise.question, colorLabels.join(", "));
  }

  if (exercise.type === "fill_blank") {
    return buildHighlight("Phrase clé", buildFillBlankSentence(exercise.question, values));
  }

  if (exercise.type === "group_open") {
    const indexedSummary = summarizeIndexedValues(exercise, values);

    if (indexedSummary) {
      return buildHighlight(exercise.question, indexedSummary, 180);
    }

    const firstFilledAnswerIndex = values.findIndex((value) => value.trim().length > 0);

    if (firstFilledAnswerIndex === -1) {
      return null;
    }

    return buildHighlight(
      exercise.options[firstFilledAnswerIndex] || exercise.question || "Reponse",
      values[firstFilledAnswerIndex],
    );
  }

  if (exercise.type === "brand_persona") {
    const personaSummary = summarizeBrandPersonaValues(exercise, values);

    return personaSummary
      ? buildHighlight(exercise.question || "Persona", personaSummary, 220)
      : null;
  }

  if (exercise.type === "checklist") {
    const entries = parseChecklistEntries(values);
    const keptEntries = entries.filter((entry) => entry.checked).map((entry) => entry.label);
    const labels = (keptEntries.length > 0
      ? keptEntries
      : entries.map((entry) => entry.label)
    ).slice(0, 5);

    return labels.length > 0
      ? buildHighlight("Mots retenus", labels.join(", "))
      : null;
  }

  if (exercise.type === "table") {
    const tableConfig = parseStoredTableConfig(exercise.options);
    const nonEmptyCells = values
      .map((value, index) => ({ value, index }))
      .filter((entry) => entry.value.trim().length > 0);

    if (nonEmptyCells.length === 0) {
      return null;
    }

    const preview = nonEmptyCells
      .slice(0, Math.min(3, getTableCellCount(tableConfig)))
      .map((entry) => {
        const columnIndex = entry.index % tableConfig.columns;
        const columnLabel =
          tableConfig.columnLabels[columnIndex] || `Colonne ${columnIndex + 1}`;

        return `${columnLabel}: ${entry.value}`;
      });

    return buildHighlight(exercise.question, preview.join(" | "));
  }

  const genericSummary = summarizeGenericValues(values);

  if (genericSummary) {
    return buildHighlight(getExerciseSummaryLabel(exercise), genericSummary, 180);
  }

  return null;
}

function getExerciseSummaryLabel(exercise: WorkspaceModule["exercises"][number]) {
  if (exercise.type === "prompt_open") {
    return getPromptOpenLabel(exercise.question) || "Point cle";
  }

  if (exercise.type === "image_upload") {
    return exercise.question || "Images ajoutees";
  }

  if (exercise.type === "brand_persona") {
    return exercise.question || "Persona de marque";
  }

  if (exercise.type === "color_palette") {
    return exercise.question || "Palette de couleurs";
  }

  if (exercise.type === "moodboard") {
    return exercise.question || "Moodboard";
  }

  if (exercise.type === "editorial_calendar") {
    return exercise.question || "Calendrier editorial";
  }

  if (exercise.type === "spectrum") {
    return exercise.question || "Positionnement";
  }

  return exercise.question || "Point cle";
}

function summarizeGenericValues(values: string[]) {
  const indexedValues = parseIndexedAnswerItems(values);

  if (indexedValues.length > 0) {
    return indexedValues
      .sort((left, right) =>
        left.questionIndex === right.questionIndex
          ? left.valueIndex - right.valueIndex
          : left.questionIndex - right.questionIndex,
      )
      .map((item) => compactText(item.value))
      .filter(Boolean)
      .slice(0, 4)
      .join(" | ");
  }

  const readableValues = values
    .map((value) => compactText(value))
    .filter(Boolean)
    .map((value) => {
      if (value.startsWith("{") || value.startsWith("[")) {
        return summarizeJsonValue(value);
      }

      return value;
    })
    .filter(Boolean)
    .slice(0, 4);

  return readableValues.join(" | ");
}

function summarizeBrandPersonaValues(
  exercise: WorkspaceModule["exercises"][number],
  values: string[],
) {
  const fields = getBrandPersonaFields(parseStoredBrandPersonaConfig(exercise.options));
  const indexedAnswers = parseIndexedAnswerItems(values);

  if (indexedAnswers.length === 0) {
    return summarizeGenericValues(values);
  }

  return fields
    .map((field, fieldIndex) => {
      const fieldValues = indexedAnswers
        .filter((item) => item.questionIndex === fieldIndex)
        .sort((left, right) => left.valueIndex - right.valueIndex)
        .map((item) => compactText(item.value))
        .filter(Boolean);

      return fieldValues.length > 0 ? `${field.label}: ${fieldValues.join(", ")}` : "";
    })
    .filter(Boolean)
    .slice(0, 4)
    .join(" | ");
}

function summarizeIndexedValues(
  exercise: WorkspaceModule["exercises"][number],
  values: string[],
) {
  const indexedAnswers = parseIndexedAnswerItems(values);

  if (indexedAnswers.length === 0) {
    return "";
  }

  const questionConfig = parseStoredExerciseQuestionConfig(exercise.type, exercise.options);
  const questionIndexes = [...new Set(indexedAnswers.map((item) => item.questionIndex))]
    .sort((left, right) => left - right)
    .slice(0, 4);

  return questionIndexes
    .map((questionIndex) => {
      const questionValues = indexedAnswers
        .filter((item) => item.questionIndex === questionIndex)
        .sort((left, right) => left.valueIndex - right.valueIndex)
        .map((item) => compactText(item.value))
        .filter(Boolean);

      if (questionValues.length === 0) {
        return "";
      }

      const label = compactText(questionConfig.items[questionIndex] ?? "");
      return label ? `${label}: ${questionValues.join(", ")}` : questionValues.join(", ");
    })
    .filter(Boolean)
    .join(" | ");
}

function summarizeJsonValue(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => summarizeUnknownValue(item))
        .filter(Boolean)
        .slice(0, 4)
        .join(", ");
    }

    return summarizeUnknownValue(parsed);
  } catch {
    return "";
  }
}

function summarizeUnknownValue(value: unknown): string {
  if (typeof value === "string") {
    return compactText(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  return Object.entries(value)
    .flatMap(([key, item]) => {
      if (typeof item === "string" && item.trim()) {
        return [`${key}: ${compactText(item)}`];
      }

      if (typeof item === "number" || typeof item === "boolean") {
        return [`${key}: ${String(item)}`];
      }

      return [];
    })
    .slice(0, 4)
    .join(", ");
}

function findExerciseHighlight(
  module: WorkspaceModule,
  keywordGroups: string[][],
  label: string,
) {
  const match = module.exercises.find((exercise) => {
    const sourceLabel =
      exercise.type === "prompt_open"
        ? getPromptOpenLabel(exercise.question)
        : exercise.question;

    const normalized = normalizeForSearch(sourceLabel);
    return keywordGroups.some((keywords) =>
      keywords.every((keyword) => normalized.includes(normalizeForSearch(keyword))),
    );
  });

  if (!match) {
    return null;
  }

  const values = module.answers[match.id] ?? [];
  const summary = summarizeExerciseAnswer(match, values);

  if (!summary) {
    return null;
  }

  return {
    label,
    value: summary.value,
  } satisfies ModuleSummaryHighlight;
}

function findPromptHighlight(
  module: WorkspaceModule,
  promptLabel: string,
  label: string,
) {
  const match = module.exercises.find(
    (exercise) =>
      exercise.type === "prompt_open" &&
      normalizeForSearch(getPromptOpenLabel(exercise.question)).includes(
        normalizeForSearch(promptLabel),
      ),
  );

  if (!match) {
    return null;
  }

  const values = module.answers[match.id] ?? [];
  const summary = summarizeExerciseAnswer(match, values);

  if (!summary) {
    return null;
  }

  return {
    label,
    value: summary.value,
  } satisfies ModuleSummaryHighlight;
}

function findValuesHighlight(module: WorkspaceModule) {
  const match = module.exercises.find((exercise) => {
    const normalizedQuestion = normalizeForSearch(exercise.question);
    return (
      exercise.type === "table" ||
      exercise.type === "checklist" ||
      normalizedQuestion.includes("valeur")
    );
  });

  if (!match) {
    return null;
  }

  const values = module.answers[match.id] ?? [];
  const summary =
    match.type === "table"
      ? buildTableValuesHighlight(match, values)
      : summarizeExerciseAnswer(match, values);

  if (!summary) {
    return null;
  }

  return {
    label: "Valeurs",
    value: summary.value,
  } satisfies ModuleSummaryHighlight;
}

function buildTableValuesHighlight(
  exercise: WorkspaceModule["exercises"][number],
  values: string[],
) {
  const tableConfig = parseStoredTableConfig(exercise.options);
  const rowSummaries = Array.from({ length: tableConfig.rows }, (_, rowIndex) => {
    const rowLabel = tableConfig.rowLabels[rowIndex] || `Ligne ${rowIndex + 1}`;
    const rowValues = Array.from({ length: tableConfig.columns }, (_, columnIndex) => {
      const cellIndex = rowIndex * tableConfig.columns + columnIndex;
      const cellValue = values[cellIndex]?.trim() ?? "";

      if (!cellValue) {
        return null;
      }

      const columnLabel =
        tableConfig.columnLabels[columnIndex] || `Colonne ${columnIndex + 1}`;

      return `${columnLabel}: ${cellValue}`;
    }).filter((entry): entry is string => Boolean(entry));

    if (rowValues.length === 0) {
      return null;
    }

    return `${rowLabel} - ${rowValues.join(", ")}`;
  }).filter((entry): entry is string => Boolean(entry));

  if (rowSummaries.length === 0) {
    return null;
  }

  return buildHighlight("Valeurs", rowSummaries.join(" | "), 280);
}

function collectFocusWords(module: WorkspaceModule) {
  const words = module.exercises.flatMap((exercise) => {
    const values = module.answers[exercise.id] ?? [];

    if (exercise.type === "checklist") {
      const entries = parseChecklistEntries(values);
      const keptEntries = entries.filter((entry) => entry.checked).map((entry) => entry.label);
      const source = keptEntries.length > 0 ? keptEntries : entries.map((entry) => entry.label);
      return source.map(compactText);
    }

    if (exercise.type === "single" || exercise.type === "multiple" || exercise.type === "boolean") {
      return values.map(compactText);
    }

    if (exercise.type === "color") {
      return values.map((value) => parseColorOption(value).label);
    }

    return [];
  });

  return [...new Set(words.filter(Boolean))];
}

function buildInsightSentence(highlights: ModuleSummaryHighlight[]) {
  const summarizedValues = [
    ...new Set(
      highlights
        .map((highlight) => getParagraphSummaryValue(highlight.value))
        .filter((value) => value && !isPlaceholderSummaryValue(value)),
    ),
  ];

  if (summarizedValues.length === 0) {
    return "Les grands axes de ce module sont posés et peuvent maintenant servir de repère concret.";
  }

  const mainPoints = summarizedValues.slice(0, 4);
  const additionalPoints = summarizedValues.slice(4, 8);
  const finalPoints = summarizedValues.slice(8);
  const paragraph = [
    `En synthese, ${joinSummaryParts(mainPoints)}.`,
    additionalPoints.length > 0
      ? `Le module précise aussi ${joinSummaryParts(additionalPoints)}.`
      : "",
    finalPoints.length > 0
      ? `Enfin, le travail complète cette base avec ${joinSummaryParts(finalPoints)}.`
      : "",
  ].filter(Boolean).join(" ");

  return truncateText(paragraph, 1000);
}

function buildSubmoduleInsightSentence(
  submoduleTitle: string,
  highlights: ModuleSummaryHighlight[],
) {
  const summarizedValues = [
    ...new Set(
      highlights
        .map((highlight) => getParagraphSummaryValue(highlight.value))
        .filter((value) => value && !isPlaceholderSummaryValue(value)),
    ),
  ].slice(0, 5);

  if (summarizedValues.length === 0) {
    return "Aucune réponse n'a encore été formulée dans ce sous-module.";
  }

  return truncateText(
    `${submoduleTitle} met en avant ${joinSummaryParts(summarizedValues)}.`,
    360,
  );
}

function joinSummaryParts(values: string[]) {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} et ${values[1]}`;
  }

  return truncateText(
    `${values.slice(0, -1).join(", ")} et ${values[values.length - 1]}`,
    480,
  );
}

function getParagraphSummaryValue(value: string) {
  return compactText(value)
    .split(" | ")
    .map((part) => part.replace(/^[^:]{1,80}:\s*/, "").trim())
    .filter(Boolean)
    .join(", ");
}

function isPlaceholderSummaryValue(value: string) {
  const normalized = normalizeForSearch(value);

  return normalized === "a completer" || normalized.includes("a completer");
}

function buildFillBlankSentence(question: string, values: string[]) {
  const parts = splitFillBlankText(question);
  let sentence = "";

  for (let index = 0; index < parts.length; index += 1) {
    sentence += parts[index] ?? "";

    if (index < values.length) {
      sentence += values[index] ?? "";
    }
  }

  return compactText(sentence);
}

function buildHighlight(label: string, value: string, maxValueLength = 120) {
  const normalizedValue = compactText(value);

  if (!normalizedValue) {
    return null;
  }

  return {
    label: truncateText(compactText(label) || "Point clé", 34),
    value: truncateText(normalizedValue, maxValueLength),
  } satisfies ModuleSummaryHighlight;
}

function buildEmptyHighlight(label: string, value: string) {
  return {
    label,
    value,
  } satisfies ModuleSummaryHighlight;
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForSearch(value: string) {
  return compactText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}...`;
}
