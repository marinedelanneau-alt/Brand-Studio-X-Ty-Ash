import "server-only";
import seed from "../content/tyash-v1/pathway.json";
import { prepareIndependentPathway } from "./pathway-versions";
import { groupExercisesByGroupId } from "./exercise-groups";

// Import template only. Never read by the user-facing workspace. Once created,
// the draft snapshot and the existing Admin editor own the editable content.
export function prepareTyAshPathway(history: unknown[][]) {
  const modules = prepareIndependentPathway(structuredClone(seed), history);
  const counts = modules.map(m => groupExercisesByGroupId(m.exercises).length);
  if (modules.length !== 4 || modules.flatMap(m => m.submodules).length !== 15 || counts.join(",") !== "14,9,8,12") {
    throw new Error("Le modèle Ty Ash ne contient pas les 4 modules, 15 sous-modules et 43 exercices attendus.");
  }
  return modules;
}
