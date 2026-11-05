import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("next/font/local", () => ({ default: () => ({ className: "notebook-font" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../app/brand-guide/actions", () => ({ saveBrandGuideExport: vi.fn() }));
import { generateGuideFromAnswers } from "../lib/brand-guide";
import { buildTyashProjectNotebook, tyashProjectNotebookText } from "../lib/tyash-project-notebook";
import { buildBrandStudioNotebookData } from "../lib/brand-studio-notebook-data";
import { createBrandGuideData } from "../lib/brand-guide-pdf-data";
import { renderBrandGuidePdf } from "../lib/brand-guide-pdf";
import BrandGuideLayout from "../app/ui/brand-guide";
import { buildSpectrumAnswer, getDefaultSpectrumConfig, getSerializedSpectrumOptions, serializeSpectrumAnswer } from "../lib/spectrum";
import type { BrandProject, WorkspaceModule } from "../lib/training-types";

function fixture() {
  const config = { ...getDefaultSpectrumConfig(), leftLabel: "Calme", rightLabel: "Énergique" };
  const modules = [4, 2, 1, 3].map(position => {
    const exercises = [
      { id: position * 10 + 1, position: 2, type: "open", question: `Question ouverte ${position} ?`, options: [] },
      { id: position * 10 + 2, position: 1, type: "spectrum", question: `Curseur ${position} ?`, options: getSerializedSpectrumOptions(config) },
    ].map(e => ({ ...e, module_id: position, submodule_id: position }));
    return { id: position, stableKey: `tyash_v1_module_${position}`, title: `Intitulé publié ${position}`, position, is_published: true,
      exercises, submodules: [{ id: position, title: `Sous-module publié ${position}`, position: 1, exercises }],
      answers: position === 1 ? { 11: ["DÉBUT. " + "Une réponse intégrale, sans troncature. ".repeat(130) + "FIN."],
        12: [serializeSpectrumAnswer(buildSpectrumAnswer({ config, score: 73, justification: "Ma vision reste une réponse client." }))] } : {},
      progress: { answeredCount: position === 1 ? 2 : 0, exerciseCount: 2, completionPercent: position === 1 ? 100 : 0, isCompleted: position === 1, isUnlocked: true },
    } as unknown as WorkspaceModule;
  });
  return { project: { id: 7, name: "Projet témoin" } as BrandProject, modules };
}

describe("one current TYASH project notebook model", () => {
  it("uses published titles/order and exact answers, excludes inactive modules, and never generates branding fields", () => {
    const input = fixture(); const before = structuredClone(input);
    const guide = generateGuideFromAnswers(input);
    expect(guide.projectNotebook?.modules.map(module => module.title)).toEqual([1, 2, 3, 4].map(n => `Intitulé publié ${n}`));
    expect(guide.dna.mission).toBe(""); expect(guide.baseline).toBe(""); expect(guide.completion.items).toHaveLength(4);
    const notebook = guide.projectNotebook!;
    expect(notebook).toMatchObject({ answered: 2, total: 8 });
    expect(notebook.modules[0].sections[0].answers.map(answer => answer.id)).toEqual([12, 11]);
    expect(notebook.modules[0].sections[0].answers[1].value).toBe(input.modules.find(module => module.id === 1)!.answers[11][0]);
    const pdfData = buildBrandStudioNotebookData(guide, createBrandGuideData(guide));
    expect(pdfData.sections).toHaveLength(4);
    expect(pdfData.sections[0].answers).toEqual(notebook.modules[0].sections[0].answers);
    const archived = { ...input.modules[0], id: 99, archived: true };
    const draft = { ...input.modules[0], id: 98, is_published: false };
    expect(buildTyashProjectNotebook({ ...input, modules: [...input.modules, archived, draft] }).modules).toHaveLength(4);
    expect(input).toEqual(before);
  });

  it("renders the same current content in HTML, copied text and PDF including blanks and slider values", async () => {
    const guide = generateGuideFromAnswers(fixture());
    const before = structuredClone(guide);
    const html = renderToStaticMarkup(<BrandGuideLayout guide={guide} latestGeneratedAt={null} />);
    const copied = tyashProjectNotebookText(guide.projectNotebook!);
    expect(html).toContain("ÉTAT DU CARNET");
    expect(html).toContain("2 / 8 exercices renseignés");
    expect(html).toContain("À compléter");
    expect(html).toContain("Position choisie : 73/100");
    expect(html).toContain("DE TON BESOIN À UN PROJET VIDÉO QUI A DU SENS.");
    expect(html).not.toContain("ADN de marque"); expect(html).not.toContain("Baseline"); expect(html).not.toContain("Palette");
    expect(copied).toContain("Calme / Énergique : 73/100");
    expect(copied).toContain("Ma vision reste une réponse client.");
    expect(copied).toContain("À compléter");
    const buffer = await renderBrandGuidePdf(guide, { design: "notebook" });
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = getDocument({ data: new Uint8Array(buffer) });
    try {
      const pdf = await task.promise; const texts: string[] = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const content = await (await pdf.getPage(n)).getTextContent();
        texts.push(content.items.map(item => "str" in item ? item.str : "").join(" "));
      }
      const text = texts.join(" ");
      for (const n of [1, 2, 3, 4]) expect(text).toContain(`Intitulé publié ${n}`);
      expect(text).toContain("À compléter"); expect(text).toContain("Position choisie : 73/100");
      expect(text).toContain("Ma vision reste une réponse client.");
      expect(text).toContain("DÉBUT."); expect(text).toContain("FIN.");
      expect(text.match(/sans troncature/g)).toHaveLength(130);
      expect(text).not.toContain("Éléments stratégiques"); expect(text).not.toContain("Baseline");
      expect(guide).toEqual(before);
    } finally { await task.destroy(); }
  });
});
