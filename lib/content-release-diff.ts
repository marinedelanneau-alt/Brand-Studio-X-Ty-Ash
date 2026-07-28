export type ReleaseEntity = {
  stableKey: string;
  entityType: "module" | "submodule" | "exercise";
  title: string;
  position: number;
  value: Record<string, unknown>;
};

export type ReleaseDifference = {
  stableKey: string;
  entityType: ReleaseEntity["entityType"];
  kind: "added" | "modified" | "moved" | "disabled" | "removed";
  label: string;
};

function objectValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stableKey(value: Record<string, unknown>, fallback: string) {
  return typeof value.stableKey === "string" && value.stableKey.trim()
    ? value.stableKey
    : fallback;
}

function title(value: Record<string, unknown>, fallback: string) {
  if (typeof value.title === "string" && value.title.trim()) return value.title;
  if (typeof value.question === "string" && value.question.trim()) return value.question;
  return fallback;
}

function position(value: Record<string, unknown>, fallback: number) {
  return typeof value.position === "number" && Number.isFinite(value.position)
    ? value.position
    : fallback;
}

function identity(
  value: Record<string, unknown>,
  prefix: string,
  fallback: string,
) {
  if (typeof value.stableKey === "string" && value.stableKey.trim()) {
    return value.stableKey;
  }
  if (
    (typeof value.id === "number" || typeof value.id === "string") &&
    String(value.id).trim()
  ) {
    return `${prefix}_${String(value.id).trim()}`;
  }
  if (typeof value.clientId === "string" && value.clientId.trim()) {
    return `${prefix}_${value.clientId.trim()}`;
  }
  return fallback;
}

export function normalizeReleaseSnapshotModules(modules: unknown[]) {
  return modules.map((rawModule, moduleIndex) => {
    const moduleItem = objectValue(rawModule);
    const moduleKey = identity(moduleItem, "module", `module_new_${moduleIndex}`);
    const submodules = Array.isArray(moduleItem.submodules) ? moduleItem.submodules : [];
    return {
      ...moduleItem,
      stableKey: moduleKey,
      submodules: submodules.map((rawSubmodule, submoduleIndex) => {
        const submodule = objectValue(rawSubmodule);
        const submoduleKey = identity(
          submodule,
          "submodule",
          `${moduleKey}_submodule_new_${submoduleIndex}`,
        );
        const exercises = Array.isArray(submodule.exercises)
          ? submodule.exercises
          : [];
        return {
          ...submodule,
          stableKey: submoduleKey,
          exercises: exercises.map((rawExercise, exerciseIndex) => {
            const exercise = objectValue(rawExercise);
            return {
              ...exercise,
              stableKey: identity(
                exercise,
                "exercise",
                `${submoduleKey}_exercise_new_${exerciseIndex}`,
              ),
            };
          }),
        };
      }),
    };
  });
}

export function hydrateReleaseSnapshotModules(modules: unknown[]) {
  return normalizeReleaseSnapshotModules(modules).map((rawModule) => {
    const moduleItem = objectValue(rawModule);
    const submodules = Array.isArray(moduleItem.submodules)
      ? moduleItem.submodules.map((rawSubmodule) => {
          const submodule = objectValue(rawSubmodule);
          const exercises = Array.isArray(submodule.exercises)
            ? submodule.exercises.map((rawExercise) => {
                const exercise = objectValue(rawExercise);
                return {
                  ...exercise,
                  answer_placeholder:
                    exercise.answer_placeholder ?? exercise.answerPlaceholder ?? null,
                  audio_url: exercise.audio_url ?? exercise.audioUrl ?? null,
                  audio_transcript:
                    exercise.audio_transcript ?? exercise.audioTranscript ?? null,
                  explanation: exercise.explanation ?? "",
                  options: Array.isArray(exercise.options) ? exercise.options : [],
                };
              })
            : [];
          return {
            ...submodule,
            video_url: submodule.video_url ?? submodule.videoUrl ?? null,
            audio_url: submodule.audio_url ?? submodule.audioUrl ?? null,
            audio_transcript:
              submodule.audio_transcript ?? submodule.audioTranscript ?? null,
            content_html: submodule.content_html ?? submodule.contentHtml ?? "",
            exercises,
          };
        })
      : [];
    const exercises = submodules.flatMap((submodule) => submodule.exercises);
    return {
      ...moduleItem,
      video_url: moduleItem.video_url ?? moduleItem.videoUrl ?? null,
      audio_url: moduleItem.audio_url ?? moduleItem.audioUrl ?? null,
      audio_transcript:
        moduleItem.audio_transcript ?? moduleItem.audioTranscript ?? null,
      content_html: moduleItem.content_html ?? moduleItem.contentHtml ?? "",
      is_published: moduleItem.is_published ?? moduleItem.isPublished ?? true,
      submodules,
      exercises,
    };
  });
}

export function flattenReleaseModules(modules: unknown[]) {
  const entities: ReleaseEntity[] = [];
  modules.forEach((rawModule, moduleIndex) => {
    const moduleItem = objectValue(rawModule);
    const moduleKey = stableKey(moduleItem, `module_missing_key_${moduleIndex}`);
    entities.push({
      stableKey: moduleKey,
      entityType: "module",
      title: title(moduleItem, moduleKey),
      position: position(moduleItem, moduleIndex + 1),
      value: moduleItem,
    });
    const submodules = Array.isArray(moduleItem.submodules) ? moduleItem.submodules : [];
    submodules.forEach((rawSubmodule, submoduleIndex) => {
      const submodule = objectValue(rawSubmodule);
      const submoduleKey = stableKey(
        submodule,
        `${moduleKey}:submodule_missing_key_${submoduleIndex}`,
      );
      entities.push({
        stableKey: submoduleKey,
        entityType: "submodule",
        title: title(submodule, submoduleKey),
        position: position(submodule, submoduleIndex + 1),
        value: submodule,
      });
      const exercises = Array.isArray(submodule.exercises)
        ? submodule.exercises
        : [];
      exercises.forEach((rawExercise, exerciseIndex) => {
        const exercise = objectValue(rawExercise);
        const exerciseKey = stableKey(
          exercise,
          `${submoduleKey}:exercise_missing_key_${exerciseIndex}`,
        );
        entities.push({
          stableKey: exerciseKey,
          entityType: "exercise",
          title: title(exercise, exerciseKey),
          position: position(exercise, exerciseIndex + 1),
          value: exercise,
        });
      });
    });
  });
  return entities;
}

function comparable(value: Record<string, unknown>) {
  const content = { ...value };
  delete content.position;
  return JSON.stringify(content, Object.keys(content).sort());
}

export function compareReleaseSnapshots(published: unknown[], draft: unknown[]) {
  const before = new Map(
    flattenReleaseModules(published).map((entity) => [entity.stableKey, entity]),
  );
  const after = new Map(
    flattenReleaseModules(draft).map((entity) => [entity.stableKey, entity]),
  );
  const differences: ReleaseDifference[] = [];

  for (const [key, current] of after) {
    const previous = before.get(key);
    if (!previous) {
      differences.push({
        stableKey: key,
        entityType: current.entityType,
        kind: "added",
        label: current.title,
      });
      continue;
    }
    if (current.position !== previous.position) {
      differences.push({
        stableKey: key,
        entityType: current.entityType,
        kind: "moved",
        label: current.title,
      });
    }
    if (comparable(current.value) !== comparable(previous.value)) {
      const disabled =
        previous.value.isPublished !== false &&
        current.value.isPublished === false;
      differences.push({
        stableKey: key,
        entityType: current.entityType,
        kind: disabled ? "disabled" : "modified",
        label: current.title,
      });
    }
  }

  for (const [key, previous] of before) {
    if (!after.has(key)) {
      differences.push({
        stableKey: key,
        entityType: previous.entityType,
        kind: "removed",
        label: previous.title,
      });
    }
  }
  return differences;
}

export function summarizeReleaseDifferences(differences: ReleaseDifference[]) {
  return differences.reduce(
    (summary, difference) => {
      summary[difference.kind] += 1;
      return summary;
    },
    { added: 0, modified: 0, moved: 0, disabled: 0, removed: 0 },
  );
}
