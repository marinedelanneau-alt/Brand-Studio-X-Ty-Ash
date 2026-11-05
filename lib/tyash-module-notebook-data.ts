import type { WorkspaceModule } from "./training-types";
import type { ModuleSummaryCard, ModuleSummaryHighlight } from "./module-summary";
import { isAnswerableExerciseType } from "./exercise-types";
import { parseStoredSpectrumAnswer, parseStoredSpectrumConfig } from "./spectrum";
import { toPlainText } from "./plain-text";

export type NotebookAnswer = {
  id: number; question: string; value: string; answered: boolean;
  spectrum?: { left: string; right: string; score: number | null };
  table?: ModuleSummaryHighlight["table"];
  colors?: ModuleSummaryHighlight["colors"];
};

// Keep client paragraphs and all of their text; no summarisation or truncation.
export function notebookText(value: string): string {
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/(?:p|div|li|h[1-6])\s*>|<br\s*\/?>/gi, "\n")
    .split(/\r?\n/).map(toPlainText).join("\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]/gu, "")
    .replace(/←\s*→|↔/g, " / ")
    .replace(/\n{3,}/g, "\n\n").trim();
}

export function buildTyashNotebookData(module: WorkspaceModule, summary: ModuleSummaryCard) {
  const sections = module.submodules.filter(s => !s.archived).map(submodule => {
    const answers = submodule.exercises.filter(e => isAnswerableExerciseType(e.type) && (!e.tyashQuestionnaire || e.tyashQuestionnaire.status === "active")).map(exercise => {
      const values = module.answers[exercise.id] ?? [];
      const highlight = summary.submoduleRecaps.find(s => s.id === submodule.id)?.highlights.find(h => h.exerciseId === exercise.id);
      const base: NotebookAnswer = { id: exercise.id, question: notebookText(exercise.question), value: "", answered: false };
      if (exercise.type === "spectrum") {
        const stored = parseStoredSpectrumAnswer(values);
        const config = parseStoredSpectrumConfig(exercise.options);
        return { ...base, answered: !!stored, spectrum: { left: notebookText(stored?.leftLabel || config.leftLabel), right: notebookText(stored?.rightLabel || config.rightLabel), score: stored?.score ?? null } };
      }
      const value = notebookText(["open", "prompt_open"].includes(exercise.type) ? values[0] ?? "" : highlight?.value ?? "");
      const answered = values.some(v => v.trim()) && !!value && (highlight?.value !== "À compléter" || ["open", "prompt_open"].includes(exercise.type));
      return { ...base, value: answered ? value : "", answered, table: highlight?.table, colors: highlight?.colors };
    });
    return { id: submodule.id, title: notebookText(submodule.title), position: submodule.position, answers, answered: answers.filter(a => a.answered).length };
  });
  const answers = sections.flatMap(s => s.answers);
  return { sections, total: answers.length, answered: answers.filter(a => a.answered).length, sliders: answers.filter(a => a.spectrum?.score !== null && a.spectrum?.score !== undefined).length };
}
