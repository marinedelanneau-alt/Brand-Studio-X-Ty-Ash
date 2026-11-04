import type { BrandModule, BrandSubmodule, ModuleExercise } from "./training-types";
import { getFillBlankCount, parseStoredExerciseQuestionConfig, parseStoredTableConfig } from "./exercise-types";

type Module = BrandModule & { submodules: Array<BrandSubmodule & { exercises: ModuleExercise[] }>; exercises: ModuleExercise[] };

export function activeQuestionnaire<T extends Module>(modules: T[]): T[] {
  return modules.filter(m => !m.archived).map(m => {
    const submodules = m.submodules.filter(s => !s.archived).map(s => ({ ...s, exercises: s.exercises.filter(e => !e.tyashQuestionnaire || e.tyashQuestionnaire.status === "active") }));
    return { ...m, submodules, exercises: submodules.flatMap(s => s.exercises) };
  });
}

export function prefillQuestions(modules: Module[]) {
  return activeQuestionnaire(modules).flatMap(m => m.submodules.flatMap(s => s.exercises.filter(e => e.tyashQuestionnaire?.prefill).map(e => ({ ...e, stableKey: e.stableKey!, moduleKey: e.answerModuleStableKey ?? m.stableKey!, label: e.question }))));
}

// Indexed answer layouts are immutable. A changed layout gets a fresh question
// identity; the original definition remains archived with its historical answers.
export function sameAnswerLayout(a: Pick<ModuleExercise, "type" | "question" | "options">, b: Pick<ModuleExercise, "type" | "question" | "options">) {
  return a.type === b.type
    && JSON.stringify(parseStoredExerciseQuestionConfig(a.type, a.options).items) === JSON.stringify(parseStoredExerciseQuestionConfig(b.type, b.options).items)
    && (a.type !== "fill_blank" || getFillBlankCount(a.question) === getFillBlankCount(b.question))
    && (a.type !== "table" || JSON.stringify(parseStoredTableConfig(a.options)) === JSON.stringify(parseStoredTableConfig(b.options)));
}

export function retainQuestionnaireHistory<T extends Module>(previous: T, next: T): T {
  const retained = new Set(next.submodules.flatMap(s => s.exercises.map(e => e.stableKey)));
  const submodules = next.submodules.map(s => ({ ...s, exercises: [...s.exercises] }));
  for (const old of previous.submodules) {
    let target = submodules.find(s => s.stableKey === old.stableKey);
    if (!target) {
      target = { ...old, archived: true, exercises: [] };
      submodules.push(target);
    }
    target.exercises.push(...old.exercises.filter(e => !retained.has(e.stableKey)).map(e => ({ ...e, tyashQuestionnaire: { ...e.tyashQuestionnaire, status: e.tyashQuestionnaire?.status === "merged" ? "merged" as const : "archived" as const } })));
  }
  let position = 1;
  submodules.sort((a, b) => Number(!!a.archived) - Number(!!b.archived));
  submodules.forEach((s, i) => {
    s.position = i + 1;
    s.exercises.sort((a, b) => Number(!!a.tyashQuestionnaire && a.tyashQuestionnaire.status !== "active") - Number(!!b.tyashQuestionnaire && b.tyashQuestionnaire.status !== "active"));
    s.exercises = s.exercises.map(e => ({ ...e, position: position++, module_id: next.id, submodule_id: s.id }));
  });
  return { ...next, submodules, exercises: submodules.flatMap(s => s.exercises) };
}
