import {
  getEditorExerciseQuestion,
  getPersistedExerciseQuestion,
  normalizeExerciseOptions,
  type ExerciseType,
} from "./exercise-types";

// Drafts can contain either stored questions or questions hydrated for display.
// Restore the storage markers exactly once before publishing them again.
export function getExercisePublicationContent(exercise: {
  type: ExerciseType;
  question: string;
  options: string[];
}) {
  return {
    question: getPersistedExerciseQuestion(
      exercise.type,
      getEditorExerciseQuestion(exercise.type, exercise.question),
    ),
    options: exercise.type === "group_open" || exercise.type === "boolean"
      ? normalizeExerciseOptions(exercise.type, exercise.options)
      : exercise.options,
  };
}
