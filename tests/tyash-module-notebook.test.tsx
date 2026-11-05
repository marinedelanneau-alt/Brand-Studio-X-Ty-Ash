import { describe, expect, it } from "vitest";
import { generateModulePdf } from "../lib/generate-module-pdf";
import { buildModuleSummaryCard } from "../lib/module-summary";
import { getModuleShareData } from "../lib/get-module-share-data";
import { buildTyashNotebookData, notebookText } from "../lib/tyash-module-notebook-data";
import { buildSpectrumAnswer, getDefaultSpectrumConfig, getSerializedSpectrumOptions, serializeSpectrumAnswer } from "../lib/spectrum";
import type { WorkspaceModule } from "../lib/training-types";

const config = { ...getDefaultSpectrumConfig(), leftLabel: "Sérieuse", rightLabel: "Joueuse", enableJustification: false };
function fixture(): WorkspaceModule {
  const exercises = [
    { id: -3, stableKey: "tyash_v1_question_a", type: "open", question: "Votre histoire ?", options: [] },
    { id: -4, stableKey: "tyash_v1_question_b", type: "spectrum", question: "Sérieuse ←→ Joueuse", options: getSerializedSpectrumOptions(config) },
    { id: -5, stableKey: "tyash_v1_question_c", type: "open", question: "Votre priorité ?", options: [] },
  ].map((e, i) => ({ ...e, position: i + 1, module_id: -1, submodule_id: -2 }));
  return { id: -1, stableKey: "tyash_v1_module_test", title: "TON ENTREPRISE", position: 1, exercises, submodules: [{ id: -2, title: "Votre histoire", position: 1, stableKey: "tyash_v1_submodule", exercises }], answers: { [-3]: ["L’écoute, l’énergie et l’exigence."], [-4]: [serializeSpectrumAnswer(buildSpectrumAnswer({ config, score: 21, justification: "Commentaire historique masqué" }))] }, progress: { completionPercent: 67 } } as unknown as WorkspaceModule;
}
function inputs(module: WorkspaceModule) {
  const summary = buildModuleSummaryCard({ projectName: "Projet Démo", module });
  return { module, summary, shareData: getModuleShareData({ brandName: "Projet Démo", module, summary, completedAt: "2026-11-05T11:00:00Z" }) };
}
async function readPdf(buffer: Buffer) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: new Uint8Array(buffer), standardFontDataUrl: `${process.cwd().replaceAll("\\", "/")}/node_modules/pdfjs-dist/standard_fonts/` });
  const pdf = await task.promise;
  try {
    const pages = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      pages.push(content.items.filter((item): item is import("pdfjs-dist/types/src/display/api").TextItem => "str" in item));
    }
    return pages;
  } finally { await task.destroy(); }
}
describe("TYASH module notebook in the existing download generator", () => {
  it("keeps exact answers and slider extremes; never fills missing values or repeats synthesis answers", () => {
    const currentModule = fixture(); const { summary } = inputs(currentModule);
    const data = buildTyashNotebookData(currentModule, summary);
    expect(data.answered).toBe(2); expect(data.total).toBe(3);
    expect(data.sections[0].answers[0].value).toBe("L’écoute, l’énergie et l’exigence.");
    expect(data.sections[0].answers[1].spectrum).toEqual({ left: "Sérieuse", right: "Joueuse", score: 21 });
    expect(data.sections[0].answers[2]).toMatchObject({ value: "", answered: false });
    delete currentModule.answers[-4];
    expect(buildTyashNotebookData(currentModule, summary).sections[0].answers[1].spectrum?.score).toBeNull();
    expect(notebookText("<p>Écoute &amp; création.</p><p>L’apostrophe.</p>")).toBe("Écoute & création.\nL’apostrophe.");
  });
  it("paginates long answers completely, keeps slider blocks together and leaves input data unchanged", async () => {
    const currentModule = fixture();
    currentModule.answers[-3] = ["DÉBUT DU TÉMOIGNAGE. " + "L’écoute et l’énergie nourrissent chaque projet. Une exigence précise, sans rien inventer. ".repeat(95) + "\nRéférence : " + "LongueReferenceSansEspace".repeat(18) + "\nFIN DU TÉMOIGNAGE."];
    const before = structuredClone(currentModule);
    const pages = await readPdf(await generateModulePdf(inputs(currentModule)));
    expect(pages.length).toBeGreaterThan(4);
    const text = pages.flat().map(i => i.str).join(" ");
    expect(text).toContain("FIN DU TÉMOIGNAGE");
    expect(text).toContain("DÉBUT DU TÉMOIGNAGE");
    expect(text.match(/FIN DU TÉMOIGNAGE/g)).toHaveLength(1);
    expect(text).not.toContain("Commentaire historique masqué");
    expect(text).toContain("Non renseigné");
    expect(text).toContain("21/100");
    const sliderPage = pages.find(items => items.some(i => i.str.includes("21/100")))!;
    expect(sliderPage.some(i => i.str.includes("Sérieuse"))).toBe(true);
    expect(sliderPage.some(i => i.str.includes("Joueuse"))).toBe(true);
    for (const items of pages) {
      expect(items.length).toBeGreaterThan(10);
      for (const item of items.filter(i => i.str.trim())) {
        expect(item.transform[5]).toBeGreaterThan(15);
        expect(item.transform[5]).toBeLessThan(825);
        expect(item.transform[4]).toBeGreaterThanOrEqual(40);
        expect(item.transform[4] + item.width).toBeLessThanOrEqual(552);
        // Content must end above the running footer; only footer items are lower.
        if (item.transform[5] > 45) expect(item.transform[5]).toBeGreaterThan(62);
      }
    }
    expect(currentModule).toEqual(before);
  }, 20000);
  it("preserves the original Brand Studio renderer for non-TYASH modules", async () => {
    const currentModule = fixture(); currentModule.stableKey = "module_1";
    const pages = await readPdf(await generateModulePdf(inputs(currentModule)));
    expect(pages.flat().map(i => i.str).join(" ")).toContain("Synthèse de fin de module");
    expect(pages.flat().map(i => i.str).join(" ")).not.toContain("LE BILAN DU MODULE");
  });
});
