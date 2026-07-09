import {
  getDefaultBrandPersonaConfig,
  getSerializedBrandPersonaOptions,
  isBrandPersonaOptions,
} from "@/lib/brand-persona";
import {
  getDefaultSpectrumConfig,
  getSerializedSpectrumOptions,
  isSpectrumOptions,
} from "@/lib/spectrum";
import {
  getDefaultColorPaletteConfig,
  getSerializedColorPaletteOptions,
  isColorPaletteOptions,
} from "@/lib/color-palette";
import {
  EDITORIAL_CALENDAR_CONFIG_PREFIX,
  getSerializedEditorialCalendarOptions,
  isEditorialCalendarOptions,
} from "@/lib/editorial-calendar";
import { isSmartFeedbackOption } from "@/lib/smart-feedback";

export type ExerciseType =
  | "static_text"
  | "popup_message"
  | "image_upload"
  | "open"
  | "single"
  | "multiple"
  | "checklist"
  | "table"
  | "boolean"
  | "color"
  | "fill_blank"
  | "prompt_open"
  | "group_open"
  | "brand_persona"
  | "spectrum"
  | "color_palette"
  | "editorial_calendar"
  | "moodboard";

const GROUP_OPEN_PREFIX = "__group_open__:";
const GROUP_OPEN_LAYOUT_PREFIX = "__group_open_layout__:";
const QUESTION_ITEM_PREFIX = "__question_item__:";
const QUESTION_COLUMNS_PREFIX = "__question_columns__:";
const CHECKLIST_QUESTION_PREFIX = "__checklist__:";
const CHECKLIST_ENTRY_PREFIX = "__checklist_entry__:";
const ANSWER_ITEM_PREFIX = "__answer_item__:";
const TABLE_QUESTION_PREFIX = "__table__:";
const TABLE_ROWS_PREFIX = "__table_rows__:";
const TABLE_COLUMNS_PREFIX = "__table_columns__:";
const TABLE_ROW_LABEL_PREFIX = "__table_row__:";
const TABLE_COLUMN_LABEL_PREFIX = "__table_column__:";
const TABLE_PLACEHOLDER_PREFIX = "__table_placeholder__:";
const PROMPT_OPEN_PREFIX = "__prompt_open__:";
const STATIC_TEXT_PREFIX = "__static_text__:";
const POPUP_MESSAGE_PREFIX = "__popup_message__:";
const IMAGE_UPLOAD_MAX_PREFIX = "__image_upload_max__:";
const EXPLANATION_PREFIX = "__explanation__:";
const ANSWER_PLACEHOLDER_PREFIX = "__answer_placeholder__:";
const EXERCISE_GROUP_ID_PREFIX = "__exercise_group_id__:";
const ANSWER_PLACEHOLDER_QUESTION_MARKER = `\n${ANSWER_PLACEHOLDER_PREFIX}`;
const DEFAULT_TABLE_ROWS = 3;
const DEFAULT_TABLE_COLUMNS = 3;
const DEFAULT_IMAGE_UPLOAD_MAX = 6;

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  static_text: "Texte seul",
  popup_message: "Pop-up inspiration",
  image_upload: "Tableau d'inspiration",
  open: "Reponse ouverte",
  single: "Choix unique",
  multiple: "Choix multiples",
  checklist: "Checklist à cocher",
  table: "Tableau à compléter",
  boolean: "Oui / Non",
  color: "Choix de couleur",
  fill_blank: "Phrase à compléter",
  prompt_open: "Conclusion à compléter",
  group_open: "Bloc de questions",
  brand_persona: "Persona de marque",
  spectrum: "Curseur spectrum",
  color_palette: "Palette de couleurs",
  editorial_calendar: "Calendrier éditorial",
  moodboard: "Moodboard",
};

const MOODBOARD_CONFIG_PREFIX = "__moodboard_config__:";
export type MoodboardConfig = {
  templateId: string;
  maxImages: number;
  maxTextBlocks: number;
  allowImageUpload: boolean;
  allowImageReplace: boolean;
  allowImageMove: boolean;
  allowTextEdit: boolean;
  allowColorEdit: boolean;
  allowExportPng: boolean;
  allowExportPdf: boolean;
};

const DEFAULT_MOODBOARD_CONFIG: MoodboardConfig = {
  templateId: "editorial_collage_01",
  maxImages: 6,
  maxTextBlocks: 3,
  allowImageUpload: true,
  allowImageReplace: true,
  allowImageMove: true,
  allowTextEdit: true,
  allowColorEdit: true,
  allowExportPng: true,
  allowExportPdf: true,
};

export function getDefaultMoodboardConfig() {
  return { ...DEFAULT_MOODBOARD_CONFIG };
}

export function getSerializedMoodboardOptions(config: MoodboardConfig) {
  return [`${MOODBOARD_CONFIG_PREFIX}${JSON.stringify(config)}`];
}

export function parseStoredMoodboardConfig(rawOptions: string[]) {
  const configOption = rawOptions.find((option) => option.startsWith(MOODBOARD_CONFIG_PREFIX));

  if (!configOption) {
    return getDefaultMoodboardConfig();
  }

  try {
    const parsed = JSON.parse(configOption.slice(MOODBOARD_CONFIG_PREFIX.length)) as Partial<MoodboardConfig>;

    return {
      ...DEFAULT_MOODBOARD_CONFIG,
      ...parsed,
    } satisfies MoodboardConfig;
  } catch {
    return getDefaultMoodboardConfig();
  }
}

export function exerciseNeedsOptions(type: ExerciseType) {
  return (
    type !== "static_text" &&
    type !== "popup_message" &&
    type !== "image_upload" &&
    type !== "editorial_calendar" &&
    type !== "moodboard" &&
    type !== "open" &&
    type !== "checklist" &&
    type !== "table" &&
    type !== "boolean" &&
    type !== "fill_blank" &&
    type !== "prompt_open" &&
    type !== "brand_persona" &&
    type !== "spectrum" &&
    type !== "color_palette"
  );
}

export function getExerciseDefaultOptions(type: ExerciseType) {
  if (type === "boolean") {
    return ["Oui", "Non"];
  }

  return [] as string[];
}

export function getExerciseDefaultOptionsText(type: ExerciseType) {
  return getExerciseDefaultOptions(type).join("\n");
}

export function normalizeExerciseOptions(type: ExerciseType, rawOptions: string[]) {
  const cleanedOptions = rawOptions.map((item) => item.trim()).filter(Boolean);

  if (type === "open") {
    return [] as string[];
  }

  if (type === "static_text") {
    return [] as string[];
  }

  if (type === "popup_message") {
    return [] as string[];
  }

  if (type === "image_upload") {
    return getSerializedImageUploadOptions(getDefaultImageUploadConfig());
  }

  if (type === "editorial_calendar") {
    return getSerializedEditorialCalendarOptions();
  }

  if (type === "moodboard") {
    return getSerializedMoodboardOptions(getDefaultMoodboardConfig());
  }

  if (type === "fill_blank") {
    return [] as string[];
  }

  if (type === "checklist") {
    return [] as string[];
  }

  if (type === "table") {
    return getSerializedTableOptions(parseStoredTableConfig(rawOptions));
  }

  if (type === "prompt_open") {
    return [] as string[];
  }

  if (type === "brand_persona") {
    return getSerializedBrandPersonaOptions(getDefaultBrandPersonaConfig());
  }

  if (type === "spectrum") {
    return getSerializedSpectrumOptions(getDefaultSpectrumConfig());
  }

  if (type === "color_palette") {
    return getSerializedColorPaletteOptions(getDefaultColorPaletteConfig());
  }

  if (type === "group_open") {
    return getSerializedGroupOpenOptions(cleanedOptions, getDefaultGroupOpenConfig());
  }

  if (type === "boolean") {
    return ["Oui", "Non"];
  }

  if (type === "color") {
    return cleanedOptions.map((option) => normalizeColorOption(option));
  }

  return cleanedOptions;
}

export function getPersistedExerciseType(type: ExerciseType) {
  if (type === "static_text") {
    return "open";
  }

  if (type === "popup_message") {
    return "open";
  }

  if (type === "image_upload") {
    return "multiple";
  }

  if (type === "editorial_calendar") {
    return "multiple";
  }

  if (type === "moodboard") {
    return "multiple";
  }

  if (type === "fill_blank") {
    return "open";
  }

  if (type === "prompt_open") {
    return "open";
  }

  if (type === "group_open") {
    return "multiple";
  }

  if (type === "checklist") {
    return "multiple";
  }

  if (type === "table") {
    return "multiple";
  }

  if (type === "brand_persona") {
    return "multiple";
  }

  if (type === "spectrum") {
    return "multiple";
  }

  if (type === "color_palette") {
    return "multiple";
  }

  return type;
}

export function resolveExerciseType(
  type: ExerciseType,
  question: string,
  options: string[] = [],
): ExerciseType {
  if (type === "open" && isStaticTextQuestion(question)) {
    return "static_text";
  }

  if (type === "open" && isPopupMessageQuestion(question)) {
    return "popup_message";
  }

  if (type === "open" && isPromptOpenQuestion(question)) {
    return "prompt_open";
  }

  if (type === "multiple" && isChecklistQuestion(question)) {
    return "checklist";
  }

  if (type === "multiple" && isTableQuestion(question)) {
    return "table";
  }

  if (type === "open" && getFillBlankCount(question) > 0) {
    return "fill_blank";
  }

  if (type === "multiple" && isGroupOpenOptions(options)) {
    return "group_open";
  }

  if (type === "multiple" && isChecklistOptions(options)) {
    return "checklist";
  }

  if (type === "multiple" && hasTableConfigOptions(options)) {
    return "table";
  }

  if (type === "multiple" && hasImageUploadConfigOptions(options)) {
    return "image_upload";
  }

  if (type === "multiple" && isEditorialCalendarOptions(options)) {
    return "editorial_calendar";
  }

  if (type === "multiple" && hasMoodboardConfigOptions(options)) {
    return "moodboard";
  }

  if (type === "multiple" && isBrandPersonaOptions(options)) {
    return "brand_persona";
  }

  if (type === "multiple" && isSpectrumOptions(options)) {
    return "spectrum";
  }

  if (type === "multiple" && isColorPaletteOptions(options)) {
    return "color_palette";
  }

  return type;
}

export function resolveStoredExerciseOptions(type: ExerciseType, rawOptions: string[]) {
  const sanitizedOptions = rawOptions.filter(
    (option) =>
      !option.startsWith(EXERCISE_GROUP_ID_PREFIX) &&
      !option.startsWith(ANSWER_PLACEHOLDER_PREFIX) &&
      !option.startsWith(EXPLANATION_PREFIX) &&
      !isSmartFeedbackOption(option) &&
      !option.startsWith(QUESTION_ITEM_PREFIX) &&
      !option.startsWith(QUESTION_COLUMNS_PREFIX),
  );

  if (type === "group_open") {
    return sanitizedOptions
      .filter(
        (option) =>
          option.startsWith(GROUP_OPEN_PREFIX) &&
          !option.startsWith(GROUP_OPEN_LAYOUT_PREFIX),
      )
      .map((option) => {
        let normalizedOption = option;

        while (normalizedOption.startsWith(GROUP_OPEN_PREFIX)) {
          normalizedOption = normalizedOption.slice(GROUP_OPEN_PREFIX.length).trim();
        }

        return normalizedOption;
      })
      .map((option) => option.trim())
      .filter(Boolean);
  }

  if (type === "checklist") {
    return [] as string[];
  }

  if (type === "table") {
    return sanitizedOptions.filter(
      (option) =>
        option.startsWith(TABLE_ROWS_PREFIX) ||
        option.startsWith(TABLE_COLUMNS_PREFIX) ||
        option.startsWith(TABLE_ROW_LABEL_PREFIX) ||
        option.startsWith(TABLE_COLUMN_LABEL_PREFIX),
    );
  }

  if (type === "image_upload") {
    return sanitizedOptions.filter((option) => option.startsWith(IMAGE_UPLOAD_MAX_PREFIX));
  }

  if (type === "editorial_calendar") {
    return sanitizedOptions.filter((option) =>
      option.startsWith(EDITORIAL_CALENDAR_CONFIG_PREFIX),
    );
  }

  if (type === "moodboard") {
    return sanitizedOptions.filter((option) => option.startsWith(MOODBOARD_CONFIG_PREFIX));
  }

  if (type === "brand_persona") {
    return sanitizedOptions.filter((option) => isBrandPersonaOptions([option]));
  }

  if (type === "spectrum") {
    return sanitizedOptions.filter((option) => isSpectrumOptions([option]));
  }

  if (type === "color_palette") {
    return sanitizedOptions.filter((option) => isColorPaletteOptions([option]));
  }

  return sanitizedOptions;
}

export function getPersistedExerciseQuestion(type: ExerciseType, question: string) {
  const normalizedQuestion = stripStoredAnswerPlaceholderFromQuestion(question).trim();

  if (type === "static_text") {
    return `${STATIC_TEXT_PREFIX}${normalizedQuestion}`;
  }

  if (type === "popup_message") {
    return `${POPUP_MESSAGE_PREFIX}${normalizedQuestion}`;
  }

  if (type === "prompt_open") {
    return `${PROMPT_OPEN_PREFIX}${normalizedQuestion}`;
  }

  if (type === "checklist") {
    return `${CHECKLIST_QUESTION_PREFIX}${normalizedQuestion}`;
  }

  if (type === "table") {
    return `${TABLE_QUESTION_PREFIX}${normalizedQuestion}`;
  }

  return normalizedQuestion;
}

export function getEditorExerciseQuestion(type: ExerciseType, question: string) {
  const questionWithoutPlaceholder = stripStoredAnswerPlaceholderFromQuestion(question);

  if (type === "static_text" && isStaticTextQuestion(question)) {
    return questionWithoutPlaceholder.slice(STATIC_TEXT_PREFIX.length).trim();
  }

  if (type === "popup_message" && isPopupMessageQuestion(question)) {
    return questionWithoutPlaceholder.slice(POPUP_MESSAGE_PREFIX.length).trim();
  }

  if (type === "prompt_open" && isPromptOpenQuestion(question)) {
    return questionWithoutPlaceholder.slice(PROMPT_OPEN_PREFIX.length).trim();
  }

  if (type === "checklist" && isChecklistQuestion(question)) {
    return questionWithoutPlaceholder.slice(CHECKLIST_QUESTION_PREFIX.length).trim();
  }

  if (type === "table" && isTableQuestion(question)) {
    return questionWithoutPlaceholder.slice(TABLE_QUESTION_PREFIX.length).trim();
  }

  return stripStoredExerciseQuestionPrefix(questionWithoutPlaceholder).trim();
}

export function getPromptOpenLabel(question: string) {
  return getEditorExerciseQuestion("prompt_open", question);
}

export function getStoredAnswerPlaceholder(rawOptions: string[]) {
  const placeholderOption = rawOptions.find((option) =>
    option.startsWith(ANSWER_PLACEHOLDER_PREFIX),
  );

  return placeholderOption
    ? placeholderOption.slice(ANSWER_PLACEHOLDER_PREFIX.length).trim()
    : "";
}

export function getAnswerPlaceholderItems(
  answerPlaceholder: string | null | undefined,
  count: number,
) {
  const normalizedCount = Math.max(count, 0);
  const values = String(answerPlaceholder ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim());

  return Array.from(
    { length: normalizedCount },
    (_, index) => values[index] ?? "",
  );
}

export function getStoredExplanation(rawOptions: string[]) {
  const explanationOption = rawOptions.find((option) =>
    option.startsWith(EXPLANATION_PREFIX),
  );

  return explanationOption
    ? explanationOption.slice(EXPLANATION_PREFIX.length).trim()
    : "";
}

export function getStoredAnswerPlaceholderFromQuestion(question: string) {
  const markerIndex = question.lastIndexOf(ANSWER_PLACEHOLDER_QUESTION_MARKER);

  if (markerIndex === -1) {
    return "";
  }

  return question
    .slice(markerIndex + ANSWER_PLACEHOLDER_QUESTION_MARKER.length)
    .trim();
}

export function appendAnswerPlaceholderToQuestion(
  question: string,
  answerPlaceholder: string,
) {
  const normalizedQuestion = stripStoredAnswerPlaceholderFromQuestion(question).trim();
  const normalizedPlaceholder = answerPlaceholder.trim();

  if (!normalizedPlaceholder) {
    return normalizedQuestion;
  }

  return `${normalizedQuestion}${ANSWER_PLACEHOLDER_QUESTION_MARKER}${normalizedPlaceholder}`;
}

export function appendAnswerPlaceholderOption(
  options: string[],
  answerPlaceholder: string,
) {
  const normalizedPlaceholder = answerPlaceholder.trim();

  if (!normalizedPlaceholder) {
    return options.filter((option) => !option.startsWith(ANSWER_PLACEHOLDER_PREFIX));
  }

  return [
    ...options.filter((option) => !option.startsWith(ANSWER_PLACEHOLDER_PREFIX)),
    `${ANSWER_PLACEHOLDER_PREFIX}${normalizedPlaceholder}`,
  ];
}

export function appendExplanationOption(options: string[], explanation: string) {
  const normalizedExplanation = explanation.trim();
  const filteredOptions = options.filter(
    (option) => !option.startsWith(EXPLANATION_PREFIX),
  );

  if (!normalizedExplanation) {
    return filteredOptions;
  }

  return [...filteredOptions, `${EXPLANATION_PREFIX}${normalizedExplanation}`];
}

export function getStoredExerciseGroupId(rawOptions: string[]) {
  const groupIdOption = rawOptions.find((option) =>
    option.startsWith(EXERCISE_GROUP_ID_PREFIX),
  );

  return groupIdOption
    ? groupIdOption.slice(EXERCISE_GROUP_ID_PREFIX.length).trim()
    : "";
}

export function appendExerciseGroupIdOption(options: string[], groupId: string) {
  const normalizedGroupId = groupId.trim();
  const filteredOptions = options.filter(
    (option) => !option.startsWith(EXERCISE_GROUP_ID_PREFIX),
  );

  if (!normalizedGroupId) {
    return filteredOptions;
  }

  return [...filteredOptions, `${EXERCISE_GROUP_ID_PREFIX}${normalizedGroupId}`];
}

function stripStoredAnswerPlaceholderFromQuestion(question: string) {
  const markerIndex = question.lastIndexOf(ANSWER_PLACEHOLDER_QUESTION_MARKER);

  if (markerIndex === -1) {
    return question.trim();
  }

  return question.slice(0, markerIndex).trim();
}

export function isAnswerableExerciseType(type: ExerciseType) {
  return type !== "static_text" && type !== "popup_message";
}

export type ChecklistEntry = {
  label: string;
  checked: boolean;
};

export function serializeChecklistEntries(entries: ChecklistEntry[]) {
  return entries
    .map((entry) => ({
      label: entry.label.trim(),
      checked: entry.checked,
    }))
    .filter((entry) => entry.label.length > 0)
    .map((entry) => `${CHECKLIST_ENTRY_PREFIX}${entry.checked ? "1" : "0"}:${entry.label}`);
}

export function parseChecklistEntries(values: string[]) {
  return values
    .filter((value) => value.startsWith(CHECKLIST_ENTRY_PREFIX))
    .map((value) => value.slice(CHECKLIST_ENTRY_PREFIX.length))
    .map((value) => {
      const separatorIndex = value.indexOf(":");
      const checkedFlag = separatorIndex === -1 ? "0" : value.slice(0, separatorIndex);
      const label = separatorIndex === -1 ? value : value.slice(separatorIndex + 1);

      return {
        label: label.trim(),
        checked: checkedFlag === "1",
      } satisfies ChecklistEntry;
    })
    .filter((entry) => entry.label.length > 0);
}

export function getEditorOptionsText(type: ExerciseType, rawOptions: string[]) {
  if (
    type === "table" ||
    type === "image_upload" ||
    type === "editorial_calendar" ||
    type === "moodboard"
  ) {
    return "";
  }

  if (type === "brand_persona") {
    return "";
  }

  if (type === "spectrum") {
    return "";
  }

  if (type === "color_palette") {
    return "";
  }

  return resolveStoredExerciseOptions(type, rawOptions).join("\n");
}

export type TableConfig = {
  rows: number;
  columns: number;
  rowLabels: string[];
  columnLabels: string[];
};

export type GroupOpenConfig = {
  columns: number;
};

export type ImageUploadConfig = {
  maxImages: number;
};

export type ExerciseQuestionConfig = {
  items: string[];
  columns: number;
};

export type IndexedAnswerItem = {
  questionIndex: number;
  valueIndex: number;
  value: string;
};

export function getDefaultGroupOpenConfig(): GroupOpenConfig {
  return {
    columns: 1,
  };
}

export function getDefaultImageUploadConfig(): ImageUploadConfig {
  return {
    maxImages: DEFAULT_IMAGE_UPLOAD_MAX,
  };
}

export function getDefaultExerciseQuestionConfig(): ExerciseQuestionConfig {
  return {
    items: [],
    columns: 1,
  };
}

export function parseStoredGroupOpenConfig(rawOptions: string[]): GroupOpenConfig {
  const layoutOption = rawOptions.find((option) =>
    option.startsWith(GROUP_OPEN_LAYOUT_PREFIX),
  );
  const columnsValue = layoutOption?.slice(GROUP_OPEN_LAYOUT_PREFIX.length).trim() ?? "";

  return {
    columns: normalizePositiveInteger(columnsValue, 1),
  };
}

export function getSerializedGroupOpenOptions(
  questions: string[],
  config: GroupOpenConfig,
) {
  const normalizedQuestions = questions
    .map((option) => {
      let normalizedOption = option.trim();

      while (normalizedOption.startsWith(GROUP_OPEN_PREFIX)) {
        normalizedOption = normalizedOption.slice(GROUP_OPEN_PREFIX.length).trim();
      }

      return normalizedOption;
    })
    .filter(Boolean)
    .map((option) => `${GROUP_OPEN_PREFIX}${option}`);

  return [
    `${GROUP_OPEN_LAYOUT_PREFIX}${normalizePositiveInteger(config.columns, 1)}`,
    ...normalizedQuestions,
  ];
}

export function getSerializedExerciseQuestionOptions(config: ExerciseQuestionConfig) {
  const normalizedItems = config.items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `${QUESTION_ITEM_PREFIX}${item}`);

  if (normalizedItems.length === 0) {
    return [] as string[];
  }

  return [
    `${QUESTION_COLUMNS_PREFIX}${normalizePositiveInteger(config.columns, 1)}`,
    ...normalizedItems,
  ];
}

export function parseStoredImageUploadConfig(rawOptions: string[]): ImageUploadConfig {
  return {
    maxImages: getPositiveIntegerFromOption(
      rawOptions,
      IMAGE_UPLOAD_MAX_PREFIX,
      DEFAULT_IMAGE_UPLOAD_MAX,
    ),
  };
}

export function getSerializedImageUploadOptions(config: ImageUploadConfig) {
  return [
    `${IMAGE_UPLOAD_MAX_PREFIX}${normalizePositiveInteger(
      config.maxImages,
      DEFAULT_IMAGE_UPLOAD_MAX,
    )}`,
  ];
}

export function parseStoredExerciseQuestionConfig(
  type: ExerciseType,
  rawOptions: string[],
) {
  const items = rawOptions
    .filter((option) => option.startsWith(QUESTION_ITEM_PREFIX))
    .map((option) => option.slice(QUESTION_ITEM_PREFIX.length).trim())
    .filter(Boolean);

  if (items.length > 0) {
    return {
      items,
      columns: getPositiveIntegerFromOption(rawOptions, QUESTION_COLUMNS_PREFIX, 1),
    } satisfies ExerciseQuestionConfig;
  }

  if (type === "group_open") {
    return {
      items: resolveStoredExerciseOptions(type, rawOptions),
      columns: parseStoredGroupOpenConfig(rawOptions).columns,
    } satisfies ExerciseQuestionConfig;
  }

  return getDefaultExerciseQuestionConfig();
}

export function serializeIndexedAnswerItem(
  questionIndex: number,
  valueIndex: number,
  value: string,
) {
  return `${ANSWER_ITEM_PREFIX}${questionIndex}:${valueIndex}:${encodeURIComponent(value)}`;
}

export function parseIndexedAnswerItems(values: string[]) {
  return values
    .filter((value) => value.startsWith(ANSWER_ITEM_PREFIX))
    .map((value) => value.slice(ANSWER_ITEM_PREFIX.length))
    .map((value) => {
      const firstSeparator = value.indexOf(":");
      const secondSeparator = value.indexOf(":", firstSeparator + 1);

      if (firstSeparator === -1 || secondSeparator === -1) {
        return null;
      }

      const questionIndex = Number.parseInt(value.slice(0, firstSeparator), 10);
      const valueIndex = Number.parseInt(
        value.slice(firstSeparator + 1, secondSeparator),
        10,
      );

      if (!Number.isFinite(questionIndex) || !Number.isFinite(valueIndex)) {
        return null;
      }

      return {
        questionIndex,
        valueIndex,
        value: decodeURIComponent(value.slice(secondSeparator + 1)),
      } satisfies IndexedAnswerItem;
    })
    .filter((item): item is IndexedAnswerItem => item !== null);
}

export function getDefaultTableConfig(): TableConfig {
  return {
    rows: DEFAULT_TABLE_ROWS,
    columns: DEFAULT_TABLE_COLUMNS,
    rowLabels: Array.from({ length: DEFAULT_TABLE_ROWS }, () => ""),
    columnLabels: Array.from({ length: DEFAULT_TABLE_COLUMNS }, () => ""),
  };
}

export function parseStoredTableConfig(rawOptions: string[]): TableConfig {
  const rows = getPositiveIntegerFromOption(rawOptions, TABLE_ROWS_PREFIX, DEFAULT_TABLE_ROWS);
  const columns = getPositiveIntegerFromOption(
    rawOptions,
    TABLE_COLUMNS_PREFIX,
    DEFAULT_TABLE_COLUMNS,
  );
  const storedLabels = rawOptions
    .filter((option) => option.startsWith(TABLE_ROW_LABEL_PREFIX))
    .map((option) => option.slice(TABLE_ROW_LABEL_PREFIX.length).trim());
  const storedColumnLabels = rawOptions
    .filter((option) => option.startsWith(TABLE_COLUMN_LABEL_PREFIX))
    .map((option) => option.slice(TABLE_COLUMN_LABEL_PREFIX.length).trim());

  return {
    rows,
    columns,
    rowLabels: Array.from({ length: rows }, (_, index) => storedLabels[index] ?? ""),
    columnLabels: Array.from(
      { length: columns },
      (_, index) => storedColumnLabels[index] ?? "",
    ),
  };
}

export function getSerializedTableOptions(config: TableConfig) {
  const rows = normalizePositiveInteger(config.rows, DEFAULT_TABLE_ROWS);
  const columns = normalizePositiveInteger(config.columns, DEFAULT_TABLE_COLUMNS);
  const rowLabels = Array.from({ length: rows }, (_, index) => config.rowLabels[index]?.trim() ?? "");
  const columnLabels = Array.from(
    { length: columns },
    (_, index) => config.columnLabels[index]?.trim() ?? "",
  );

  return [
    `${TABLE_ROWS_PREFIX}${rows}`,
    `${TABLE_COLUMNS_PREFIX}${columns}`,
    ...rowLabels.map((label) => `${TABLE_ROW_LABEL_PREFIX}${label}`),
    ...columnLabels.map((label) => `${TABLE_COLUMN_LABEL_PREFIX}${label}`),
  ];
}

export function getTableCellCount(config: TableConfig) {
  return config.rows * config.columns;
}

export function parseStoredTablePlaceholders(
  rawOptions: string[],
  count: number,
  fallbackPlaceholder = "",
) {
  const normalizedCount = Math.max(count, 0);
  const storedPlaceholders = rawOptions
    .filter((option) => option.startsWith(TABLE_PLACEHOLDER_PREFIX))
    .map((option) => option.slice(TABLE_PLACEHOLDER_PREFIX.length).trim());

  if (storedPlaceholders.length > 0) {
    return Array.from(
      { length: normalizedCount },
      (_, index) => storedPlaceholders[index] ?? "",
    );
  }

  return getAnswerPlaceholderItems(fallbackPlaceholder, normalizedCount);
}

export function getSerializedTablePlaceholderOptions(
  placeholders: string[],
  count: number,
) {
  return Array.from(
    { length: Math.max(count, 0) },
    (_, index) => placeholders[index]?.trim() ?? "",
  )
    .map((placeholder) => `${TABLE_PLACEHOLDER_PREFIX}${placeholder}`)
    .filter((option) => option.slice(TABLE_PLACEHOLDER_PREFIX.length).trim());
}

export function getFillBlankCount(text: string) {
  const matches = text.match(/_{3,}/g);
  return matches?.length ?? 0;
}

export function splitFillBlankText(text: string) {
  return text.split(/_{3,}/g);
}

export function parseColorOption(option: string) {
  const [rawLabel, rawColor] = option.split("|");
  const label = rawLabel?.trim() ?? "";
  const color = normalizeHexColor(rawColor?.trim() || generateColorFromLabel(label));

  return {
    label: label || color,
    color,
    value: `${label || color}|${color}`,
  };
}

function isGroupOpenOptions(options: string[]) {
  const questionOptions = options.filter(
    (option) =>
      option.startsWith(GROUP_OPEN_PREFIX) &&
      !option.startsWith(GROUP_OPEN_LAYOUT_PREFIX),
  );

  return (
    questionOptions.length > 0 &&
    questionOptions.every((option) => option.startsWith(GROUP_OPEN_PREFIX))
  );
}

function isChecklistOptions(options: string[]) {
  return options.length > 0 && options.every((option) => option.startsWith(CHECKLIST_ENTRY_PREFIX));
}

function isPromptOpenQuestion(question: string) {
  return question.startsWith(PROMPT_OPEN_PREFIX);
}

function isTableQuestion(question: string) {
  return question.startsWith(TABLE_QUESTION_PREFIX);
}

function isChecklistQuestion(question: string) {
  return question.startsWith(CHECKLIST_QUESTION_PREFIX);
}

function isStaticTextQuestion(question: string) {
  return question.startsWith(STATIC_TEXT_PREFIX);
}

function isPopupMessageQuestion(question: string) {
  return question.startsWith(POPUP_MESSAGE_PREFIX);
}

function stripStoredExerciseQuestionPrefix(question: string) {
  const storedPrefixes = [
    STATIC_TEXT_PREFIX,
    POPUP_MESSAGE_PREFIX,
    PROMPT_OPEN_PREFIX,
    CHECKLIST_QUESTION_PREFIX,
    TABLE_QUESTION_PREFIX,
  ];
  const prefix = storedPrefixes.find((storedPrefix) => question.startsWith(storedPrefix));

  return prefix ? question.slice(prefix.length) : question;
}

function hasTableConfigOptions(options: string[]) {
  return (
    options.some((option) => option.startsWith(TABLE_ROWS_PREFIX)) &&
    options.some((option) => option.startsWith(TABLE_COLUMNS_PREFIX))
  );
}

function hasImageUploadConfigOptions(options: string[]) {
  return options.some((option) => option.startsWith(IMAGE_UPLOAD_MAX_PREFIX));
}

function hasMoodboardConfigOptions(options: string[]) {
  return options.some((option) => option.startsWith(MOODBOARD_CONFIG_PREFIX));
}

function getPositiveIntegerFromOption(
  options: string[],
  prefix: string,
  fallback: number,
) {
  const option = options.find((item) => item.startsWith(prefix));

  if (!option) {
    return fallback;
  }

  return normalizePositiveInteger(option.slice(prefix.length), fallback);
}

function normalizePositiveInteger(value: string | number, fallback: number) {
  const numericValue =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }

  return Math.max(1, Math.floor(numericValue));
}

function normalizeColorOption(option: string) {
  const parsed = parseColorOption(option);
  return parsed.value;
}

function normalizeHexColor(input: string) {
  const value = input.trim();
  const hex = value.startsWith("#") ? value.slice(1) : value;

  if (/^[0-9a-fA-F]{3}$/.test(hex) || /^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toUpperCase()}`;
  }

  return generateColorFromLabel(value);
}

function generateColorFromLabel(label: string) {
  const seed = label.trim().toLowerCase() || "couleur";
  let hash = 0;

  for (const character of seed) {
    hash = character.charCodeAt(0) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 65, 58);
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = c;
    green = x;
  } else if (hue < 120) {
    red = x;
    green = c;
  } else if (hue < 180) {
    green = c;
    blue = x;
  } else if (hue < 240) {
    green = x;
    blue = c;
  } else if (hue < 300) {
    red = x;
    blue = c;
  } else {
    red = c;
    blue = x;
  }

  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}
