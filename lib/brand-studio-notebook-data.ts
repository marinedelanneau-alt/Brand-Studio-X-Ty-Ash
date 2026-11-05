import type { GeneratedBrandGuide } from "./brand-guide";
import type { BrandGuideData } from "./brand-guide-pdf-data";
import type { WorkspaceModule } from "./training-types";
import { buildModuleSummaryCard } from "./module-summary";
import { buildTyashNotebookData, notebookText, type NotebookAnswer } from "./tyash-module-notebook-data";
import { parseStoredSpectrumAnswer } from "./spectrum";

export type ProjectNotebookSection = {
  id: string; title: string; scope: string; answers: NotebookAnswer[];
};

// Presentation model only. Never modifies snapshots, exercise definitions or answers.
export function buildBrandStudioNotebookData(guide: GeneratedBrandGuide, data: BrandGuideData, modules?: WorkspaceModule[]) {
  if (guide.projectNotebook) {
    const notebook = guide.projectNotebook;
    return {
      sections: notebook.modules.flatMap(module => module.sections.map(section => ({
        id: `module-${module.id}-${section.id}`, scope: module.title, title: section.title, answers: section.answers,
      }))),
      progress: notebook.modules.map(module => ({ id: module.id, title: module.title, answered: module.answered, total: module.total, completionPercent: module.completionPercent })),
      answered: notebook.answered, total: notebook.total, hasQuestionnaire: true,
    };
  }
  const sections: ProjectNotebookSection[] = [];
  let fieldId = 0;
  const add = (id: string, title: string, fields: Array<{ label: string; value: string }>) => {
    if (!fields.length) return;
    sections.push({ id, title, scope: "Éléments stratégiques", answers: fields.map(field => ({
      id: --fieldId, question: field.label, value: notebookText(field.value), answered: !!field.value.trim(),
    })) });
  };
  // Same chapter order as the existing global PDF, with flowing full-length text.
  add("foundations", "Fondations", data.foundations);
  add("values", "Valeurs", data.values.flatMap(value => [
    { label: value.name, value: value.meaning ?? "" },
    ...(value.concreteApplication ? [{ label: `${value.name} — Dans la pratique`, value: value.concreteApplication }] : []),
    ...(value.communicationExpression ? [{ label: `${value.name} — Dans la communication`, value: value.communicationExpression }] : []),
  ]));
  add("positioning", "Positionnement", data.positioning);
  add("personality", "Personnalité", [...data.personality,
    ...(data.language.use.length ? [{ label: "À privilégier", value: data.language.use.join(" · ") }] : []),
    ...(data.language.avoid.length ? [{ label: "À écarter", value: data.language.avoid.join(" · ") }] : []),
  ]);
  add("messages", "Messages", data.messages);
  add("visual", "Univers visuel", data.ambiance ? [{ label: "Ambiance générale", value: data.ambiance }] : []);
  if (data.palette.length && !sections.some(section => section.id === "visual")) add("visual", "Univers visuel", [{ label: "Palette", value: "" }]);
  if (data.moodboard.length) add("moodboard", "Moodboard", [{ label: "Planche d’inspiration", value: `${data.moodboard.length} éléments` }]);
  if (data.messages.length || data.baseline) add("applications", "Applications", [
    { label: "Publication sociale — principe de composition", value: data.messages[0]?.value || data.baseline },
    { label: "Signature", value: data.baseline },
  ].filter(field => field.value.trim()));
  add("summary", "Synthèse", data.summary);

  const progress = (modules ?? []).map(module => {
    const summary = buildModuleSummaryCard({ module, projectName: guide.brandName });
    const notebook = buildTyashNotebookData(module, summary);
    for (const section of notebook.sections) {
      for (const answer of section.answers) {
        if (answer.spectrum) answer.value = notebookText(parseStoredSpectrumAnswer(module.answers[answer.id] ?? [])?.justification ?? "");
      }
      if (!section.answers.length) continue;
      sections.push({ id: `module-${module.id}-${section.id}`, scope: notebookText(module.title), title: section.title, answers: section.answers });
    }
    // Display existing progression values; PDF rendering never recalculates or
    // changes the application's completion rules.
    return { id: module.id, title: notebookText(module.title), answered: module.progress.answeredCount, total: module.progress.exerciseCount, completionPercent: module.progress.completionPercent };
  });
  return {
    sections, progress,
    answered: progress.reduce((sum, module) => sum + module.answered, 0),
    total: progress.reduce((sum, module) => sum + module.total, 0),
    hasQuestionnaire: modules !== undefined,
  };
}
