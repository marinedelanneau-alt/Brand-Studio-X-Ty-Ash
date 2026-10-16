export function isTyAshContent(entity: { stableKey?: string }) {
  return entity.stableKey?.startsWith("tyash_v1_") === true;
}

export function requireTyAshKey(entity: { stableKey?: string }): string {
  if (!isTyAshContent(entity)) throw new Error("Ty Ash stable identity required.");
  return entity.stableKey!;
}

export function tyAshBrowserKey(projectId: number, module: { stableKey?: string }) {
  return `tyash-answers:v1:${projectId}:${requireTyAshKey(module)}`;
}

export function resolveTyAshExerciseId(
  module: { stableKey?: string; exercises: { id: number; stableKey?: string }[] },
  answer: { module_key: string; question_key: string },
) {
  if (answer.module_key !== requireTyAshKey(module)) return undefined;
  return module.exercises.find((exercise) =>
    requireTyAshKey(exercise) === answer.question_key,
  )?.id;
}

export function encodeTyAshBrowserDraft(
  module: { stableKey?: string; exercises: { id: number; stableKey?: string }[] },
  projectId: number, answers: Record<number, string[]>, pending: number[], updatedAt: number,
) {
  return JSON.stringify({
    version: 1, projectId, moduleKey: requireTyAshKey(module), updatedAt,
    answers: Object.fromEntries(module.exercises.map(e => [requireTyAshKey(e), answers[e.id] ?? []])),
    pendingKeys: module.exercises.filter(e => pending.includes(e.id)).map(requireTyAshKey),
  });
}

export function decodeTyAshBrowserDraft(
  value: string | null,
  module: { stableKey?: string; exercises: { id: number; stableKey?: string }[] }, projectId: number,
) {
  if (!value) return null;
  try {
    const data = JSON.parse(value);
    if (data.version !== 1 || data.projectId !== projectId || data.moduleKey !== requireTyAshKey(module)) return null;
    const answers: Record<number, string[]> = {};
    const pendingExerciseIds: number[] = [];
    for (const exercise of module.exercises) {
      const key = requireTyAshKey(exercise);
      if (Array.isArray(data.answers?.[key])) answers[exercise.id] = data.answers[key].filter((v: unknown) => typeof v === "string");
      if (Array.isArray(data.pendingKeys) && data.pendingKeys.includes(key)) pendingExerciseIds.push(exercise.id);
    }
    return { updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0, answers, pendingExerciseIds, stableKeyVersion: 2 as const };
  } catch { return null; }
}
