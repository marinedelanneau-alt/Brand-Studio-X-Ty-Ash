import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EditorialStatus = "draft" | "scheduled" | "published" | "archived";

export type VersionQuestion = {
  questionKey: string;
  fieldKey: string;
  exerciseKey: string;
  label: string;
  questionType: string;
  sortOrder: number;
  isRequired: boolean;
  configuration: Record<string, unknown>;
};

export type VersionExercise = {
  exerciseKey: string;
  submoduleKey: string;
  exerciseType: string;
  sortOrder: number;
  configuration: Record<string, unknown>;
};

export type ModuleVersionContent = {
  id: string;
  moduleKey: string;
  versionNumber: number;
  status: EditorialStatus;
  title: string;
  exercises: VersionExercise[];
  questions: VersionQuestion[];
};

export type ValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  stableKey?: string;
};

export type VersionChange = {
  kind: "added" | "removed" | "modified" | "moved" | "attention";
  entity: "module" | "exercise" | "question";
  stableKey: string;
  details: string;
};

function duplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicateValues = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicateValues.add(value);
    seen.add(value);
  }
  return [...duplicateValues];
}

export function validateModuleVersion(version: ModuleVersionContent) {
  const issues: ValidationIssue[] = [];
  if (!version.moduleKey.trim()) {
    issues.push({ severity: "error", code: "module_key_missing", message: "La clé stable du module est obligatoire." });
  }
  if (!version.title.trim()) {
    issues.push({ severity: "error", code: "title_missing", message: "Le titre du module est obligatoire." });
  }

  for (const key of duplicates(version.exercises.map((item) => item.exerciseKey))) {
    issues.push({ severity: "error", code: "exercise_key_duplicate", stableKey: key, message: `La clé d'exercice ${key} est dupliquée.` });
  }
  for (const key of duplicates(version.questions.map((item) => `${item.questionKey}:${item.fieldKey}`))) {
    issues.push({ severity: "error", code: "question_key_duplicate", stableKey: key, message: `La clé de question ${key} est dupliquée.` });
  }

  const exerciseKeys = new Set(version.exercises.map((item) => item.exerciseKey));
  for (const question of version.questions) {
    if (!question.questionKey.trim() || !question.fieldKey.trim()) {
      issues.push({ severity: "error", code: "question_key_missing", message: "Chaque question doit avoir question_key et field_key." });
    }
    if (!exerciseKeys.has(question.exerciseKey)) {
      issues.push({ severity: "error", code: "exercise_reference_invalid", stableKey: question.questionKey, message: `La question ${question.questionKey} référence un exercice absent.` });
    }
    if (!question.label.trim()) {
      issues.push({ severity: "error", code: "question_label_missing", stableKey: question.questionKey, message: `La question ${question.questionKey} n'a pas de libellé.` });
    }
  }
  return issues;
}

function comparable(value: unknown) {
  return JSON.stringify(value, Object.keys((value ?? {}) as object).sort());
}

export function compareModuleVersions(published: ModuleVersionContent, draft: ModuleVersionContent) {
  const changes: VersionChange[] = [];
  if (published.title !== draft.title) {
    changes.push({ kind: "modified", entity: "module", stableKey: draft.moduleKey, details: "Titre modifié" });
  }

  const oldQuestions = new Map(published.questions.map((item) => [`${item.questionKey}:${item.fieldKey}`, item]));
  const newQuestions = new Map(draft.questions.map((item) => [`${item.questionKey}:${item.fieldKey}`, item]));
  for (const [key, question] of newQuestions) {
    const previous = oldQuestions.get(key);
    if (!previous) {
      changes.push({ kind: "added", entity: "question", stableKey: key, details: "Nouvelle question" });
    } else {
      if (previous.label !== question.label || previous.questionType !== question.questionType || comparable(previous.configuration) !== comparable(question.configuration)) {
        changes.push({ kind: "modified", entity: "question", stableKey: key, details: "Texte, type ou configuration modifié" });
      }
      if (previous.sortOrder !== question.sortOrder || previous.exerciseKey !== question.exerciseKey) {
        changes.push({ kind: "moved", entity: "question", stableKey: key, details: "Ordre ou exercice parent modifié" });
      }
      if (previous.questionType !== question.questionType) {
        changes.push({ kind: "attention", entity: "question", stableKey: key, details: "Le type de réponse change : une stratégie de migration est requise." });
      }
    }
  }
  for (const key of oldQuestions.keys()) {
    if (!newQuestions.has(key)) {
      changes.push({ kind: "removed", entity: "question", stableKey: key, details: "Question retirée ; les réponses existantes doivent être conservées." });
    }
  }
  return changes;
}

export function analyzeVersionCompatibility(oldVersion: ModuleVersionContent, newVersion: ModuleVersionContent) {
  return compareModuleVersions(oldVersion, newVersion).map((change) => ({
    ...change,
    compatibility:
      change.kind === "removed" ? "question_removed"
      : change.kind === "attention" ? "incompatible"
      : change.kind === "added" ? "new_question"
      : "automatically_compatible",
  }));
}

export async function getModuleContent(input: {
  moduleKey: string;
  viewer: "user" | "admin";
  previewMode?: boolean;
  versionId?: string;
}) {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("module_versions")
    .select("*, editorial_modules!inner(module_key), exercise_versions(*), question_versions(*)")
    .eq("editorial_modules.module_key", input.moduleKey);

  if (input.viewer === "admin" && input.previewMode && input.versionId) {
    query = query.eq("id", input.versionId);
  } else {
    query = query.eq("status", "published");
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
