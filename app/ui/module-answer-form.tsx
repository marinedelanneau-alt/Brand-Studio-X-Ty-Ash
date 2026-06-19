"use client";

import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { Dispatch, SetStateAction } from "react";
import { requestModuleAnswerAssistance } from "../generate-module-answer-assistance";
import { saveModuleAnswers, saveModuleDraft } from "../save-module-answers";
import { uploadExerciseImages } from "../upload-exercise-images";
import BrandPersonaExercise from "./brand-persona-exercise";
import { getBrandPersonaFields, parseStoredBrandPersonaConfig } from "@/lib/brand-persona";
import { groupExercisesByGroupId } from "@/lib/exercise-groups";
import { normalizeVisibleContent } from "@/lib/pedagogical-content";
import {
  parseStoredSpectrumAnswer,
  parseStoredSpectrumConfig,
} from "@/lib/spectrum";
import {
  isColorPaletteComplete,
  parseStoredColorPaletteAnswer,
  parseStoredColorPaletteConfig,
} from "@/lib/color-palette";
import {
  isMoodboardComplete,
  parseStoredMoodboardAnswer,
  serializeMoodboardAnswer,
} from "@/lib/moodboard";
import { isEditorialCalendarComplete } from "@/lib/editorial-calendar";
import SpectrumExercise from "./spectrum-exercise";
import SmartFeedback from "./smart-feedback";
import ColorPaletteExercise from "./color-palette-exercise";
import MoodboardExercise from "./moodboard-exercise";
import EditorialCalendarExercise from "./editorial-calendar-exercise";
import PedagogicalContent from "./pedagogical-content";
import type { ModuleExercise, WorkspaceModule } from "@/lib/training-types";
import {
  getFillBlankCount,
  getTableCellCount,
  getAnswerPlaceholderItems,
  parseIndexedAnswerItems,
  parseStoredExerciseQuestionConfig,
  parseStoredImageUploadConfig,
  parseStoredTableConfig,
  parseChecklistEntries,
  getPromptOpenLabel,
  isAnswerableExerciseType,
  parseColorOption,
  serializeIndexedAnswerItem,
  serializeChecklistEntries,
  splitFillBlankText,
} from "@/lib/exercise-types";

type ModuleState = {
  status: "idle" | "error" | "success";
  message: string;
};

type AnswersByExercise = Record<number, string[]>;
type AiAssistMode = "suggest" | "improve";
type AiAssistState = {
  status: "idle" | "loading" | "error" | "success";
  mode: AiAssistMode | null;
  message: string;
};

const initialState: ModuleState = {
  status: "idle",
  message: "",
};

const initialAiAssistState: AiAssistState = {
  status: "idle",
  mode: null,
  message: "",
};

const IMAGE_UPLOAD_TIMEOUT_MS = 45000;
const IMAGE_UPLOAD_MAX_CLIENT_SIZE = 900 * 1024;
const IMAGE_UPLOAD_MAX_DIMENSION = 1600;
const MODULE_ANSWERS_DRAFT_PREFIX = "brand-studio-module-answers";
const OTHER_CHOICE_VALUE_PREFIX = "__other_choice__:";

function supportsExerciseAi(exercise: WorkspaceModule["exercises"][number]) {
  return (
    exercise.type === "open" ||
    exercise.type === "prompt_open" ||
    exercise.type === "group_open" ||
    exercise.type === "checklist" ||
    exercise.type === "editorial_calendar" ||
    exercise.type === "fill_blank" ||
    exercise.type === "table"
  );
}

function getQuestionValues(
  exercise: WorkspaceModule["exercises"][number],
  rawValues: string[],
  questionIndex: number,
) {
  const questionConfig = parseStoredExerciseQuestionConfig(exercise.type, exercise.options);

  if (questionConfig.items.length === 0) {
    return questionIndex === 0 ? rawValues : [];
  }

  const indexedItems = parseIndexedAnswerItems(rawValues);

  return indexedItems
    .filter((item) => item.questionIndex === questionIndex)
    .sort((left, right) => left.valueIndex - right.valueIndex)
    .map((item) => item.value);
}

function setQuestionValues(
  exercise: WorkspaceModule["exercises"][number],
  rawValues: string[],
  questionIndex: number,
  nextValues: string[],
) {
  const questionConfig = parseStoredExerciseQuestionConfig(exercise.type, exercise.options);

  if (questionConfig.items.length === 0) {
    return nextValues;
  }

  const keptItems = parseIndexedAnswerItems(rawValues).filter(
    (item) => item.questionIndex !== questionIndex,
  );
  const nextItems = nextValues.map((value, valueIndex) =>
    serializeIndexedAnswerItem(questionIndex, valueIndex, value),
  );

  return [
    ...keptItems
      .sort((left, right) =>
        left.questionIndex === right.questionIndex
          ? left.valueIndex - right.valueIndex
          : left.questionIndex - right.questionIndex,
      )
      .map((item) =>
        serializeIndexedAnswerItem(item.questionIndex, item.valueIndex, item.value),
      ),
    ...nextItems,
  ];
}

function normalizeTextEntryValue(
  exercise: WorkspaceModule["exercises"][number],
  value: string,
) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  return isDuplicateDisplayText(trimmedValue, [
    exercise.answer_placeholder,
    exercise.explanation,
    exercise.question,
    getPromptOpenLabel(exercise.question),
  ])
    ? ""
    : value;
}

function normalizeTextEntryValues(
  exercise: WorkspaceModule["exercises"][number],
  values: string[],
) {
  if (
    exercise.type !== "open" &&
    exercise.type !== "prompt_open" &&
    exercise.type !== "group_open" &&
    exercise.type !== "editorial_calendar" &&
    exercise.type !== "fill_blank" &&
    exercise.type !== "table"
  ) {
    return values;
  }

  return values.map((value) => normalizeTextEntryValue(exercise, value));
}

function normalizePlaceholderText(value: string) {
  return normalizeVisibleContent(value);
}

function normalizeDisplayText(value: string | null | undefined) {
  return normalizeVisibleContent(value);
}

function isOtherChoiceOption(value: string | null | undefined) {
  const normalizedValue = normalizeDisplayText(value);

  return (
    normalizedValue === "autre" ||
    normalizedValue === "autres" ||
    normalizedValue === "other"
  );
}

function getOtherChoiceOption(exercise: WorkspaceModule["exercises"][number]) {
  return exercise.options.find((option) => isOtherChoiceOption(option)) ?? null;
}

function serializeOtherChoiceValue(value: string) {
  return `${OTHER_CHOICE_VALUE_PREFIX}${value}`;
}

function isSerializedOtherChoiceValue(value: string) {
  return value.startsWith(OTHER_CHOICE_VALUE_PREFIX);
}

function parseSerializedOtherChoiceValue(value: string) {
  return isSerializedOtherChoiceValue(value)
    ? value.slice(OTHER_CHOICE_VALUE_PREFIX.length)
    : "";
}

function getOtherChoiceText(values: string[]) {
  return (
    values
      .map((value) => parseSerializedOtherChoiceValue(value))
      .find((value) => value.trim().length > 0) ?? ""
  );
}

function setOtherChoiceText(
  values: string[],
  otherOption: string,
  text: string,
) {
  const keptValues = values.filter((value) => !isSerializedOtherChoiceValue(value));
  const valuesWithOtherOption = keptValues.includes(otherOption)
    ? keptValues
    : [...keptValues, otherOption];

  return text.length > 0
    ? [...valuesWithOtherOption, serializeOtherChoiceValue(text)]
    : valuesWithOtherOption;
}

function removeOtherChoiceValues(values: string[], otherOption: string) {
  return values.filter(
    (value) => value !== otherOption && !isSerializedOtherChoiceValue(value),
  );
}

function normalizeOtherChoiceValuesForState(
  exercise: WorkspaceModule["exercises"][number],
  values: string[],
): string[] {
  if (exercise.type !== "single" && exercise.type !== "multiple") {
    return values;
  }

  const otherOption = getOtherChoiceOption(exercise);

  if (!otherOption) {
    return values;
  }

  const indexedItems = parseIndexedAnswerItems(values);

  if (indexedItems.length > 0) {
    const groupedValues = new Map<number, string[]>();

    indexedItems.forEach((item) => {
      groupedValues.set(item.questionIndex, [
        ...(groupedValues.get(item.questionIndex) ?? []),
        item.value,
      ]);
    });

    return Array.from(groupedValues.entries()).flatMap(([questionIndex, itemValues]) =>
      normalizeOtherChoiceValuesForState(exercise, itemValues).map((value, valueIndex) =>
        serializeIndexedAnswerItem(questionIndex, valueIndex, value),
      ),
    );
  }

  const optionLabels = new Set(exercise.options);
  const otherTextValues = values.filter(
    (value) =>
      value.trim().length > 0 &&
      !optionLabels.has(value) &&
      !isSerializedOtherChoiceValue(value) &&
      parseIndexedAnswerItems([value]).length === 0,
  );

  if (otherTextValues.length === 0) {
    return values;
  }

  const keptValues = values.filter((value) => !otherTextValues.includes(value));
  const nextValues = keptValues.includes(otherOption)
    ? keptValues
    : [...keptValues, otherOption];

  return [
    ...nextValues,
    ...otherTextValues.map((value) => serializeOtherChoiceValue(value)),
  ];
}

function normalizeOtherChoiceValuesForSubmission(
  exercise: WorkspaceModule["exercises"][number],
  values: string[],
): string[] {
  if (exercise.type !== "single" && exercise.type !== "multiple") {
    return values;
  }

  const otherOption = getOtherChoiceOption(exercise);

  if (!otherOption) {
    return values.filter((value) => !isSerializedOtherChoiceValue(value));
  }

  const indexedItems = parseIndexedAnswerItems(values);

  if (indexedItems.length > 0) {
    const groupedValues = new Map<number, string[]>();

    indexedItems.forEach((item) => {
      groupedValues.set(item.questionIndex, [
        ...(groupedValues.get(item.questionIndex) ?? []),
        item.value,
      ]);
    });

    return Array.from(groupedValues.entries()).flatMap(([questionIndex, itemValues]) =>
      normalizeOtherChoiceValuesForSubmission(exercise, itemValues).map(
        (value, valueIndex) =>
          serializeIndexedAnswerItem(questionIndex, valueIndex, value),
      ),
    );
  }

  const otherText = getOtherChoiceText(values).trim();
  const valuesWithoutTechnicalOther = values.filter(
    (value) => !isSerializedOtherChoiceValue(value),
  );

  if (!otherText) {
    return valuesWithoutTechnicalOther;
  }

  const valuesWithoutOtherOption = valuesWithoutTechnicalOther.filter(
    (value) => value !== otherOption,
  );

  if (exercise.type === "single") {
    return [otherText];
  }

  return [...valuesWithoutOtherOption, otherText];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeLegacyDisplayText(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/[â€™`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isDuplicateDisplayText(
  value: string | null | undefined,
  candidates: Array<string | null | undefined>,
) {
  const normalizedValue = normalizeDisplayText(value);

  if (!normalizedValue) {
    return false;
  }

  return candidates.some(
    (candidate) => normalizeDisplayText(candidate) === normalizedValue,
  );
}

function shouldShowExerciseExplanation(
  exercise: WorkspaceModule["exercises"][number],
  displayedTexts: Array<string | null | undefined> = [],
) {
  return (
    exercise.explanation.trim().length > 0 &&
    !isDuplicateDisplayText(exercise.explanation, [
      exercise.question,
      getPromptOpenLabel(exercise.question),
      ...displayedTexts,
    ])
  );
}

function getAnswerPlaceholder(
  exercise: WorkspaceModule["exercises"][number],
  displayedQuestion?: string,
  fallback = "Ta réponse",
) {
  const placeholder = exercise.answer_placeholder.trim();

  if (!placeholder) {
    return fallback;
  }

  const normalizedPlaceholder = normalizePlaceholderText(placeholder);
  const duplicateSources = [displayedQuestion, exercise.question, exercise.explanation]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalizePlaceholderText);

  return duplicateSources.includes(normalizedPlaceholder) ? fallback : placeholder;
}

function getTextMatchCandidates(value: string) {
  const normalizedValue = value.replace(/\s+/g, " ").trim();
  const candidates = [normalizedValue];
  const withoutQuotes = normalizedValue.replace(/[«»"']/g, "").trim();
  const separators = ["«", "\"", "'", " : ", ":"];

  if (withoutQuotes) {
    candidates.push(withoutQuotes);
  }

  separators.forEach((separator) => {
    const index = normalizedValue.lastIndexOf(separator);

    if (index >= 0) {
      const candidate = normalizedValue.slice(index + separator.length).trim();
      const candidateWithoutQuotes = candidate.replace(/[«»"']/g, "").trim();

      if (candidate) {
        candidates.push(candidate);
      }

      if (candidateWithoutQuotes) {
        candidates.push(candidateWithoutQuotes);
      }
    }
  });

  return Array.from(new Set(candidates)).filter(Boolean);
}

function findTextCandidateIndex(haystack: string, candidates: string[], fromIndex = 0) {
  return candidates.reduce((bestIndex, candidate) => {
    const index = haystack.indexOf(candidate, fromIndex);

    if (index < 0) {
      return bestIndex;
    }

    return bestIndex < 0 || index < bestIndex ? index : bestIndex;
  }, -1);
}

function getFillBlankAnswerPlaceholder(
  exercise: WorkspaceModule["exercises"][number],
  sourceQuestion: string,
  blankIndex: number,
  fallback = "Ta rÃ©ponse",
) {
  const placeholder = getAnswerPlaceholder(exercise, sourceQuestion, fallback);
  const blankCount = getFillBlankCount(sourceQuestion);
  const placeholderItems = getAnswerPlaceholderItems(placeholder, blankCount);
  const indexedPlaceholder = placeholderItems[blankIndex]?.trim();

  if (
    indexedPlaceholder &&
    (blankCount > 1 || placeholderItems.some((item) => item.trim()))
  ) {
    return indexedPlaceholder;
  }

  if (placeholder === fallback || !placeholder.trim()) {
    return placeholder;
  }

  const questionParts = splitFillBlankText(sourceQuestion);

  if (questionParts.length < 2 || blankIndex >= questionParts.length - 1) {
    return placeholder;
  }

  const beforeCandidates = getTextMatchCandidates(questionParts[blankIndex] ?? "");
  const afterCandidates = getTextMatchCandidates(questionParts[blankIndex + 1] ?? "");
  const beforeStartIndex = findTextCandidateIndex(placeholder, beforeCandidates);

  if (beforeStartIndex < 0 || beforeCandidates.length === 0) {
    return placeholder;
  }

  const beforeCandidate =
    beforeCandidates.find((candidate) => placeholder.startsWith(candidate, beforeStartIndex)) ??
    beforeCandidates[0] ??
    "";
  const valueStartIndex = beforeStartIndex + beforeCandidate.length;

  if (afterCandidates.length === 0) {
    const extracted = placeholder.slice(valueStartIndex).replace(/[»"']+\s*$/, "").trim();

    return extracted || placeholder;
  }

  const afterStartIndex = findTextCandidateIndex(
    placeholder,
    afterCandidates,
    valueStartIndex,
  );

  if (afterStartIndex < valueStartIndex) {
    return placeholder;
  }

  const extracted = placeholder.slice(valueStartIndex, afterStartIndex).trim();

  return extracted || placeholder;
}

function normalizeSubmissionValues(
  exercise: WorkspaceModule["exercises"][number],
  values: string[],
) {
  const normalizedValues = normalizeOtherChoiceValuesForSubmission(
    exercise,
    normalizeTextEntryValues(exercise, values),
  );

  if (exercise.type === "image_upload") {
    return getImageUploadValues(normalizedValues);
  }

  if (exercise.type === "editorial_calendar") {
    return normalizedValues;
  }

  if (exercise.type !== "moodboard") {
    return normalizedValues;
  }

  if (normalizedValues.length === 0) {
    return [];
  }

  return [serializeMoodboardAnswer(parseStoredMoodboardAnswer(normalizedValues))];
}

function isImageUploadValue(value: string) {
  const trimmedValue = value.trim();

  return (
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://") ||
    trimmedValue.startsWith("/") ||
    trimmedValue.startsWith("data:image/")
  );
}

function getImageUploadValues(values: string[]) {
  return values.map((value) => value.trim()).filter(isImageUploadValue);
}

async function optimizeImageForUpload(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  if (file.size <= IMAGE_UPLOAD_MAX_CLIENT_SIZE) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Image illisible."));
      element.src = imageUrl;
    });
    const scale = Math.min(
      IMAGE_UPLOAD_MAX_DIMENSION / Math.max(image.width, image.height),
      1,
    );
    const width = Math.max(Math.round(image.width * scale), 1);
    const height = Math.max(Math.round(image.height * scale), 1);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );

    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File(
      [blob],
      `${file.name.replace(/\.[^.]+$/, "") || "image"}.jpg`,
      {
        type: "image/jpeg",
        lastModified: Date.now(),
      },
    );
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function getAdaptiveInlineInputWidth(value: string, placeholder?: string) {
  const trimmedValue = value.trim();
  const fallbackLength = Math.max((placeholder ?? "").trim().length, 10);
  const contentLength = trimmedValue.length > 0 ? trimmedValue.length : fallbackLength;

  return `${Math.max(contentLength + 2, 12)}ch`;
}

function getQuestionPrompts(exercise: WorkspaceModule["exercises"][number]) {
  const config = parseStoredExerciseQuestionConfig(exercise.type, exercise.options);
  return config.items;
}

function getQuestionColumns(exercise: WorkspaceModule["exercises"][number]) {
  const config = parseStoredExerciseQuestionConfig(exercise.type, exercise.options);
  return Math.max(config.items.length > 0 ? config.columns : 1, 1);
}

function getChecklistColumns(exercise: WorkspaceModule["exercises"][number]) {
  const questionCount = getQuestionPrompts(exercise).length;
  return Math.max(questionCount, 1);
}

function getRenderableExerciseGroups(exercises: ModuleExercise[]) {
  return groupExercisesByGroupId(exercises).flatMap((group) => {
    if (group.questions.length <= 1) {
      return [group];
    }

    const supportsGroupedOpen = group.questions.every(
      (question) => question.type === "open" || question.type === "group_open",
    );
    const supportsGroupedChecklist = group.questions.every(
      (question) => question.type === "checklist",
    );

    if (supportsGroupedOpen || supportsGroupedChecklist) {
      return [group];
    }

    // Fallback: unsupported mixed groups are rendered as one step per question
    // so the user never gets a blank exercise screen.
    return group.questions.map((question, questionIndex) => ({
      id: `${group.id}-split-${question.id}-${questionIndex}`,
      position: group.position + questionIndex,
      questions: [question],
    }));
  });
}

function buildSubmissionFormData(
  module: WorkspaceModule,
  answers: AnswersByExercise,
) {
  const formData = new FormData();
  formData.set("moduleId", String(module.id));

  module.exercises.forEach((exercise) => {
    if (!isAnswerableExerciseType(exercise.type)) {
      return;
    }

    const fieldName = `exercise-${exercise.id}`;
    const values = normalizeSubmissionValues(exercise, answers[exercise.id] ?? []);

    if (exercise.type === "open" || exercise.type === "prompt_open") {
      const hasIndexedValues = parseIndexedAnswerItems(values).length > 0;

      if (values.length <= 1 && !hasIndexedValues) {
        formData.set(fieldName, values[0] ?? "");
        return;
      }

      values.forEach((value) => {
        formData.append(fieldName, value);
      });
      return;
    }

    values.forEach((value) => {
      formData.append(fieldName, value);
    });
  });

  return formData;
}

function getLocalAnswersDraftKey(moduleId: number) {
  return `${MODULE_ANSWERS_DRAFT_PREFIX}:${moduleId}`;
}

function parseLocalAnswersDraft(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const rawAnswers =
      "answers" in parsed && parsed.answers && typeof parsed.answers === "object"
        ? parsed.answers
        : parsed;

    return Object.fromEntries(
      Object.entries(rawAnswers)
        .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]))
        .map(([exerciseId, values]) => [
          Number(exerciseId),
          values.filter((value): value is string => typeof value === "string"),
        ])
        .filter(([exerciseId]) => Number.isFinite(exerciseId)),
    ) satisfies AnswersByExercise;
  } catch {
    return null;
  }
}

function readLocalAnswersDraft(moduleId: number) {
  if (typeof window === "undefined") {
    return null;
  }

  return parseLocalAnswersDraft(window.localStorage.getItem(getLocalAnswersDraftKey(moduleId)));
}

function writeLocalAnswersDraft(moduleId: number, answers: AnswersByExercise) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getLocalAnswersDraftKey(moduleId),
      JSON.stringify({
        updatedAt: Date.now(),
        answers,
      }),
    );
  } catch {
    // Local storage is only a backup; server persistence remains the source of truth.
  }
}

function mergeLocalAnswersDraft(module: WorkspaceModule, answers: AnswersByExercise) {
  const localDraft = readLocalAnswersDraft(module.id);

  if (!localDraft) {
    return answers;
  }

  const exerciseById = new Map(module.exercises.map((exercise) => [exercise.id, exercise]));
  const validLocalEntries = Object.fromEntries(
    Object.entries(localDraft).flatMap(([exerciseId, values]) => {
      const exercise = exerciseById.get(Number(exerciseId));

      if (!exercise || !Array.isArray(values)) {
        return [];
      }

      const normalizedValues = normalizeOtherChoiceValuesForState(
        exercise,
        normalizeTextEntryValues(
          exercise,
          values.filter((value): value is string => typeof value === "string"),
        ),
      );

      return [[Number(exerciseId), normalizedValues]];
    }),
  ) as AnswersByExercise;

  return {
    ...answers,
    ...validLocalEntries,
  };
}

function createInitialAnswers(module: WorkspaceModule) {
  const answers = module.exercises.reduce<AnswersByExercise>((accumulator, exercise) => {
    const savedAnswers = normalizeTextEntryValues(
      exercise,
      module.answers[exercise.id] ?? [],
    );
    const tableConfig = parseStoredTableConfig(exercise.options);
    const normalizedSavedAnswers =
      exercise.type === "image_upload"
        ? getImageUploadValues(savedAnswers)
        : normalizeOtherChoiceValuesForState(exercise, savedAnswers);

    accumulator[exercise.id] =
      exercise.type === "fill_blank" && normalizedSavedAnswers.length === 0
        ? Array.from({ length: getFillBlankCount(exercise.question) }, () => "")
        : exercise.type === "group_open" && normalizedSavedAnswers.length === 0
          ? Array.from({ length: exercise.options.length }, () => "")
          : exercise.type === "table"
            ? Array.from(
                { length: getTableCellCount(tableConfig) },
                (_, index) => normalizedSavedAnswers[index] ?? "",
              )
            : normalizedSavedAnswers;

    return accumulator;
  }, {});

  return mergeLocalAnswersDraft(module, answers);
}

function mergeAnswers(
  currentAnswers: AnswersByExercise,
  nextAnswers: AnswersByExercise,
) {
  return Object.fromEntries(
    Object.entries(nextAnswers).map(([exerciseId, nextValues]) => [
      Number(exerciseId),
      currentAnswers[Number(exerciseId)] ?? nextValues,
    ]),
  ) satisfies AnswersByExercise;
}

function isExerciseAnswered(
  exercise: WorkspaceModule["exercises"][number],
  answers: AnswersByExercise,
) {
  if (!isAnswerableExerciseType(exercise.type)) {
    return true;
  }

  const values = answers[exercise.id] ?? [];
  const normalizedValues = normalizeTextEntryValues(exercise, values);
  const questionPrompts = getQuestionPrompts(exercise);

  if (questionPrompts.length > 0) {
    return questionPrompts.every((prompt, questionIndex) => {
      const questionValues = getQuestionValues(
        exercise,
        normalizedValues,
        questionIndex,
      );

      if (exercise.type === "fill_blank") {
        const expectedCount = getFillBlankCount(prompt);
        return (
          questionValues.length === expectedCount &&
          questionValues.every((value) => value.trim().length > 0)
        );
      }

      if (exercise.type === "table") {
        const tableConfig = parseStoredTableConfig(exercise.options);
        const expectedCount = getTableCellCount(tableConfig);
        return (
          questionValues.length === expectedCount &&
          questionValues.every((value) => value.trim().length > 0)
        );
      }

      return questionValues.some((value) => value.trim().length > 0);
    });
  }

  if (exercise.type === "fill_blank") {
    const expectedCount = getFillBlankCount(exercise.question);
    return (
      normalizedValues.length === expectedCount &&
      normalizedValues.every((value) => value.trim().length > 0)
    );
  }

  if (exercise.type === "group_open") {
    return (
      normalizedValues.length === exercise.options.length &&
      normalizedValues.every((value) => value.trim().length > 0)
    );
  }

  if (exercise.type === "brand_persona") {
    const fields = getBrandPersonaFields(parseStoredBrandPersonaConfig(exercise.options));
    const requiredFields = fields.filter((field) => field.required);
    const indexedAnswers = parseIndexedAnswerItems(normalizedValues);

    if (requiredFields.length === 0) {
      return indexedAnswers.length > 0;
    }

    return requiredFields.every((field) => {
      const fieldIndex = fields.findIndex((item) => item.id === field.id);
      return indexedAnswers
        .filter((entry) => entry.questionIndex === fieldIndex)
        .some((entry) => entry.value.trim().length > 0);
    });
  }

  if (exercise.type === "spectrum") {
    const config = parseStoredSpectrumConfig(exercise.options);
    const parsedAnswer = parseStoredSpectrumAnswer(normalizedValues);

    if (!parsedAnswer) {
      return false;
    }

    if (config.enableJustification && config.requireJustification) {
      return parsedAnswer.justification.trim().length > 0;
    }

    return true;
  }

  if (exercise.type === "color_palette") {
    return isColorPaletteComplete(
      parseStoredColorPaletteAnswer(normalizedValues),
      parseStoredColorPaletteConfig(exercise.options),
    );
  }

  if (exercise.type === "image_upload") {
    return getImageUploadValues(normalizedValues).length > 0;
  }

  if (exercise.type === "moodboard") {
    return isMoodboardComplete(parseStoredMoodboardAnswer(normalizedValues));
  }

  if (exercise.type === "editorial_calendar") {
    return isEditorialCalendarComplete(normalizedValues);
  }

  if (exercise.type === "table") {
    const tableConfig = parseStoredTableConfig(exercise.options);
    const expectedCount = getTableCellCount(tableConfig);

    return (
      normalizedValues.length === expectedCount &&
      normalizedValues.every((value) => value.trim().length > 0)
    );
  }

  return normalizedValues.some((value) => value.trim().length > 0);
}

function getNextStepLabel(input: {
  currentExercise?: WorkspaceModule["exercises"][number];
  currentIndex: number;
  visibleExerciseCount: number;
  isLastSubmodule: boolean;
}) {
  if (input.currentExercise && input.currentIndex < input.visibleExerciseCount - 1) {
    return isPassiveContentType(input.currentExercise.type)
      ? "Element suivant"
      : "Question suivante";
  }

  if (!input.isLastSubmodule) {
    return "Sous-module suivant";
  }

  return "Voir le résumé du module";
}

function getModuleSummaryHref(moduleId: number) {
  return `/mon-espace/module/${moduleId}?summary=1#resume-module`;
}

function getStaticTextHtml(content: string) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return "";
  }

  if (/<[^>]+>/.test(trimmedContent)) {
    return trimmedContent;
  }

  return trimmedContent
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replaceAll("\n", "<br />")}</p>`)
    .join("");
}

function shouldPreventImplicitSubmit(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target instanceof HTMLTextAreaElement) {
    return false;
  }

  if (!(target instanceof HTMLInputElement)) {
    return false;
  }

  const blockedTypes = new Set([
    "text",
    "search",
    "email",
    "url",
    "tel",
    "password",
    "number",
  ]);

  return blockedTypes.has(target.type);
}

function isPassiveContentType(
  type: WorkspaceModule["exercises"][number]["type"] | undefined,
) {
  return type === "static_text" || type === "popup_message";
}

function PopupMessageCard({
  question,
  explanation,
  onClose,
}: {
  question: string;
  explanation?: string;
  onClose?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#eadfca] bg-[linear-gradient(145deg,#fffaf2,#fff3df_55%,#fef8ef)] p-5 shadow-[0_22px_60px_rgba(120,92,56,0.14)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(240,207,85,0.32),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(207,116,48,0.18),transparent_38%)]" />
      <div className="relative rounded-[1.6rem] border border-white/80 bg-white/88 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.24em] text-[#cf7430]">
              Pause inspiration
            </p>
            <p className="mt-2 font-[family:var(--font-cormorant)] text-[2.2rem] leading-[0.95] text-[#4b4550]">
              Un souffle pour la suite
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca] bg-white/90 text-[#7b7068] transition hover:border-[#cf7430] hover:text-[#cf7430]"
              aria-label="Fermer la pop-up"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(255,248,235,0.95),rgba(255,255,255,0.94))] px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <p className="text-4xl leading-none text-[#cf7430]/60">â€œ</p>
          <div
            className="module-content mt-2 max-w-none font-[family:var(--font-cormorant)] text-[2rem] leading-[1.15] text-[#2f3d4f] sm:text-[2.35rem]"
            dangerouslySetInnerHTML={{ __html: getStaticTextHtml(question) }}
          />
          {explanation ? (
            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#7a7087]">
              {explanation}
            </p>
          ) : null}
        </div>

        {onClose ? (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#eadfca] bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#6b625a] transition hover:border-[#cf7430] hover:text-[#cf7430]"
            >
              Fermer
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VoiceNotePlayer({ src }: { src?: string | null }) {
  if (!src?.trim()) {
    return null;
  }

  return (
    <div className="rounded-[1.2rem] border border-[#f0e4d3] bg-[#fffdf7] px-5 py-4">
      <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
        Note vocale
      </p>
      <audio controls preload="metadata" className="mt-3 w-full">
        <source src={src} type="audio/mpeg" />
        Votre navigateur ne peut pas lire cette note vocale.
      </audio>
    </div>
  );
}

export default function ModuleAnswerForm({
  module,
  activeSubmoduleId,
  initialExerciseIndex = 0,
  currentSubmoduleIndex = 0,
  totalSubmodules = module.submodules.length,
  onPreviousSubmodule,
  onNextSubmodule,
  onComplete,
}: {
  module: WorkspaceModule;
  activeSubmoduleId?: number;
  initialExerciseIndex?: number;
  currentSubmoduleIndex?: number;
  totalSubmodules?: number;
  onPreviousSubmodule?: () => void;
  onNextSubmodule?: () => void;
  onComplete?: (answers: Record<number, string[]>) => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveModuleAnswers,
    initialState,
  );
  const [currentIndex, setCurrentIndex] = useState(initialExerciseIndex);
  const [answers, setAnswers] = useState<AnswersByExercise>(() =>
    createInitialAnswers(module),
  );
  const [checklistDrafts, setChecklistDrafts] = useState<Record<string, string>>({});
  const [, setAutoSaveState] = useState<ModuleState>(initialState);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [aiAssistStates, setAiAssistStates] = useState<Record<number, AiAssistState>>({});
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [, startAutoSaveTransition] = useTransition();
  const latestAnswersRef = useRef<AnswersByExercise>(answers);
  const draftSaveQueueRef = useRef<Promise<ModuleState | null>>(Promise.resolve(null));
  const hasMountedRef = useRef(false);
  const previousModuleIdRef = useRef(module.id);
  const allowExplicitSubmitRef = useRef(false);
  const submitModeRef = useRef<"draft" | "complete" | null>(null);
  const shouldOpenSummaryAfterSaveRef = useRef(false);

  const currentSubmodule = useMemo(
    () =>
      module.submodules.find((submodule) => submodule.id === activeSubmoduleId) ??
      module.submodules[0],
    [activeSubmoduleId, module.submodules],
  );
  const visibleExerciseGroups = useMemo(
    () => getRenderableExerciseGroups(currentSubmodule?.exercises ?? []),
    [currentSubmodule],
  );
  const currentExerciseGroup = visibleExerciseGroups[currentIndex];
  const currentExerciseQuestions = currentExerciseGroup?.questions ?? [];
  const currentExercise = currentExerciseQuestions[0];
  const currentQuestionPrompts = currentExercise ? getQuestionPrompts(currentExercise) : [];
  const isMultiQuestionExerciseGroup = currentExerciseQuestions.length > 1;
  const isChecklistExerciseGroup =
    isMultiQuestionExerciseGroup &&
    currentExerciseQuestions.every((question) => question.type === "checklist");
  const isOpenExerciseGroup =
    isMultiQuestionExerciseGroup &&
    currentExerciseQuestions.every(
      (question) => question.type === "open" || question.type === "group_open",
    );
  const progressCount = useMemo(
    () =>
      module.exercises.filter(
        (exercise) =>
          isAnswerableExerciseType(exercise.type) &&
          isExerciseAnswered(exercise, answers),
      ).length,
    [answers, module.exercises],
  );
  const totalAnswerableExercises = useMemo(
    () => module.exercises.filter((exercise) => isAnswerableExerciseType(exercise.type)).length,
    [module.exercises],
  );
  const isFirstSubmodule = currentSubmoduleIndex === 0;
  const isLastSubmodule =
    totalSubmodules === 0 || currentSubmoduleIndex === totalSubmodules - 1;
  const nextStepLabel = getNextStepLabel({
    currentExercise,
    currentIndex,
    visibleExerciseCount: visibleExerciseGroups.length,
    isLastSubmodule,
  });

  const persistCurrentDraft = useCallback(({ showPending = false } = {}) => {
    if (showPending) {
      setIsSavingDraft(true);
    }

    draftSaveQueueRef.current = draftSaveQueueRef.current
      .catch(() => null)
      .then(async () => {
        const result = await saveModuleDraft(
          buildSubmissionFormData(module, latestAnswersRef.current),
        );
        setAutoSaveState(result);

        return result;
      })
      .finally(() => {
        if (showPending) {
          setIsSavingDraft(false);
        }
      });

    return draftSaveQueueRef.current;
  }, [module]);

  async function saveCurrentDraft() {
    try {
      const result = await persistCurrentDraft({ showPending: true });

      return result?.status !== "error";
    } catch {
      return false;
    }
  }

  async function goToNextStep() {
    const didSave = await saveCurrentDraft();

    if (!didSave) {
      return;
    }

    if (currentExercise && currentIndex < visibleExerciseGroups.length - 1) {
      setCurrentIndex((current) =>
        Math.min(current + 1, visibleExerciseGroups.length - 1),
      );
      return;
    }

    if (!isLastSubmodule) {
      onNextSubmodule?.();
      return;
    }

    window.location.assign(getModuleSummaryHref(module.id));
  }

  async function goToPreviousStep() {
    const didSave = await saveCurrentDraft();

    if (!didSave) {
      return;
    }

    if (currentIndex > 0) {
      setCurrentIndex((current) => Math.max(current - 1, 0));
      return;
    }

    onPreviousSubmodule?.();
  }

  useEffect(() => {
    setCurrentIndex(initialExerciseIndex);
  }, [activeSubmoduleId, initialExerciseIndex]);

  useEffect(() => {
    latestAnswersRef.current = answers;
    writeLocalAnswersDraft(module.id, answers);
  }, [answers, module.id]);

  useEffect(() => {
    setCurrentIndex((current) =>
      Math.min(current, Math.max(visibleExerciseGroups.length - 1, 0)),
    );
  }, [visibleExerciseGroups.length]);

  useEffect(() => {
    setIsPopupOpen(currentExercise?.type === "popup_message");
  }, [currentExercise?.id, currentExercise?.type]);

  useEffect(() => {
    const nextInitialAnswers = createInitialAnswers(module);

    if (previousModuleIdRef.current !== module.id) {
      previousModuleIdRef.current = module.id;
      setAnswers(nextInitialAnswers);
      setChecklistDrafts({});
      setAutoSaveState(initialState);
      setAiAssistStates({});
      shouldOpenSummaryAfterSaveRef.current = false;
      hasMountedRef.current = false;
      return;
    }

    setAnswers((currentAnswers) => mergeAnswers(currentAnswers, nextInitialAnswers));
  }, [module]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startAutoSaveTransition(async () => {
        await persistCurrentDraft();
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [answers, module, persistCurrentDraft]);

  useEffect(() => {
    function saveBeforeLeaving() {
      void persistCurrentDraft();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        saveBeforeLeaving();
      }
    }

    window.addEventListener("pagehide", saveBeforeLeaving);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", saveBeforeLeaving);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [module, persistCurrentDraft]);

  useEffect(() => {
    if (!isPopupOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPopupOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isPopupOpen]);

  useEffect(() => {
    if (state.status !== "success" || !shouldOpenSummaryAfterSaveRef.current) {
      return;
    }

    shouldOpenSummaryAfterSaveRef.current = false;
    window.location.assign(getModuleSummaryHref(module.id));
  }, [module.id, state.status]);

  async function handleAiAssist(
    exercise: WorkspaceModule["exercises"][number],
    mode: AiAssistMode,
  ) {
    setAiAssistStates((current) => ({
      ...current,
      [exercise.id]: {
        status: "loading",
        mode,
        message: mode === "suggest" ? "Génération en cours..." : "Relecture en cours...",
      },
    }));

    const result = await requestModuleAnswerAssistance({
      moduleId: module.id,
      exerciseId: exercise.id,
      mode,
      currentAnswers: answers,
    });

    if (result.status === "success") {
      setAnswers((current) => ({
        ...current,
        [exercise.id]: result.values,
      }));
    }

    setAiAssistStates((current) => ({
      ...current,
      [exercise.id]: {
        status: result.status,
        mode,
        message: result.coachingNote || result.message,
      },
    }));
  }

  if (module.exercises.length === 0) {
    return (
      <div className="rounded-[1rem] border border-dashed border-[#eadfca] bg-[#fffdf7] p-5 text-base leading-7 text-[#7b7068]">
        Aucun exercice n&apos;est encore disponible pour ce module.
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-6"
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey &&
          shouldPreventImplicitSubmit(event.target)
        ) {
          event.preventDefault();
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();

        if (!allowExplicitSubmitRef.current) {
          return;
        }

        allowExplicitSubmitRef.current = false;
        const submitMode = submitModeRef.current;
        submitModeRef.current = null;
        const formData = buildSubmissionFormData(module, latestAnswersRef.current);

        if (submitMode === "complete") {
          shouldOpenSummaryAfterSaveRef.current = true;
          onComplete?.(latestAnswersRef.current);
        }

        startTransition(() => {
          void formAction(formData);
        });
      }}
    >
      <div className="border-b border-[#eadfca] pb-3">
        {state.status === "error" && state.message ? (
          <div className="mb-4 rounded-[1rem] border border-[#efc6bf] bg-[#fff4f1] px-4 py-4 text-sm leading-6 text-[#9d4e40]">
            {state.message}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <p className="text-[0.76rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
            {visibleExerciseGroups.length > 0
              ? isPassiveContentType(currentExercise?.type)
                ? currentExercise?.type === "popup_message"
                  ? `Inspiration ${currentIndex + 1} sur ${visibleExerciseGroups.length}`
                  : `Texte ${currentIndex + 1} sur ${visibleExerciseGroups.length}`
                : `Question ${currentIndex + 1} sur ${visibleExerciseGroups.length}`
              : "Aucun exercice dans ce sous-module"}
          </p>
          <p className="text-sm text-[#8a8077]">
            {progressCount}/{totalAnswerableExercises} complétées
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1ece5]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#d88a2f,#f0cf55)] transition-[width]"
            style={{
              width: `${Math.max(
                (visibleExerciseGroups.length > 0
                  ? ((currentIndex + 1) / visibleExerciseGroups.length) * 100
                  : 0),
                8,
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {currentSubmodule ? (
          <p className="text-[0.76rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
            {currentSubmodule.title}
          </p>
        ) : null}
        {!isPassiveContentType(currentExercise?.type) ? (
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7a7087]">
            {visibleExerciseGroups.length > 0
              ? `Exercice ${currentIndex + 1}`
              : "Exercices à venir"}
          </p>
        ) : null}

        {currentExercise ? (
          <>
            {shouldShowExerciseExplanation(currentExercise, currentQuestionPrompts) &&
            !isPassiveContentType(currentExercise.type) &&
            currentExercise.type !== "brand_persona" &&
            currentExercise.type !== "color_palette" ? (
              <PedagogicalContent
                content={currentExercise.explanation}
                className="mt-5 rounded-[1.2rem] border border-[#eadfca] bg-white/78 px-5 py-5 shadow-[0_12px_30px_rgba(126,102,78,0.07)]"
              />
            ) : null}
            <VoiceNotePlayer src={currentExercise.audio_url} />
            {currentExercise.type !== "prompt_open" &&
            !isPassiveContentType(currentExercise.type) &&
            currentExercise.type !== "fill_blank" &&
            currentExercise.type !== "brand_persona" &&
            currentExercise.type !== "color_palette" &&
            currentQuestionPrompts.length === 0 &&
            !isMultiQuestionExerciseGroup &&
            currentExercise.question.trim().length > 0 ? (
              <div className="mt-3 flex items-start gap-3">
                <p className="min-w-0 flex-1 text-base leading-7 text-[#5f544a]">
                  {currentExercise.question}
                </p>
                <ExerciseAiActions
                  exercise={currentExercise}
                  state={aiAssistStates[currentExercise.id] ?? initialAiAssistState}
                  onSuggest={() => void handleAiAssist(currentExercise, "suggest")}
                  onImprove={() => void handleAiAssist(currentExercise, "improve")}
                />
              </div>
            ) : null}

            {isOpenExerciseGroup ? (
              <MultiQuestionOpenExerciseGroup
                questions={currentExerciseQuestions}
                answers={answers}
                aiAssistStates={aiAssistStates}
                onAiAssist={handleAiAssist}
                onChange={(exerciseId, nextValues) =>
                  setAnswers((current) => ({
                    ...current,
                    [exerciseId]: nextValues,
                  }))
                }
              />
            ) : null}

            {isChecklistExerciseGroup ? (
              <MultiQuestionChecklistExerciseGroup
                questions={currentExerciseQuestions}
                answers={answers}
                drafts={checklistDrafts}
                setDrafts={setChecklistDrafts}
                onChange={(exerciseId, nextValues) =>
                  setAnswers((current) => ({
                    ...current,
                    [exerciseId]: nextValues,
                  }))
                }
              />
            ) : null}

            {currentExercise.type === "static_text" ? (
              <div className="relative mt-4 overflow-hidden rounded-[2rem] border border-white/90 bg-white px-6 py-6 shadow-[0_16px_38px_rgba(126,102,78,0.08),0_2px_10px_rgba(207,116,48,0.06)] ring-1 ring-[#f3e5d2]/80 sm:px-7 sm:py-7">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,rgba(243,198,35,0.12),transparent_52%),radial-gradient(circle_at_top_right,rgba(207,116,48,0.08),transparent_44%)]"
                />
                <div
                  className="module-content relative max-w-none text-[1rem] leading-8 text-[#5f544a] sm:text-[1.06rem]"
                  dangerouslySetInnerHTML={{
                    __html: getStaticTextHtml(currentExercise.question),
                  }}
                />
                {shouldShowExerciseExplanation(currentExercise) ? (
                  <PedagogicalContent
                    content={currentExercise.explanation}
                    className="relative mt-5 rounded-[1.2rem] border border-[#eadfca] bg-[#fffaf2] px-5 py-5"
                  />
                ) : null}
              </div>
            ) : null}

            {currentExercise.type === "popup_message" ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[1.3rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff5e8)] p-5">
                  <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
                    Citation ou motivation
                  </p>
                  <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2rem] leading-[0.95] text-[#4b4550]">
                    Une pop-up inspirante s&apos;affiche sur cette etape
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#7b7068]">
                    L&apos;utilisateur peut la fermer librement puis continuer le parcours. Il peut
                    aussi la rouvrir s&apos;il souhaite relire le message.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPopupOpen(true)}
                      className="rounded-full border border-[#eadfca] bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#6b625a]"
                    >
                      Ouvrir la pop-up
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {currentExercise.type === "brand_persona" ? (
              <BrandPersonaExercise
                key={currentExercise.id}
                exercise={currentExercise}
                answers={answers[currentExercise.id] ?? []}
                onChange={(nextValues) =>
                  setAnswers((current) => ({
                    ...current,
                    [currentExercise.id]: nextValues,
                  }))
                }
              />
            ) : null}

            {currentExercise.type === "spectrum" ? (
              <SpectrumExercise
                key={currentExercise.id}
                exercise={currentExercise}
                answers={answers[currentExercise.id] ?? []}
                onChange={(nextValues) =>
                  setAnswers((current) => ({
                    ...current,
                    [currentExercise.id]: nextValues,
                  }))
                }
              />
            ) : null}

            {currentExercise.type === "color_palette" ? (
              <ColorPaletteExercise
                key={currentExercise.id}
                exercise={currentExercise}
                answers={answers[currentExercise.id] ?? []}
                onChange={(nextValues) =>
                  setAnswers((current) => ({
                    ...current,
                    [currentExercise.id]: nextValues,
                  }))
                }
              />
            ) : null}

            {!isMultiQuestionExerciseGroup &&
            (currentExercise.type === "open" || currentExercise.type === "group_open") ? (
              <>
                {currentQuestionPrompts.length > 0 ? (
                  <div className="mt-4 space-y-4">
                  {currentQuestionPrompts.map((prompt, questionIndex) => (
                    <label
                      key={`${currentExercise.id}-question-${questionIndex}`}
                      className="block rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4"
                    >
                      <span className="flex items-start gap-3">
                        <span className="min-w-0 flex-1 text-sm font-semibold leading-7 text-[#5f544a]">
                          {prompt}
                        </span>
                        <ExerciseAiActions
                          exercise={currentExercise}
                          state={aiAssistStates[currentExercise.id] ?? initialAiAssistState}
                          onSuggest={() => void handleAiAssist(currentExercise, "suggest")}
                          onImprove={() => void handleAiAssist(currentExercise, "improve")}
                        />
                      </span>
                      <textarea
                        value={
                          getQuestionValues(
                            currentExercise,
                            answers[currentExercise.id] ?? [],
                            questionIndex,
                          )[0] ?? ""
                        }
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [currentExercise.id]: setQuestionValues(
                              currentExercise,
                              current[currentExercise.id] ?? [],
                              questionIndex,
                              [event.target.value],
                            ),
                          }))
                        }
                        className="mt-3 min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-base text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
                        placeholder={getAnswerPlaceholder(currentExercise, prompt)}
                      />
                      <SmartFeedback
                        value={normalizeTextEntryValue(
                          currentExercise,
                          getQuestionValues(
                            currentExercise,
                            answers[currentExercise.id] ?? [],
                            questionIndex,
                          )[0] ?? "",
                        )}
                        feedbackConfig={currentExercise.feedback_config}
                        fieldKey={`exercise-${currentExercise.id}-${questionIndex}`}
                        sectionKey="module_answer"
                      />
                    </label>
                  ))}
                  </div>
                ) : (
                  <>
                    <textarea
                      value={answers[currentExercise.id]?.[0] ?? ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [currentExercise.id]: [event.target.value],
                        }))
                      }
                      className="mt-4 min-h-32 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-base text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
                      placeholder={getAnswerPlaceholder(currentExercise)}
                    />
                    <SmartFeedback
                      value={normalizeTextEntryValue(
                        currentExercise,
                        answers[currentExercise.id]?.[0] ?? "",
                      )}
                      feedbackConfig={currentExercise.feedback_config}
                      fieldKey={`exercise-${currentExercise.id}`}
                      sectionKey="module_answer"
                    />
                  </>
                )}
              </>
            ) : null}

            {currentExercise.type === "prompt_open" ? (
              <>
                {currentQuestionPrompts.length > 0 ? (
                  <div
                    className="mt-4 grid gap-4 md:[grid-template-columns:var(--question-columns)]"
                    style={{
                      ["--question-columns" as string]: `repeat(${getQuestionColumns(
                        currentExercise,
                      )}, minmax(0, 1fr))`,
                    }}
                  >
                  {currentQuestionPrompts.map((prompt, questionIndex) => (
                    <label
                      key={`${currentExercise.id}-prompt-${questionIndex}`}
                      className="block rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="mt-2 block font-[family:var(--font-cormorant)] text-[1.8rem] font-semibold leading-none text-[#20324a]">
                            {prompt}
                          </span>
                        </div>
                        <ExerciseAiActions
                          exercise={currentExercise}
                          state={aiAssistStates[currentExercise.id] ?? initialAiAssistState}
                          onSuggest={() => void handleAiAssist(currentExercise, "suggest")}
                          onImprove={() => void handleAiAssist(currentExercise, "improve")}
                        />
                      </div>
                      <input
                        type="text"
                        value={
                          getQuestionValues(
                            currentExercise,
                            answers[currentExercise.id] ?? [],
                            questionIndex,
                          )[0] ?? ""
                        }
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [currentExercise.id]: setQuestionValues(
                              currentExercise,
                              current[currentExercise.id] ?? [],
                              questionIndex,
                              [event.target.value],
                            ),
                          }))
                        }
                        className="mt-3 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-base leading-6 text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
                        placeholder={getAnswerPlaceholder(currentExercise, prompt)}
                        style={{
                          width: getAdaptiveInlineInputWidth(
                            getQuestionValues(
                              currentExercise,
                              answers[currentExercise.id] ?? [],
                              questionIndex,
                            )[0] ?? "",
                            getAnswerPlaceholder(currentExercise, prompt),
                          ),
                        }}
                      />
                      <SmartFeedback
                        value={normalizeTextEntryValue(
                          currentExercise,
                          getQuestionValues(
                            currentExercise,
                            answers[currentExercise.id] ?? [],
                            questionIndex,
                          )[0] ?? "",
                        )}
                        feedbackConfig={currentExercise.feedback_config}
                        fieldKey={`exercise-${currentExercise.id}-${questionIndex}`}
                        sectionKey="module_answer"
                      />
                    </label>
                  ))}
                  </div>
                ) : (
                  <div className="mt-4 border-l border-[#eadfca] pl-4">
                    <div className="flex flex-wrap items-center gap-3 text-[#20324a]">
                      <span className="font-[family:var(--font-cormorant)] text-[2rem] font-semibold leading-none text-[#20324a] sm:text-[2.35rem]">
                        {getPromptOpenLabel(currentExercise.question)}
                      </span>
                      <span className="text-[1.7rem] font-semibold leading-none text-[#355f9d]">
                        :
                      </span>
                      <ExerciseAiActions
                        exercise={currentExercise}
                        state={aiAssistStates[currentExercise.id] ?? initialAiAssistState}
                        onSuggest={() => void handleAiAssist(currentExercise, "suggest")}
                        onImprove={() => void handleAiAssist(currentExercise, "improve")}
                      />
                      <input
                        type="text"
                        value={answers[currentExercise.id]?.[0] ?? ""}
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [currentExercise.id]: [event.target.value],
                          }))
                        }
                        className="min-w-32 max-w-full flex-none rounded-[0.9rem] border border-[#eadfca] bg-[#fffaf4] px-4 py-3 text-base leading-6 text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
                        placeholder={getAnswerPlaceholder(
                          currentExercise,
                          getPromptOpenLabel(currentExercise.question),
                        )}
                        style={{
                          width: getAdaptiveInlineInputWidth(
                            answers[currentExercise.id]?.[0] ?? "",
                            getAnswerPlaceholder(
                              currentExercise,
                              getPromptOpenLabel(currentExercise.question),
                            ),
                          ),
                        }}
                      />
                    </div>
                    <SmartFeedback
                      value={normalizeTextEntryValue(
                        currentExercise,
                        answers[currentExercise.id]?.[0] ?? "",
                      )}
                      feedbackConfig={currentExercise.feedback_config}
                      fieldKey={`exercise-${currentExercise.id}`}
                      sectionKey="module_answer"
                    />
                  </div>
                )}
              </>
            ) : null}

            {currentExercise.type === "single" ? (
              currentQuestionPrompts.length > 0 ? (
                <div
                  className="mt-4 grid gap-4 md:[grid-template-columns:var(--question-columns)]"
                  style={{
                    ["--question-columns" as string]: `repeat(${getQuestionColumns(
                      currentExercise,
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {currentQuestionPrompts.map((prompt, questionIndex) => (
                    <div
                      key={`${currentExercise.id}-single-${questionIndex}`}
                      className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4"
                    >
                      <p className="text-sm font-semibold leading-7 text-[#5f544a]">
                        {prompt}
                      </p>
                      <div className="mt-3 space-y-3">
                        {currentExercise.options.map((option) => {
                          const questionValues = getQuestionValues(
                            currentExercise,
                            answers[currentExercise.id] ?? [],
                            questionIndex,
                          );
                          const isOtherOption = isOtherChoiceOption(option);
                          const isChecked = questionValues[0] === option;

                          return (
                            <div
                              key={`${questionIndex}-${option}`}
                              className="border-b border-[#f0e5d4] px-1 py-3"
                            >
                              <label className="flex items-start gap-3 text-sm leading-6 text-[#5f544a]">
                                <input
                                  type="radio"
                                  name={`visible-exercise-${currentExercise.id}-${questionIndex}`}
                                  value={option}
                                  checked={isChecked}
                                  onChange={() =>
                                    setAnswers((current) => ({
                                      ...current,
                                      [currentExercise.id]: setQuestionValues(
                                        currentExercise,
                                        current[currentExercise.id] ?? [],
                                        questionIndex,
                                        [option],
                                      ),
                                    }))
                                  }
                                  className="mt-1"
                                />
                                <span>{option}</span>
                              </label>
                              {isOtherOption && isChecked ? (
                                <input
                                  type="text"
                                  value={getOtherChoiceText(questionValues)}
                                  onChange={(event) =>
                                    setAnswers((current) => {
                                      const currentQuestionValues = getQuestionValues(
                                        currentExercise,
                                        current[currentExercise.id] ?? [],
                                        questionIndex,
                                      );

                                      return {
                                        ...current,
                                        [currentExercise.id]: setQuestionValues(
                                          currentExercise,
                                          current[currentExercise.id] ?? [],
                                          questionIndex,
                                          setOtherChoiceText(
                                            currentQuestionValues,
                                            option,
                                            event.target.value,
                                          ),
                                        ),
                                      };
                                    })
                                  }
                                  placeholder="Précise ta réponse"
                                  className="mt-3 w-full rounded-[0.75rem] border border-[#eadfca] bg-white px-4 py-3 text-sm text-[#3f3747] outline-none transition focus:border-[#d99f2b]"
                                />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {currentExercise.options.map((option) => {
                    const currentValues = answers[currentExercise.id] ?? [];
                    const isOtherOption = isOtherChoiceOption(option);
                    const isChecked = currentValues.includes(option);

                    return (
                      <div
                        key={option}
                        className="border-b border-[#f0e5d4] px-1 py-3"
                      >
                        <label className="flex items-start gap-3 text-sm leading-6 text-[#5f544a]">
                          <input
                            type="radio"
                            name={`visible-exercise-${currentExercise.id}`}
                            value={option}
                            checked={isChecked}
                            onChange={() =>
                              setAnswers((current) => ({
                                ...current,
                                [currentExercise.id]: [option],
                              }))
                            }
                            className="mt-1"
                          />
                          <span>{option}</span>
                        </label>
                        {isOtherOption && isChecked ? (
                          <input
                            type="text"
                            value={getOtherChoiceText(currentValues)}
                            onChange={(event) =>
                              setAnswers((current) => ({
                                ...current,
                                [currentExercise.id]: setOtherChoiceText(
                                  current[currentExercise.id] ?? [],
                                  option,
                                  event.target.value,
                                ),
                              }))
                            }
                            placeholder="Précise ta réponse"
                            className="mt-3 w-full rounded-[0.75rem] border border-[#eadfca] bg-white px-4 py-3 text-sm text-[#3f3747] outline-none transition focus:border-[#d99f2b]"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )
            ) : null}

            {currentExercise.type === "boolean" ? (
              currentQuestionPrompts.length > 0 ? (
                <div
                  className="mt-4 grid gap-4 md:[grid-template-columns:var(--question-columns)]"
                  style={{
                    ["--question-columns" as string]: `repeat(${getQuestionColumns(
                      currentExercise,
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {currentQuestionPrompts.map((prompt, questionIndex) => (
                    <div
                      key={`${currentExercise.id}-boolean-${questionIndex}`}
                      className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4"
                    >
                      <p className="text-sm font-semibold leading-7 text-[#5f544a]">
                        {prompt}
                      </p>
                      <div className="mt-3 grid gap-3">
                        {currentExercise.options.map((option) => (
                          <label
                            key={`${questionIndex}-${option}`}
                            className="flex items-center gap-3 border-b border-[#f0e5d4] px-1 py-3 text-sm font-semibold leading-6 text-[#5f544a]"
                          >
                            <input
                              type="radio"
                              name={`visible-exercise-${currentExercise.id}-${questionIndex}`}
                              value={option}
                              checked={
                                getQuestionValues(
                                  currentExercise,
                                  answers[currentExercise.id] ?? [],
                                  questionIndex,
                                )[0] === option
                              }
                              onChange={() =>
                                setAnswers((current) => ({
                                  ...current,
                                  [currentExercise.id]: setQuestionValues(
                                    currentExercise,
                                    current[currentExercise.id] ?? [],
                                    questionIndex,
                                    [option],
                                  ),
                                }))
                              }
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {currentExercise.options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 border-b border-[#f0e5d4] px-1 py-3 text-sm font-semibold leading-6 text-[#5f544a]"
                    >
                      <input
                        type="radio"
                        name={`visible-exercise-${currentExercise.id}`}
                        value={option}
                        checked={(answers[currentExercise.id] ?? []).includes(option)}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [currentExercise.id]: [option],
                          }))
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )
            ) : null}

            {currentExercise.type === "multiple" ? (
              currentQuestionPrompts.length > 0 ? (
                <div
                  className="mt-4 grid gap-4 md:[grid-template-columns:var(--question-columns)]"
                  style={{
                    ["--question-columns" as string]: `repeat(${getQuestionColumns(
                      currentExercise,
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {currentQuestionPrompts.map((prompt, questionIndex) => (
                    <div
                      key={`${currentExercise.id}-multiple-${questionIndex}`}
                      className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4"
                    >
                      <p className="text-sm font-semibold leading-7 text-[#5f544a]">
                        {prompt}
                      </p>
                      <div className="mt-3 space-y-3">
                        {currentExercise.options.map((option) => {
                          const questionValues = getQuestionValues(
                            currentExercise,
                            answers[currentExercise.id] ?? [],
                            questionIndex,
                          );
                          const isChecked = questionValues.includes(option);

                          const isOtherOption = isOtherChoiceOption(option);

                          return (
                            <div
                              key={`${questionIndex}-${option}`}
                              className="border-b border-[#f0e5d4] px-1 py-3"
                            >
                              <label className="flex items-start gap-3 text-sm leading-6 text-[#5f544a]">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(event) =>
                                    setAnswers((current) => {
                                      const currentValues = getQuestionValues(
                                        currentExercise,
                                        current[currentExercise.id] ?? [],
                                        questionIndex,
                                      );
                                      const nextValues = event.target.checked
                                        ? [...currentValues, option]
                                        : isOtherOption
                                          ? removeOtherChoiceValues(
                                              currentValues,
                                              option,
                                            )
                                          : currentValues.filter(
                                              (value) => value !== option,
                                            );

                                      return {
                                        ...current,
                                        [currentExercise.id]: setQuestionValues(
                                          currentExercise,
                                          current[currentExercise.id] ?? [],
                                          questionIndex,
                                          nextValues,
                                        ),
                                      };
                                    })
                                  }
                                  className="mt-1"
                                />
                                <span>{option}</span>
                              </label>
                              {isOtherOption && isChecked ? (
                                <input
                                  type="text"
                                  value={getOtherChoiceText(questionValues)}
                                  onChange={(event) =>
                                    setAnswers((current) => {
                                      const currentQuestionValues = getQuestionValues(
                                        currentExercise,
                                        current[currentExercise.id] ?? [],
                                        questionIndex,
                                      );

                                      return {
                                        ...current,
                                        [currentExercise.id]: setQuestionValues(
                                          currentExercise,
                                          current[currentExercise.id] ?? [],
                                          questionIndex,
                                          setOtherChoiceText(
                                            currentQuestionValues,
                                            option,
                                            event.target.value,
                                          ),
                                        ),
                                      };
                                    })
                                  }
                                  placeholder="Précise ta réponse"
                                  className="mt-3 w-full rounded-[0.75rem] border border-[#eadfca] bg-white px-4 py-3 text-sm text-[#3f3747] outline-none transition focus:border-[#d99f2b]"
                                />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {currentExercise.options.map((option) => {
                    const isChecked = (answers[currentExercise.id] ?? []).includes(option);

                    const isOtherOption = isOtherChoiceOption(option);

                    return (
                      <div
                        key={option}
                        className="border-b border-[#f0e5d4] px-1 py-3"
                      >
                        <label className="flex items-start gap-3 text-sm leading-6 text-[#5f544a]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(event) =>
                              setAnswers((current) => {
                                const currentValues = current[currentExercise.id] ?? [];

                                return {
                                  ...current,
                                  [currentExercise.id]: event.target.checked
                                    ? [...currentValues, option]
                                    : isOtherOption
                                      ? removeOtherChoiceValues(currentValues, option)
                                      : currentValues.filter(
                                          (value) => value !== option,
                                        ),
                                };
                              })
                            }
                            className="mt-1"
                          />
                          <span>{option}</span>
                        </label>
                        {isOtherOption && isChecked ? (
                          <input
                            type="text"
                            value={getOtherChoiceText(
                              answers[currentExercise.id] ?? [],
                            )}
                            onChange={(event) =>
                              setAnswers((current) => ({
                                ...current,
                                [currentExercise.id]: setOtherChoiceText(
                                  current[currentExercise.id] ?? [],
                                  option,
                                  event.target.value,
                                ),
                              }))
                            }
                            placeholder="Précise ta réponse"
                            className="mt-3 w-full rounded-[0.75rem] border border-[#eadfca] bg-white px-4 py-3 text-sm text-[#3f3747] outline-none transition focus:border-[#d99f2b]"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )
            ) : null}

            {!isMultiQuestionExerciseGroup && currentExercise.type === "checklist" ? (
              <>
                <ChecklistExerciseBlocks
                  exercise={currentExercise}
                  answers={answers[currentExercise.id] ?? []}
                  drafts={checklistDrafts}
                  setDrafts={setChecklistDrafts}
                  onChange={(nextValues) =>
                    setAnswers((current) => ({
                      ...current,
                      [currentExercise.id]: nextValues,
                    }))
                  }
                />
              </>
            ) : null}

            {currentExercise.type === "color" ? (
              currentQuestionPrompts.length > 0 ? (
                <div
                  className="mt-4 grid gap-4 md:[grid-template-columns:var(--question-columns)]"
                  style={{
                    ["--question-columns" as string]: `repeat(${getQuestionColumns(
                      currentExercise,
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {currentQuestionPrompts.map((prompt, questionIndex) => (
                    <div
                      key={`${currentExercise.id}-color-${questionIndex}`}
                      className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4"
                    >
                      <p className="text-sm font-semibold leading-7 text-[#5f544a]">
                        {prompt}
                      </p>
                      <div className="mt-3 grid gap-3">
                        {currentExercise.options.map((option) => {
                          const colorOption = parseColorOption(option);
                          const isChecked =
                            getQuestionValues(
                              currentExercise,
                              answers[currentExercise.id] ?? [],
                              questionIndex,
                            )[0] === option;

                          return (
                            <label
                              key={`${questionIndex}-${option}`}
                              className={`flex cursor-pointer items-center gap-4 rounded-[1rem] border px-4 py-3 text-sm leading-6 transition ${
                                isChecked
                                  ? "border-[#cf7430] bg-[#fff3e2] text-[#5f544a]"
                                  : "border-[#eadfca] bg-white text-[#5f544a]"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`visible-exercise-${currentExercise.id}-${questionIndex}`}
                                value={option}
                                checked={isChecked}
                                onChange={() =>
                                  setAnswers((current) => ({
                                    ...current,
                                    [currentExercise.id]: setQuestionValues(
                                      currentExercise,
                                      current[currentExercise.id] ?? [],
                                      questionIndex,
                                      [option],
                                    ),
                                  }))
                                }
                                className="sr-only"
                              />
                              <span
                                className="h-12 w-12 rounded-full border border-white shadow-[0_0_0_1px_rgba(75,69,80,0.16)]"
                                style={{ backgroundColor: colorOption.color }}
                              />
                              <span className="flex-1">
                                <span className="block font-semibold">{colorOption.label}</span>
                                <span className="block text-xs uppercase tracking-[0.14em] text-[#8a8077]">
                                  {colorOption.color}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {currentExercise.options.map((option) => {
                    const colorOption = parseColorOption(option);
                    const isChecked = (answers[currentExercise.id] ?? []).includes(option);

                    return (
                      <label
                        key={option}
                        className={`flex cursor-pointer items-center gap-4 rounded-[1rem] border px-4 py-3 text-sm leading-6 transition ${
                          isChecked
                            ? "border-[#cf7430] bg-[#fff3e2] text-[#5f544a]"
                            : "border-[#eadfca] bg-white text-[#5f544a]"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`visible-exercise-${currentExercise.id}`}
                          value={option}
                          checked={isChecked}
                          onChange={() =>
                            setAnswers((current) => ({
                              ...current,
                              [currentExercise.id]: [option],
                            }))
                          }
                          className="sr-only"
                        />
                        <span
                          className="h-12 w-12 rounded-full border border-white shadow-[0_0_0_1px_rgba(75,69,80,0.16)]"
                          style={{ backgroundColor: colorOption.color }}
                        />
                        <span className="flex-1">
                          <span className="block font-semibold">{colorOption.label}</span>
                          <span className="block text-xs uppercase tracking-[0.14em] text-[#8a8077]">
                            {colorOption.color}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )
            ) : null}

            {currentExercise.type === "image_upload" ? (
              <ImageUploadExercise
                module={module}
                exercise={currentExercise}
                answers={answers[currentExercise.id] ?? []}
                onChange={(nextValues) =>
                  setAnswers((current) => ({
                    ...current,
                    [currentExercise.id]: nextValues,
                  }))
                }
              />
            ) : null}

            {currentExercise.type === "moodboard" ? (
              <MoodboardExercise
                module={module}
                exercise={currentExercise}
                answers={answers[currentExercise.id] ?? []}
                allAnswers={answers}
                onChange={(nextValues) =>
                  setAnswers((current) => ({
                    ...current,
                    [currentExercise.id]: nextValues,
                  }))
                }
              />
            ) : null}

            {currentExercise.type === "editorial_calendar" ? (
              <EditorialCalendarExercise
                answers={answers[currentExercise.id] ?? []}
                onChange={(nextValues) =>
                  setAnswers((current) => ({
                    ...current,
                    [currentExercise.id]: nextValues,
                  }))
                }
              />
            ) : null}

            {currentExercise.type === "fill_blank" ? (
              <>
                {currentQuestionPrompts.length > 0 ? (
                  <div
                    className="mt-4 grid gap-4 md:[grid-template-columns:var(--question-columns)]"
                    style={{
                      ["--question-columns" as string]: `repeat(${getQuestionColumns(
                        currentExercise,
                      )}, minmax(0, 1fr))`,
                    }}
                  >
                  {currentQuestionPrompts.map((prompt, questionIndex) => (
                    <div
                      key={`${currentExercise.id}-fill-${questionIndex}`}
                      className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4 text-base leading-8 text-[#5f544a]"
                    >
                      <div className="flex items-start gap-3">
                        <p className="min-w-0 flex-1 text-sm font-semibold uppercase tracking-[0.12em] text-[#7a7087]">
                          Complete la phrase
                        </p>
                        <ExerciseAiActions
                          exercise={currentExercise}
                          state={aiAssistStates[currentExercise.id] ?? initialAiAssistState}
                          onSuggest={() => void handleAiAssist(currentExercise, "suggest")}
                          onImprove={() => void handleAiAssist(currentExercise, "improve")}
                        />
                      </div>
                    <div className="mt-4">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
                      {splitFillBlankText(prompt).map((part, index, parts) => (
                        <div key={`${questionIndex}-${index}`} className="contents">
                            {part ? <span>{part}</span> : null}
                            {index < parts.length - 1 ? (
                              <input
                                type="text"
                                value={
                                  getQuestionValues(
                                    currentExercise,
                                    answers[currentExercise.id] ?? [],
                                    questionIndex,
                                  )[index] ?? ""
                                }
                                onChange={(event) =>
                                  setAnswers((current) => {
                                    const currentValues = getQuestionValues(
                                      currentExercise,
                                      current[currentExercise.id] ?? [],
                                      questionIndex,
                                    );
                                    const nextValues =
                                      currentValues.length === getFillBlankCount(prompt)
                                        ? currentValues
                                        : Array.from(
                                            { length: getFillBlankCount(prompt) },
                                            (_, currentIndex) => currentValues[currentIndex] ?? "",
                                          );
                                    nextValues[index] = event.target.value;

                                    return {
                                      ...current,
                                      [currentExercise.id]: setQuestionValues(
                                        currentExercise,
                                        current[currentExercise.id] ?? [],
                                        questionIndex,
                                        nextValues,
                                      ),
                                    };
                                  })
                                }
                                className="min-w-28 max-w-full flex-none rounded-[0.8rem] border border-[#eadfca] bg-[#fffaf4] px-3 py-2 text-sm leading-6 text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
                                placeholder={getFillBlankAnswerPlaceholder(
                                  currentExercise,
                                  prompt,
                                  index,
                                )}
                                style={{
                                  width: getAdaptiveInlineInputWidth(
                                    getQuestionValues(
                                      currentExercise,
                                      answers[currentExercise.id] ?? [],
                                      questionIndex,
                                    )[index] ?? "",
                                    getFillBlankAnswerPlaceholder(
                                      currentExercise,
                                      prompt,
                                      index,
                                    ),
                                  ),
                                }}
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                  </div>
                ) : (
                  <div className="mt-4 border-l border-[#eadfca] pl-4 text-base leading-8 text-[#5f544a]">
                    <div className="flex items-start gap-3">
                      <p className="min-w-0 flex-1 text-sm font-semibold uppercase tracking-[0.12em] text-[#7a7087]">
                        Complete la phrase
                      </p>
                      <ExerciseAiActions
                        exercise={currentExercise}
                        state={aiAssistStates[currentExercise.id] ?? initialAiAssistState}
                        onSuggest={() => void handleAiAssist(currentExercise, "suggest")}
                        onImprove={() => void handleAiAssist(currentExercise, "improve")}
                      />
                    </div>
                    <div className="mt-4">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
                      {splitFillBlankText(currentExercise.question).map((part, index, parts) => (
                        <div key={`${currentExercise.id}-${index}`} className="contents">
                          {part ? <span>{part}</span> : null}
                          {index < parts.length - 1 ? (
                            <input
                              type="text"
                              value={answers[currentExercise.id]?.[index] ?? ""}
                              onChange={(event) =>
                                setAnswers((current) => {
                                  const currentValues =
                                    current[currentExercise.id] ??
                                    Array.from(
                                      { length: getFillBlankCount(currentExercise.question) },
                                      () => "",
                                    );
                                  const nextValues = [...currentValues];
                                  nextValues[index] = event.target.value;

                                  return {
                                    ...current,
                                    [currentExercise.id]: nextValues,
                                  };
                                })
                              }
                              className="min-w-28 max-w-full flex-none rounded-[0.8rem] border border-[#eadfca] bg-[#fffaf4] px-3 py-2 text-sm leading-6 text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
                              placeholder={getFillBlankAnswerPlaceholder(
                                currentExercise,
                                currentExercise.question,
                                index,
                              )}
                              style={{
                                width: getAdaptiveInlineInputWidth(
                                  answers[currentExercise.id]?.[index] ?? "",
                                  getFillBlankAnswerPlaceholder(
                                    currentExercise,
                                    currentExercise.question,
                                    index,
                                  ),
                                ),
                              }}
                            />
                          ) : null}
                        </div>
                      ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {currentExercise.type === "table" ? (
              <div className="mt-4 space-y-4">
                <ExerciseAiActions
                  exercise={currentExercise}
                  state={aiAssistStates[currentExercise.id] ?? initialAiAssistState}
                  onSuggest={() => void handleAiAssist(currentExercise, "suggest")}
                  onImprove={() => void handleAiAssist(currentExercise, "improve")}
                />
                {(() => {
                  const tableConfig = parseStoredTableConfig(currentExercise.options);
                  const rowLabels = Array.from(
                    { length: tableConfig.rows },
                    (_, rowIndex) => tableConfig.rowLabels[rowIndex] ?? "",
                  );
                  const columnLabels = Array.from(
                    { length: tableConfig.columns },
                    (_, columnIndex) => tableConfig.columnLabels[columnIndex] ?? "",
                  );

                  return (
                    <>
                      <div
                        className="grid gap-4 md:[grid-template-columns:var(--question-columns)]"
                        style={{
                          ["--question-columns" as string]: `repeat(${Math.max(
                            currentQuestionPrompts.length > 0
                              ? getQuestionColumns(currentExercise)
                              : 1,
                            1,
                          )}, minmax(0, 1fr))`,
                        }}
                      >
                        {(currentQuestionPrompts.length > 0
                          ? currentQuestionPrompts
                          : [""]
                        ).map((prompt, questionIndex) => {
                          const questionValues =
                            currentQuestionPrompts.length > 0
                              ? getQuestionValues(
                                  currentExercise,
                                  answers[currentExercise.id] ?? [],
                                  questionIndex,
                                )
                              : (answers[currentExercise.id] ?? []);

                          return (
                            <div key={`${currentExercise.id}-table-${questionIndex}`}>
                              {prompt ? (
                                <p className="mb-3 text-sm font-semibold leading-7 text-[#5f544a]">
                                  {prompt}
                                </p>
                              ) : null}
                              <div className="overflow-x-auto rounded-[1rem] border border-[#eadfca] bg-white">
                                <table className="min-w-full border-collapse">
                                  <thead>
                                    <tr className="bg-[#fff8f1]">
                                      <th className="border-b border-r border-[#eadfca] px-4 py-3 text-left text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">
                                        Lignes
                                      </th>
                                      {columnLabels.map((columnLabel, columnIndex) => (
                                        <th
                                          key={`${currentExercise.id}-${questionIndex}-column-${columnIndex}`}
                                          className="min-w-40 border-b border-[#eadfca] px-4 py-3 text-left text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]"
                                        >
                                          {columnLabel || `Colonne ${columnIndex + 1}`}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rowLabels.map((rowLabel, rowIndex) => (
                                      <tr
                                        key={`${currentExercise.id}-${questionIndex}-row-${rowIndex}`}
                                        className="align-top"
                                      >
                                        <th className="border-r border-t border-[#eadfca] bg-[#fffdf9] px-4 py-3 text-left text-sm font-semibold text-[#5f544a]">
                                          {rowLabel || `Ligne ${rowIndex + 1}`}
                                        </th>
                                        {Array.from(
                                          { length: tableConfig.columns },
                                          (_, columnIndex) => {
                                            const cellIndex =
                                              rowIndex * tableConfig.columns + columnIndex;

                                            return (
                                              <td
                                                key={`${currentExercise.id}-${questionIndex}-${rowIndex}-${columnIndex}`}
                                                className="border-t border-[#eadfca] px-3 py-3"
                                              >
                                                <input
                                                  type="text"
                                                  value={questionValues[cellIndex] ?? ""}
                                                  onChange={(event) =>
                                                    setAnswers((current) => {
                                                      const currentValues =
                                                        questionValues.length ===
                                                        getTableCellCount(tableConfig)
                                                          ? questionValues
                                                          : Array.from(
                                                              {
                                                                length: getTableCellCount(
                                                                  tableConfig,
                                                                ),
                                                              },
                                                              (_, currentIndex) =>
                                                                questionValues[currentIndex] ?? "",
                                                            );
                                                      const nextValues = [...currentValues];
                                                      nextValues[cellIndex] = event.target.value;

                                                      return {
                                                        ...current,
                                                        [currentExercise.id]:
                                                          currentQuestionPrompts.length > 0
                                                            ? setQuestionValues(
                                                                currentExercise,
                                                                current[currentExercise.id] ?? [],
                                                                questionIndex,
                                                                nextValues,
                                                              )
                                                            : nextValues,
                                                      };
                                                    })
                                                  }
                                                  className="h-11 w-full rounded-[0.8rem] border border-[#eadfca] bg-[#fffdf7] px-3 py-2 text-sm leading-6 text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
                                                  placeholder={getAnswerPlaceholder(
                                                    currentExercise,
                                                  )}
                                                />
                                              </td>
                                            );
                                          },
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-sm leading-6 text-[#8a8077]">
                        Complete chaque case du tableau pour valider cet exercice.
                      </p>
                    </>
                  );
                })()}
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-3 rounded-[1rem] border border-dashed border-[#eadfca] bg-white px-5 py-6 text-base leading-7 text-[#7b7068]">
            Aucun exercice n&apos;est encore disponible pour ce sous-module.
          </div>
        )}
      </div>

      {currentExercise?.type === "popup_message" && isPopupOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f2418]/48 px-4 py-6"
          onClick={() => setIsPopupOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <PopupMessageCard
              question={currentExercise.question}
              explanation={currentExercise.explanation}
              onClose={() => setIsPopupOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => void goToPreviousStep()}
          disabled={(currentIndex === 0 && isFirstSubmodule) || isSavingDraft || pending}
          className="flex h-12 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {currentIndex > 0 || isFirstSubmodule
            ? "Question precedente"
            : "Sous-module précédent"}
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {currentExercise && !isPassiveContentType(currentExercise.type) ? (
            currentExercise &&
            currentIndex === visibleExerciseGroups.length - 1 &&
            isLastSubmodule ? (
              <button
                type="button"
                disabled={pending || isSavingDraft}
                onClick={() => void goToNextStep()}
                className="flex h-12 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-wait disabled:opacity-70"
              >
                {isSavingDraft ? "Enregistrement..." : "Passer et revenir plus tard"}
              </button>
            ) : (
              <button
                type="button"
                disabled={pending || isSavingDraft}
                onClick={() => void goToNextStep()}
                className="flex h-12 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-wait disabled:opacity-70"
              >
                {isSavingDraft ? "Enregistrement..." : "Passer et revenir plus tard"}
              </button>
            )
          ) : null}

          {currentExercise && currentIndex < visibleExerciseGroups.length - 1 ? (
            <button
              type="button"
              disabled={pending || isSavingDraft}
              onClick={() => void goToNextStep()}
              className="flex h-12 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white disabled:cursor-wait disabled:opacity-70"
            >
              {isSavingDraft ? "Enregistrement..." : nextStepLabel}
            </button>
          ) : !isLastSubmodule ? (
            <button
              type="button"
              disabled={pending || isSavingDraft}
              onClick={() => void goToNextStep()}
              className="flex h-12 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white disabled:cursor-wait disabled:opacity-70"
            >
              {isSavingDraft ? "Enregistrement..." : nextStepLabel}
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending || isSavingDraft}
              onClick={() => {
                allowExplicitSubmitRef.current = true;
                submitModeRef.current = "complete";
              }}
              className="flex h-14 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white disabled:cursor-wait disabled:opacity-70"
            >
              {pending ? "Enregistrement..." : "Valider le module"}
            </button>
          )}
        </div>
      </div>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm leading-6 text-[#b45247]"
              : state.status === "success"
                ? "text-sm leading-6 text-[#5f8d63]"
                : "text-sm leading-6 text-[#7b7068]"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function MultiQuestionOpenExerciseGroup({
  questions,
  answers,
  aiAssistStates,
  onAiAssist,
  onChange,
}: {
  questions: ModuleExercise[];
  answers: AnswersByExercise;
  aiAssistStates: Record<number, AiAssistState>;
  onAiAssist: (exercise: ModuleExercise, mode: AiAssistMode) => Promise<void>;
  onChange: (exerciseId: number, nextValues: string[]) => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      {questions.map((question) => (
        <label
          key={question.id}
          className="block rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4"
        >
          {shouldShowExerciseExplanation(question) ? (
            <PedagogicalContent
              content={question.explanation}
              className="mb-4 rounded-[1rem] border border-[#eadfca] bg-[#fffaf2] px-4 py-4"
            />
          ) : null}
          <VoiceNotePlayer src={question.audio_url} />
          <span className="flex items-start gap-3">
            <span className="min-w-0 flex-1 text-sm font-semibold leading-7 text-[#5f544a]">
              {question.question}
            </span>
            {supportsExerciseAi(question) ? (
              <ExerciseAiActions
                exercise={question}
                state={aiAssistStates[question.id] ?? initialAiAssistState}
                onSuggest={() => void onAiAssist(question, "suggest")}
                onImprove={() => void onAiAssist(question, "improve")}
              />
            ) : null}
          </span>
          <textarea
            value={answers[question.id]?.[0] ?? ""}
            onChange={(event) => onChange(question.id, [event.target.value])}
            className="mt-3 min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-base text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
            placeholder={getAnswerPlaceholder(question)}
          />
          <SmartFeedback
            value={normalizeTextEntryValue(question, answers[question.id]?.[0] ?? "")}
            feedbackConfig={question.feedback_config}
            fieldKey={`exercise-${question.id}`}
            sectionKey="module_answer"
          />
        </label>
      ))}
    </div>
  );
}

function ImageUploadExercise({
  module,
  exercise,
  answers,
  onChange,
}: {
  module: WorkspaceModule;
  exercise: ModuleExercise;
  answers: string[];
  onChange: (nextValues: string[]) => void;
}) {
  const config = parseStoredImageUploadConfig(exercise.options);
  const imageUrls = getImageUploadValues(answers).slice(0, config.maxImages);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const remainingSlots = Math.max(config.maxImages - imageUrls.length, 0);

  useEffect(() => {
    setIsUploading(false);
    setMessage("");
  }, [exercise.id]);

  useEffect(() => {
    if (!isUploading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsUploading(false);
      setMessage("L'upload prend trop de temps. Réessaie avec moins d'images ou des fichiers plus légers.");
    }, IMAGE_UPLOAD_TIMEOUT_MS + 1000);

    return () => window.clearTimeout(timeoutId);
  }, [isUploading]);

  async function handleUpload(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    setMessage("Preparation des images...");

    try {
      const optimizedFiles = await Promise.all(
        selectedFiles.map((file) => optimizeImageForUpload(file)),
      );
      const formData = new FormData();
      formData.set("moduleId", String(module.id));
      formData.set("exerciseId", String(exercise.id));
      formData.set("currentCount", String(imageUrls.length));
      optimizedFiles.forEach((file) => formData.append("images", file));
      setMessage("Upload en cours...");

      const result = await Promise.race([
        uploadExerciseImages(formData),
        new Promise<Awaited<ReturnType<typeof uploadExerciseImages>>>((resolve) => {
          window.setTimeout(
            () =>
              resolve({
                status: "error",
                message:
                  "L'upload prend trop de temps. Réessaie avec moins d'images ou des fichiers plus légers.",
              }),
            IMAGE_UPLOAD_TIMEOUT_MS,
          );
        }),
      ]);

      if (result.status === "error") {
        setMessage(result.message);
        return;
      }

      onChange([...imageUrls, ...result.urls].slice(0, config.maxImages));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "L'upload a échoué. Réessaie avec une autre image.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-[1.4rem] border border-[#eadfca] bg-white px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
            Tableau d&apos;inspiration
          </p>
          <p className="mt-2 text-sm leading-7 text-[#6f645b]">
            Ajoute simplement les images demandees dans la question.
          </p>
        </div>
        <p className="rounded-full border border-[#eadfca] bg-[#fff8f1] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#7a7087]">
          {imageUrls.length}/{config.maxImages} images
        </p>
      </div>

      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[1rem] border border-dashed border-[#d9c4aa] bg-[#fffdf8] px-4 py-5 text-center transition hover:border-[#cf7430]">
        <span className="text-sm font-black uppercase tracking-[0.16em] text-[#6b625a]">
          {isUploading ? "Upload en cours..." : "Ajouter des images"}
        </span>
        <span className="mt-2 text-sm leading-6 text-[#8a8077]">
          {remainingSlots > 0
            ? `${remainingSlots} image${remainingSlots > 1 ? "s" : ""} restante${remainingSlots > 1 ? "s" : ""}`
            : "Limite atteinte"}
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={isUploading || remainingSlots <= 0}
          onChange={(event) => {
            void handleUpload(event.target.files);
            event.target.value = "";
          }}
          className="sr-only"
        />
      </label>

      {message ? (
        <p className="rounded-[1rem] border border-[#efc6bf] bg-[#fff4f1] px-4 py-3 text-sm leading-6 text-[#9d4e40]">
          {message}
        </p>
      ) : null}

      {imageUrls.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {imageUrls.map((imageUrl, index) => (
            <div
              key={`${imageUrl}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-[1rem] border border-[#eadfca] bg-[#fff8f1]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Inspiration ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(imageUrls.filter((_, itemIndex) => itemIndex !== index))}
                className="absolute right-2 top-2 rounded-full bg-white/95 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#b45247] opacity-0 shadow-[0_8px_18px_rgba(47,36,24,0.14)] transition group-hover:opacity-100"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ExerciseAiActions({
  exercise,
  state,
  onSuggest,
  onImprove,
}: {
  exercise: WorkspaceModule["exercises"][number];
  state: AiAssistState;
  onSuggest: () => void;
  onImprove: () => void;
}) {
  if (!supportsExerciseAi(exercise)) {
    return null;
  }

  const isLoading = state.status === "loading";

  return (
    <div className="relative shrink-0">
      <div className="group relative">
        <button
          type="button"
          disabled={isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#8a8077] shadow-[0_10px_24px_rgba(210,189,152,0.12)] transition hover:border-[#cf7430] hover:text-[#cf7430] focus:border-[#cf7430] focus:text-[#cf7430] focus:outline-none disabled:cursor-wait disabled:opacity-70"
          aria-label="Outils IA"
          title="Outils IA"
        >
          <SparklesIcon className="h-4 w-4" />
        </button>

        <div className="pointer-events-none absolute right-0 top-11 z-20 w-72 translate-y-1 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <div className="rounded-[1.1rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff6eb)] p-4 shadow-[0_18px_42px_rgba(120,92,56,0.14)]">
            <p className="text-sm leading-6 text-[#6f645b]">
              L&apos;IA peut proposer une réponse ou retravailler ton texte.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSuggest}
                disabled={isLoading}
                className="flex h-10 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-3 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-wait disabled:opacity-70"
              >
                {isLoading && state.mode === "suggest" ? "Génération..." : "Suggère"}
              </button>
              <button
                type="button"
                onClick={onImprove}
                disabled={isLoading}
                className="flex h-10 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-3 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-white disabled:cursor-wait disabled:opacity-70"
              >
                {isLoading && state.mode === "improve" ? "Relecture..." : "Ameliore"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {state.message ? (
        <p
          className={`mt-2 max-w-56 text-xs leading-5 ${
            state.status === "error" ? "text-[#b45247]" : "text-[#8a8077]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

function MultiQuestionChecklistExerciseGroup({
  questions,
  answers,
  drafts,
  setDrafts,
  onChange,
}: {
  questions: ModuleExercise[];
  answers: AnswersByExercise;
  drafts: Record<string, string>;
  setDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  onChange: (exerciseId: number, nextValues: string[]) => void;
}) {
  return (
    <div
      className="mt-4 grid gap-4 md:[grid-template-columns:var(--question-columns)]"
      style={{
        ["--question-columns" as string]: `repeat(${Math.max(
          questions.length,
          1,
        )}, minmax(0, 1fr))`,
      }}
    >
      {questions.map((question) => (
        <ChecklistExerciseBlocks
          key={question.id}
          exercise={question}
          answers={answers[question.id] ?? []}
          drafts={drafts}
          setDrafts={setDrafts}
          onChange={(nextValues) => onChange(question.id, nextValues)}
        />
      ))}
    </div>
  );
}

function ChecklistExerciseBlocks({
  exercise,
  answers,
  drafts,
  setDrafts,
  onChange,
}: {
  exercise: WorkspaceModule["exercises"][number];
  answers: string[];
  drafts: Record<string, string>;
  setDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  onChange: (nextValues: string[]) => void;
}) {
  const questionPrompts = getQuestionPrompts(exercise);
  const questionIndexes =
    questionPrompts.length > 0 ? questionPrompts.map((_, index) => index) : [0];

  return (
    <div
      className="mt-4 grid gap-4 md:[grid-template-columns:var(--question-columns)]"
      style={{
        ["--question-columns" as string]: `repeat(${getChecklistColumns(
          exercise,
        )}, minmax(0, 1fr))`,
      }}
    >
      {questionIndexes.map((questionIndex) => {
        const prompt = questionPrompts[questionIndex];
        const draftKey = `${exercise.id}-${questionIndex}`;
        const questionValues =
          questionPrompts.length > 0
            ? getQuestionValues(exercise, answers, questionIndex)
            : answers;
        const entries = parseChecklistEntries(questionValues);

        return (
          <div
            key={`${exercise.id}-checklist-${questionIndex}`}
            className="space-y-3 rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4"
          >
            {prompt ? (
              <p className="text-sm font-semibold leading-7 text-[#5f544a]">{prompt}</p>
            ) : null}
            {questionIndex === 0 ? <VoiceNotePlayer src={exercise.audio_url} /> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={drafts[draftKey] ?? ""}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [draftKey]: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return;
                  }

                  event.preventDefault();
                  const nextLabel = (drafts[draftKey] ?? "").trim();

                  if (!nextLabel) {
                    return;
                  }

                  const nextEntries = [...entries, { label: nextLabel, checked: false }];
                  onChange(
                    questionPrompts.length > 0
                      ? setQuestionValues(
                          exercise,
                          answers,
                          questionIndex,
                          serializeChecklistEntries(nextEntries),
                        )
                      : serializeChecklistEntries(nextEntries),
                  );
                  setDrafts((current) => ({ ...current, [draftKey]: "" }));
                }}
                className="h-12 flex-1 rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-base leading-6 text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
                placeholder={getAnswerPlaceholder(
                  exercise,
                  prompt,
                  "Ajouter un mot ou une idée",
                )}
              />
              <button
                type="button"
                onClick={() => {
                  const nextLabel = (drafts[draftKey] ?? "").trim();

                  if (!nextLabel) {
                    return;
                  }

                  const nextEntries = [...entries, { label: nextLabel, checked: false }];
                  onChange(
                    questionPrompts.length > 0
                      ? setQuestionValues(
                          exercise,
                          answers,
                          questionIndex,
                          serializeChecklistEntries(nextEntries),
                        )
                      : serializeChecklistEntries(nextEntries),
                  );
                  setDrafts((current) => ({ ...current, [draftKey]: "" }));
                }}
                className="flex h-12 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-[#fff8f1] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
              >
                Ajouter
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-[#eadfca] bg-white px-4 py-4 text-sm leading-6 text-[#8a8077]">
                Ajoute tes mots ci-dessus pour construire ta checklist.
              </div>
            ) : null}

            {entries.map((entry, entryIndex) => (
              <label
                key={`${questionIndex}-${entry.label}-${entryIndex}`}
                className={`flex cursor-pointer items-center gap-4 rounded-[1rem] border px-4 py-3 transition ${
                  entry.checked
                    ? "border-[#cf7430] bg-[#fff5e8]"
                    : "border-[#eadfca] bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={entry.checked}
                  onChange={(event) => {
                    const nextEntries = entries.map((currentEntry, currentEntryIndex) =>
                      currentEntryIndex === entryIndex
                        ? { ...currentEntry, checked: event.target.checked }
                        : currentEntry,
                    );
                    onChange(
                      questionPrompts.length > 0
                        ? setQuestionValues(
                            exercise,
                            answers,
                            questionIndex,
                            serializeChecklistEntries(nextEntries),
                          )
                        : serializeChecklistEntries(nextEntries),
                    );
                  }}
                  className="h-4 w-4 rounded border-[#d7c5ae] text-[#cf7430] focus:ring-[#f0cf55]"
                />
                <span
                  className={`text-sm leading-6 ${
                    entry.checked ? "font-semibold text-[#4b4550]" : "text-[#5f544a]"
                  }`}
                >
                  {entry.label}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextEntries = entries.filter(
                      (_, currentEntryIndex) => currentEntryIndex !== entryIndex,
                    );
                    onChange(
                      questionPrompts.length > 0
                        ? setQuestionValues(
                            exercise,
                            answers,
                            questionIndex,
                            serializeChecklistEntries(nextEntries),
                          )
                        : serializeChecklistEntries(nextEntries),
                    );
                  }}
                  className="ml-auto text-xs font-black uppercase tracking-[0.12em] text-[#b45247]"
                >
                  Supprimer
                </button>
              </label>
            ))}
          </div>
        );
      })}
    </div>
  );
}
