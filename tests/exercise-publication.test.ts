import { describe, expect, it } from "vitest";
import { getExercisePublicationContent } from "../lib/exercise-publication";
import { hydrateReleaseSnapshotModules } from "../lib/content-release-diff";
import { getPersistedExerciseType, resolveExerciseType, resolveStoredExerciseOptions, type ExerciseType } from "../lib/exercise-types";

describe("publication répétée des exercices", () => {
  it.each<ExerciseType>(["static_text", "popup_message", "prompt_open", "checklist", "table", "group_open", "boolean"])("décode le type historique %s dans un snapshot sans perdre son identité", (type) => {
    const stored = getExercisePublicationContent({ type, question: "Texte", options: type === "group_open" ? ["Mission", "Vision"] : [] });
    const hydrated = hydrateReleaseSnapshotModules([{ stableKey: "module_1", legacyId: 1, title: "Module", position: 1,
      submodules: [{ stableKey: "submodule_2", legacyId: 2, title: "Sous-module", position: 1, exercises: [
        { stableKey: "exercise_3", legacyId: 3, position: 1, type: getPersistedExerciseType(type), ...stored },
      ] }],
    }]);
    const exercise = hydrated[0].exercises[0];
    expect(exercise.type).toBe(type);
    expect(exercise.id).toBe(3);
    expect(exercise.question).toBe("Texte");
  });
  it.each<ExerciseType>(["static_text", "popup_message", "prompt_open", "checklist", "table", "group_open", "boolean"])("conserve le type %s après publication et relecture", (type) => {
    const original = { type, question: "Exercice de test", options: type === "group_open" ? ["Mission", "Vision"] : [] };
    let exercise = original;
    for (let index = 0; index < 3; index++) {
      const published = getExercisePublicationContent(exercise);
      const resolved = resolveExerciseType(getPersistedExerciseType(type), published.question, published.options);
      expect(resolved).toBe(type);
      exercise = { type: resolved, question: published.question, options: resolveStoredExerciseOptions(resolved, published.options) };
    }
    if (type === "group_open") expect(exercise.options).toEqual(["Mission", "Vision"]);
  });
});
