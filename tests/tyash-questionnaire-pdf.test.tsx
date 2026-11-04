import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { renderToBuffer } from "@react-pdf/renderer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { TyashQuestionnairePdf } from "../lib/tyash-questionnaire-pdf";
import { buildSpectrumAnswer, getDefaultSpectrumConfig, serializeSpectrumAnswer } from "../lib/spectrum";
import type { AdminUserView } from "../lib/admin-user-insights";

describe("TYASH questionnaire PDF", () => {
  it("exports four modules and the current answers, with readable sliders and no historical justification", async () => {
    const user = {
      name: "Client test", company: "Entreprise test",
      moduleProgress: [1,2,3,4].map(id => ({ id, title: `MODULE ${id}`, progress: 50 })),
      answers: [{ moduleId: 1, moduleTitle: "MODULE 1", modulePosition: 1, submoduleTitle: "Histoire", exerciseId: 10, exerciseTitle: "Ton activité", exerciseType: "open", values: ["Fabrication artisanale"], updatedAt: null, origin: "prefill" }, { moduleId: 4, moduleTitle: "MODULE 4", modulePosition: 4, submoduleTitle: "Univers vidéo", exerciseId: 40, exerciseTitle: "Le rythme", exerciseType: "spectrum", values: [serializeSpectrumAnswer(buildSpectrumAnswer({ config: getDefaultSpectrumConfig(), score: 73, justification: "ANCIEN_COMMENTAIRE_SECRET" }))], updatedAt: null }],
    } as AdminUserView;
    const bytes = await renderToBuffer(TyashQuestionnairePdf({ user }));
    const loading = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true });
    const pdf = await loading.promise;
    try {
      expect(pdf.numPages).toBe(4);
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i); const content = await page.getTextContent();
        text += content.items.map(item => "str" in item ? item.str : "").join(" ");
      }
      expect(text).toContain("Fabrication artisanale");
      expect(text).toContain("73/100");
      expect(text).not.toContain("ANCIEN_COMMENTAIRE_SECRET");
      for (let i = 1; i <= 4; i++) expect(text).toContain(`MODULE ${i}`);
    } finally { await loading.destroy(); }
  });
});
