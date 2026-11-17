import type { ModuleExercise } from "./training-types";

// Add a free choice in the client form without rewriting published snapshots
// or changing the values of existing choices and saved answers.
export function withClientExerciseOptions(exercise: ModuleExercise): ModuleExercise {
  const isPersonalityWords = exercise.stableKey === "tyash_v1_question_74c06ecc-f30c-4f7e-bbdd-dff9f648d7e7"
    || exercise.stableKey === "template_question_1018";
  if (!isPersonalityWords || exercise.type !== "multiple" || exercise.options.includes("Autre")) return exercise;
  return { ...exercise, options: [...exercise.options, "Autre"] };
}
