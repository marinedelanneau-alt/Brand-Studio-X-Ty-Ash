import { describe, expect, it } from "vitest";
import { makeGuide } from "./fixtures/brand-guide";
import { renderBrandGuidePdf } from "../lib/brand-guide-pdf";
import { createBrandGuideData } from "../lib/brand-guide-pdf-data";
import { buildBrandStudioNotebookData } from "../lib/brand-studio-notebook-data";
import { buildSpectrumAnswer, getDefaultSpectrumConfig, getSerializedSpectrumOptions, serializeSpectrumAnswer } from "../lib/spectrum";
import type { WorkspaceModule } from "../lib/training-types";

function fixture(): WorkspaceModule {
  const config = { ...getDefaultSpectrumConfig(), leftLabel: "Sérieuse", rightLabel: "Joueuse" };
  const exercises = [
    { id: 1, type: "open", question: "Votre histoire ?", options: [] },
    { id: 2, type: "spectrum", question: "Votre personnalité ?", options: getSerializedSpectrumOptions(config) },
    { id: 3, type: "open", question: "Votre priorité ?", options: [] },
  ].map((e, index) => ({ ...e, position: index + 1, module_id: 1, submodule_id: 1 }));
  return { id: 1, title: "TON ENTREPRISE", position: 1, stableKey: "tyash_v1_module_test", exercises,
    submodules: [{ id: 1, title: "Votre histoire", position: 1, exercises }],
    answers: { 1: ["L’écoute, l’énergie et l’exigence."], 2: [serializeSpectrumAnswer(buildSpectrumAnswer({ config, score: 73, justification: "Une personnalité assumée." }))] },
    progress: { answeredCount: 2, exerciseCount: 3, completionPercent: 67, isCompleted: false, isUnlocked: true },
  } as unknown as WorkspaceModule;
}

describe("Brand Studio notebook in the existing download generator", () => {
  it("preserves exact answers, slider labels and existing progression without mutating sources", () => {
    const guide = makeGuide(); const currentModule = fixture();
    const before = structuredClone({ guide, currentModule });
    const data = buildBrandStudioNotebookData(guide, createBrandGuideData(guide), [currentModule]);
    expect(data.progress[0]).toMatchObject({ answered: 2, total: 3, completionPercent: 67 });
    const answers = data.sections.find(section => section.id.startsWith("module-"))!.answers;
    expect(answers[0].value).toBe(currentModule.answers[1][0]);
    expect(answers[1]).toMatchObject({ spectrum: { left: "Sérieuse", right: "Joueuse", score: 73 }, value: "Une personnalité assumée." });
    expect(answers[2]).toMatchObject({ answered: false, value: "" });
    expect({ guide, currentModule }).toEqual(before);
    const savedSnapshot = buildBrandStudioNotebookData(guide, createBrandGuideData(guide));
    expect(savedSnapshot.hasQuestionnaire).toBe(false);
  });

  it("renders complete long answers, accents, sliders and final page numbers on A4", async () => {
    const guide = makeGuide(); const currentModule = fixture();
    currentModule.answers[1] = ["DÉBUT DU RÉCIT.\n" + "L’écoute, le cœur et l’énergie : un projet à 50 €, sans compromis. ".repeat(160) + "\nFIN DU RÉCIT."];
    const before = structuredClone({ guide, currentModule });
    const buffer = await renderBrandGuidePdf(guide, { design: "notebook", modules: [currentModule] });
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = getDocument({ data: new Uint8Array(buffer), standardFontDataUrl: `${process.cwd().replaceAll("\\", "/")}/node_modules/pdfjs-dist/standard_fonts/` });
    try {
      const pdf = await task.promise;
      const texts: string[] = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        expect(page.view[2]).toBeCloseTo(595.28, 1);
        const content = await page.getTextContent();
        const items = content.items.filter((item): item is import("pdfjs-dist/types/src/display/api").TextItem => "str" in item && !!item.str.trim());
        for (const item of items) {
          expect(item.transform[4]).toBeGreaterThanOrEqual(40);
          expect(item.transform[4] + item.width).toBeLessThan(556);
          expect(item.transform[5]).toBeGreaterThan(20);
          expect(item.transform[5]).toBeLessThan(820);
        }
        texts.push(items.map(item => item.str).join(" "));
        expect(texts.at(-1)).toContain(`${n} / ${pdf.numPages}`);
      }
      const text = texts.join(" ");
      expect(texts[0]).toContain("TON CARNET DE PROJET");
      expect(text).toContain("DÉBUT DU RÉCIT.");
      expect(text).toContain("FIN DU RÉCIT.");
      expect(text.match(/sans compromis/g)).toHaveLength(160);
      expect(text).toContain("50 €");
      expect(text).toContain("Position choisie : 73/100");
      expect(text).toContain("Non renseigné");
      expect(text).toContain("LE BILAN DE TON PROJET");
      expect(text).not.toContain("TYASH");
      expect({ guide, currentModule }).toEqual(before);
    } finally { await task.destroy(); }
  });
});
