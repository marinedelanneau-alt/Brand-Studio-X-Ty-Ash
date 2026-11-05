import type { BrandProject, WorkspaceModule } from "./training-types";
import type { GeneratedBrandGuide } from "./brand-guide";
import { isTyAshContent } from "./tyash-answer-identity";
import { buildModuleSummaryCard } from "./module-summary";
import { buildTyashNotebookData, notebookText, type NotebookAnswer } from "./tyash-module-notebook-data";
import { parseStoredSpectrumAnswer } from "./spectrum";
import { getModuleHref } from "./module-routing";

export const TYASH_NOTEBOOK_TAGLINE = "DE TON BESOIN À UN PROJET VIDÉO QUI A DU SENS.";
export type TyashProjectNotebook = {
  kind: "tyash_project_notebook";
  projectName: string; generatedAt: string; answered: number; total: number;
  modules: Array<{
    id: number; title: string; position: number; href: string;
    answered: number; total: number; completionPercent: number;
    sections: Array<{ id: number; title: string; position: number; answers: NotebookAnswer[] }>;
  }>;
};

export function buildTyashProjectNotebook(input: {
  project: BrandProject; modules: WorkspaceModule[]; brandName?: string | null; generatedAt?: string;
}): TyashProjectNotebook {
  const projectName = input.brandName?.trim() || input.project.name;
  const modules = input.modules.filter(module => isTyAshContent(module) && !module.archived && module.is_published !== false)
    .toSorted((a, b) => a.position - b.position).map(module => {
      const ordered = { ...module, submodules: module.submodules.toSorted((a, b) => a.position - b.position)
        .map(section => ({ ...section, exercises: section.exercises.toSorted((a, b) => a.position - b.position) })) };
      const summary = buildModuleSummaryCard({ module: ordered, projectName });
      const notebook = buildTyashNotebookData(ordered, summary);
      const sections = notebook.sections.map(section => ({ ...section, answers: section.answers.map(answer => ({
        ...answer,
        ...(answer.spectrum ? { value: notebookText(parseStoredSpectrumAnswer(module.answers[answer.id] ?? [])?.justification ?? "") } : {}),
      })) }));
      return { id: module.id, title: notebookText(module.title), position: module.position, href: getModuleHref(module), sections,
        answered: module.progress.answeredCount, total: module.progress.exerciseCount, completionPercent: module.progress.completionPercent };
    });
  return { kind: "tyash_project_notebook", projectName, generatedAt: input.generatedAt ?? new Date().toISOString(), modules,
    answered: modules.reduce((sum, module) => sum + module.answered, 0), total: modules.reduce((sum, module) => sum + module.total, 0) };
}

export function tyashProjectNotebookText(notebook: TyashProjectNotebook) {
  return ["TON CARNET DE PROJET", notebook.projectName, TYASH_NOTEBOOK_TAGLINE,
    ...notebook.modules.flatMap(module => [
      `MODULE ${module.position} — ${module.title}`, `${module.answered} / ${module.total} exercices renseignés`,
      ...module.sections.flatMap(section => [section.title, ...section.answers.flatMap(answer => [answer.question,
        answer.spectrum ? `${answer.spectrum.left} / ${answer.spectrum.right} : ${answer.spectrum.score === null ? "À compléter" : `${answer.spectrum.score}/100`}${answer.value ? `\n${answer.value}` : ""}`
          : !answer.answered ? "À compléter" : answer.table ? answer.table.rows.map(row => row.map((cell, index) => `${answer.table!.columns[index]} : ${cell}`).join("\n")).join("\n\n") : answer.value,
      ])]),
    ]), `BILAN : ${notebook.answered} / ${notebook.total} exercices renseignés`,
  ].join("\n\n");
}

// Keep the established export envelope and storage identifiers for compatibility.
// The legacy branding model is never generated for a TYASH notebook.
export function createTyashProjectGuide(input: Parameters<typeof buildTyashProjectNotebook>[0]): GeneratedBrandGuide {
  const projectNotebook = buildTyashProjectNotebook(input);
  return {
    projectNotebook, brandName: projectNotebook.projectName, generatedAt: projectNotebook.generatedAt,
    brandAssets: { logoOwner: projectNotebook.projectName }, baseline: "",
    completion: { hasAnyData: projectNotebook.answered > 0, warning: projectNotebook.answered === projectNotebook.total && projectNotebook.total > 0 ? "Votre carnet est complet." : "Votre carnet contient des éléments à compléter.",
      items: projectNotebook.modules.map(module => ({ key: String(module.id), label: module.title, moduleHref: module.href, status: module.completionPercent === 100 ? "ok" : "missing" })) },
    cover: { title: "TON CARNET DE PROJET", subtitle: TYASH_NOTEBOOK_TAGLINE, introLine: "" }, introduction: "",
    dna: { activity: "", essence: "", mission: "", vision: "", values: [], promise: "" },
    positioning: { target: "", context: "", problem: "", differentiation: "", competitors: "", finalPositioning: "", pitch: "" },
    personality: { persona: "", traits: [], relationship: "", tone: "", wordsToUse: [], wordsToAvoid: [] },
    baselineSection: { final: "", variants: [], recommendedUses: [] },
    visualUniverse: { palette: { primary: [], secondary: [] }, ambiance: "", graphicElements: "", moodboardBackground: "", moodboard: [], prioritySupports: [] },
    applicationRules: { social: [], website: [], presentations: [], salesDocs: [], prioritySupports: [] },
    checklists: { visual: [], editorial: [], support: [], evolution: [] },
    expressSummary: { mission: "", positioning: "", tone: [], palette: [], promise: "", baseline: "" },
  };
}
