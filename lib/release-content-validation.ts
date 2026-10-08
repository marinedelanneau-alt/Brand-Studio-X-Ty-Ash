import { hydrateReleaseSnapshotModules } from "./content-release-diff";
import { getFillBlankCount, parseStoredExerciseQuestionConfig, parseStoredTableConfig, type ExerciseType } from "./exercise-types";

type Entity = { id: number; stableKey?: string; position: number };
type Exercise = Entity & { type: ExerciseType; question: string; options: string[]; module_id: number; submodule_id: number };
type Submodule = Entity & { title: string; content_html: string; exercises: Exercise[] };
type Module = Entity & { title: string; submodules: Submodule[]; exercises: Exercise[] };
const supportedTypes = new Set<ExerciseType>([
  "static_text", "popup_message", "image_upload", "open", "single", "multiple", "checklist", "table",
  "boolean", "color", "fill_blank", "prompt_open", "group_open", "brand_persona", "spectrum",
  "color_palette", "typography", "editorial_calendar", "moodboard",
]);

export function validateReleaseModules(value: unknown): Module[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Release invalide : le snapshot doit contenir des modules.");
  }
  function checkStoredIdentity(entity: Record<string, unknown>) {
    const id = entity.id ?? entity.legacyId;
    if (!(typeof entity.stableKey === "string" && entity.stableKey.trim()) &&
        !(typeof id === "number" && Number.isSafeInteger(id) && id !== 0)) {
      throw new Error("Release invalide : identité stable absente du snapshot.");
    }
  }
  for (const moduleItem of value) {
    if (!moduleItem || typeof moduleItem !== "object" || !Array.isArray(moduleItem.submodules)) {
      throw new Error("Release invalide : structure des modules absente.");
    }
    checkStoredIdentity(moduleItem);
    for (const submodule of moduleItem.submodules) {
      if (!submodule || typeof submodule !== "object" || !Array.isArray(submodule.exercises)) {
        throw new Error("Release invalide : structure des sous-modules absente.");
      }
      checkStoredIdentity(submodule);
      for (const exercise of submodule.exercises) {
        if (!exercise || typeof exercise !== "object") throw new Error("Release invalide : question absente.");
        checkStoredIdentity(exercise);
      }
    }
  }
  const modules = hydrateReleaseSnapshotModules(value) as unknown as Module[];
  const ids = new Set<string>();
  const keys = new Set<string>();
  function checkPositions(items: Entity[]) {
    if (new Set(items.map((item) => item.position)).size !== items.length) {
      throw new Error("Release invalide : positions dupliquées.");
    }
  }
  function check(entity: Entity, namespace: string) {
    const id = `${namespace}:${entity.id}`;
    const key = `${namespace}:${entity.stableKey}`;
    if (!Number.isSafeInteger(entity.id) || entity.id === 0 || ids.has(id) ||
        !entity.stableKey || keys.has(key) || !Number.isInteger(entity.position) || entity.position < 1) {
      throw new Error("Release invalide : identifiant ou position absent/dupliqué.");
    }
    ids.add(id);
    keys.add(key);
  }
  checkPositions(modules);
  for (const moduleItem of modules) {
    check(moduleItem, "module");
    if (typeof moduleItem.title !== "string" || !moduleItem.title.trim() || moduleItem.submodules.length === 0) {
      throw new Error("Release invalide : titre ou sous-module absent.");
    }
    checkPositions(moduleItem.submodules);
    checkPositions(moduleItem.exercises);
    for (const submodule of moduleItem.submodules) {
      check(submodule, "submodule");
      if (typeof submodule.title !== "string" || !submodule.title.trim() || typeof submodule.content_html !== "string") {
        throw new Error("Release invalide : contenu du sous-module absent.");
      }
      for (const exercise of submodule.exercises) {
        check(exercise, "exercise");
        if (typeof exercise.question !== "string" || !supportedTypes.has(exercise.type)) {
          throw new Error("Release invalide : question ou type absent.");
        }
      }
    }
  }
  return modules;
}

// Existing answers, backups and browser drafts still include positional keys.
// Until an explicitly reviewed migration, preserve their slots and numeric IDs.
// Text edits and additions at unused trailing slots are safe; moves/removals are not.
export function assertReleaseAnswerCompatibility(published: unknown[], draft: unknown[]) {
  const previous = validateReleaseModules(published);
  const next = validateReleaseModules(draft);
  const fail = () => {
    throw new Error("Modification bloquée pour conserver les réponses et la progression : ne supprime, ne déplace et ne change pas le type d'une question existante. Ajoute les nouveaux éléments en fin de liste, sans déplacer les éléments publiés.");
  };
  for (const oldModule of previous) {
    const moduleItem = next.find((item) => item.stableKey === oldModule.stableKey);
    if (!moduleItem || moduleItem.id !== oldModule.id || moduleItem.position !== oldModule.position) fail();
    for (const oldSubmodule of oldModule.submodules) {
      const submodule = moduleItem!.submodules.find((item) => item.stableKey === oldSubmodule.stableKey);
      if (!submodule || submodule.id !== oldSubmodule.id || submodule.position !== oldSubmodule.position) fail();
      for (const oldExercise of oldSubmodule.exercises) {
        const exercise = submodule!.exercises.find((item) => item.stableKey === oldExercise.stableKey);
        if (!exercise || exercise.id !== oldExercise.id || exercise.position !== oldExercise.position ||
            exercise.type !== oldExercise.type) fail();
        if (!exercise) continue;
        // Nested answer fields still have indexed identities too.
        const previousItems = parseStoredExerciseQuestionConfig(oldExercise.type, oldExercise.options).items;
        const nextItems = parseStoredExerciseQuestionConfig(exercise.type, exercise.options).items;
        if (JSON.stringify(previousItems) !== JSON.stringify(nextItems)) fail();
        if (oldExercise.type === "fill_blank" && getFillBlankCount(oldExercise.question) !== getFillBlankCount(exercise.question)) fail();
        if (oldExercise.type === "table" && JSON.stringify(parseStoredTableConfig(oldExercise.options)) !== JSON.stringify(parseStoredTableConfig(exercise.options))) fail();
      }
    }
  }
}
