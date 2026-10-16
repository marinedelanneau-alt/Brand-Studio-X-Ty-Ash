import { parseIndexedAnswerItems, parseStoredExerciseQuestionConfig, parseStoredTableConfig, getTableCellCount, type ExerciseType } from "./exercise-types";

// Missing metadata preserves historical completion rules. Indexes are zero-based.
export type CompletionRequirements = {
  required?: boolean;
  optionalFields?: number[];
  optionalRows?: number[];
  optionalCells?: number[];
};

type Exercise = { type: ExerciseType; options: string[]; completion?: CompletionRequirements };

export function validateCompletionRequirements(exercise: Exercise) {
  const rules = exercise.completion;
  if (rules === undefined) return;
  if (!rules || typeof rules !== "object" || Array.isArray(rules) ||
      (rules.required !== undefined && typeof rules.required !== "boolean")) throw new Error("Invalid completion metadata.");
  const fields = parseStoredExerciseQuestionConfig(exercise.type, exercise.options).items.length;
  const table = parseStoredTableConfig(exercise.options);
  for (const [name, maximum] of [["optionalFields", fields], ["optionalRows", table.rows], ["optionalCells", getTableCellCount(table)]] as const) {
    const indexes = rules[name];
    if (indexes === undefined) continue;
    if ((name !== "optionalFields" && exercise.type !== "table") ||
        (name === "optionalFields" && !["group_open", "table"].includes(exercise.type)) ||
        !Array.isArray(indexes) || new Set(indexes).size !== indexes.length ||
        indexes.some(i => !Number.isInteger(i) || i < 0 || i >= maximum)) throw new Error("Invalid optional field indexes.");
  }
}

export function countsTowardsProgress(exercise: Exercise) {
  return exercise.completion?.required !== false;
}

// Undefined delegates to the existing type-specific rule on both client and server.
export function completionOverride(exercise: Exercise, values: string[]): boolean | undefined {
  const rules = exercise.completion;
  if (!rules) return undefined;
  if (rules.required === false) return true;
  const prompts = parseStoredExerciseQuestionConfig(exercise.type, exercise.options).items;
  const indexed = parseIndexedAnswerItems(values);
  if (exercise.type === "group_open" && rules.optionalFields) {
    return prompts.every((_, index) => rules.optionalFields!.includes(index) ||
      (indexed.length ? indexed.some(v => v.questionIndex === index && v.value.trim()) : !!values[index]?.trim()));
  }
  if (exercise.type === "table" && (rules.optionalRows || rules.optionalCells || rules.optionalFields)) {
    const config = parseStoredTableConfig(exercise.options);
    const completeCells = (cells: string[]) => Array.from({ length: getTableCellCount(config) }, (_, index) =>
      rules.optionalRows?.includes(Math.floor(index / config.columns)) || rules.optionalCells?.includes(index) || !!cells[index]?.trim(),
    ).every(Boolean);
    if (!prompts.length) return completeCells(values);
    return prompts.every((_, index) => rules.optionalFields?.includes(index) || completeCells(
      Array.from({ length: getTableCellCount(config) }, (_, cell) => indexed.find(v => v.questionIndex === index && v.valueIndex === cell)?.value ?? ""),
    ));
  }
  return undefined;
}
