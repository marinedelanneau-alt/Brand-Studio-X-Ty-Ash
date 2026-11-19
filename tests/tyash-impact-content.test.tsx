import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { IMPACT_CONTENT, reviseImpactContent, assertOnlyImpactChanges } from "../scripts/lib/tyash-impact-content.mjs";
import { projectTyashQuestionnaire } from "../lib/tyash-questionnaire";
import { sameAnswerLayout } from "../lib/questionnaire-admin";
import { buildModuleSummaryCard } from "../lib/module-summary";
import { buildTyashNotebookData } from "../lib/tyash-module-notebook-data";
import { generateGuideFromAnswers } from "../lib/brand-guide";
import { renderBrandGuidePdf } from "../lib/brand-guide-pdf";
import { generateModulePdf } from "../lib/generate-module-pdf";
import { getModuleShareData } from "../lib/get-module-share-data";
import { prefillQuestions } from "../lib/questionnaire-admin";
import type { WorkspaceModule } from "../lib/training-types";

function fixture(): WorkspaceModule[] {
  const questions = IMPACT_CONTENT.questions.map((q, i) => ({
    id: q.id, stableKey: q.key, question: q.previous, type: "open", options: [], position: i+1,
    module_id: -65, submodule_id: -66, explanation: "", answer_placeholder: "", audio_url: null, audio_transcript: null,
    tyashQuestionnaire: { status: "active", ...(i === 0 ? { prefill: true } : {}) },
    answerModuleStableKey: IMPACT_CONTENT.module.key, answerSubmoduleStableKey: IMPACT_CONTENT.submodule.key,
  }));
  const submodules = [{ id: -66, stableKey: IMPACT_CONTENT.submodule.key, title: "LE PROBLÈME À RÉSOUDRE",
    position: 1, module_id: -65, content_html: "<p>Le problème à résoudre.</p>", exercises: questions,
    editorialIntroduction: { layout: "brand_video", headline: "Quel problème doit-elle résoudre ?", keyPhrase: "La bonne question.", paragraphs: ["Avant", "Avant", "Avant"] },
  }, { id: -71, stableKey: "tyash_v1_submodule_priority", title: "LA PRIORITÉ", position: 2, content_html: "<p>Priorité inchangée.</p>", exercises: [] },
  { id: -75, stableKey: "tyash_v1_submodule_story", title: "CE QU’IL FAUT RACONTER", position: 3, content_html: "<p>Message inchangé.</p>", exercises: [] }];
  return [{ id: -65, stableKey: IMPACT_CONTENT.module.key, title: "TON BESOIN", position: 3, is_published: true,
    content_html: "<p>Le problème à résoudre.</p>", editorRevision: "before", tyashQuestionnaireRevision: "julien-2026-11-04",
    submodules, exercises: structuredClone(questions), answers: { [-69]: ["Je veux faire évoluer notre image."], [-70]: ["Créer une prise de conscience dans mon public."] },
    answerVersions: { [-69]: { updatedAt: 123, revision: 4 }, [-70]: { updatedAt: 456, revision: 2 } },
    progress: { answeredCount: 2, exerciseCount: 2, completionPercent: 100, isCompleted: true },
  }] as unknown as WorkspaceModule[];
}

describe("targeted TYASH impact revision", () => {
  it("changes only the specified identities and introduction, retaining following submodules and all answer metadata", () => {
    const before = fixture(); const unchanged = structuredClone(before);
    const after = reviseImpactContent(before, "revision-impact");
    expect(before).toEqual(unchanged);
    expect(() => assertOnlyImpactChanges(before, after)).not.toThrow();
    expect(after[0].submodules.slice(1)).toEqual(before[0].submodules.slice(1));
    expect(after[0].answers).toEqual(before[0].answers);
    expect(after[0].answerVersions).toEqual(before[0].answerVersions);
    after[0].exercises.forEach((q, index) => expect(sameAnswerLayout(before[0].exercises[index], q)).toBe(true));
    expect(prefillQuestions(after)[0].label).toBe(IMPACT_CONTENT.questions[0].text);
  });
  it("refuses stale or reassigned questions instead of overwriting a later Admin edit", () => {
    const before = fixture(); before[0].submodules[0].exercises[0].question = "Modification manuelle";
    expect(() => reviseImpactContent(before, "next")).toThrow(/already edited/);
    const changedId = fixture(); changedId[0].submodules[0].exercises[0].id = -999;
    expect(() => reviseImpactContent(changedId, "next")).toThrow(/numeric identity/);
  });
  it("keeps future manual Admin wording authoritative in the learner view, summary and notebook", () => {
    const after = reviseImpactContent(fixture(), "next");
    const manual = "Quelle évolution souhaitez-vous observer après la vidéo ?";
    after[0].exercises[1].question = manual; after[0].submodules[0].exercises[1].question = manual;
    const [module] = projectTyashQuestionnaire(after);
    const summary = buildModuleSummaryCard({ module, projectName: "Projet de vérification" });
    expect(summary.title).toBe(IMPACT_CONTENT.module.title);
    expect(summary.submoduleRecaps[0].title).toBe(IMPACT_CONTENT.submodule.title);
    expect(summary.submoduleRecaps[0].highlights[1].label).toBe(manual);
    expect(buildTyashNotebookData(module, summary).sections[0].answers[1].question).toBe(manual);
    expect(module.answers[-70]).toEqual(["Créer une prise de conscience dans mon public."]);
  });
  it("renders the current labels and unchanged answers in both the module PDF and full project PDF", async () => {
    const [module] = projectTyashQuestionnaire(reviseImpactContent(fixture(), "next"));
    const summary = buildModuleSummaryCard({ module, projectName: "Projet de vérification" });
    const shareData = getModuleShareData({ module, summary, brandName: "Projet de vérification" });
    const guide = generateGuideFromAnswers({ project: { id: 99, account_id: 99, name: "Projet de vérification", logo_url: null, created_at: "2026-11-17", updated_at: "2026-11-17" }, modules: [module] });
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    for (const buffer of [await generateModulePdf({ module, summary, shareData }), await renderBrandGuidePdf(guide, { design: "notebook" })]) {
      const task = getDocument({ data: new Uint8Array(buffer) });
      try {
        const pdf = await task.promise; const pages: string[] = [];
        for (let n=1; n<=pdf.numPages; n++) {
          const content = await (await pdf.getPage(n)).getTextContent();
          pages.push(content.items.map(item => "str" in item ? item.str : "").join(" "));
        }
        const text = pages.join(" ").replace(/\s+/g, " ");
        for (const label of [IMPACT_CONTENT.module.title, IMPACT_CONTENT.submodule.title, ...IMPACT_CONTENT.questions.map(q => q.text)]) expect(text).toContain(label);
        expect(text).toContain("Je veux faire évoluer notre image.");
        expect(text).toContain("Créer une prise de conscience dans mon public.");
        expect(text).not.toContain("LE PROBLÈME À RÉSOUDRE");
      } finally { await task.destroy(); }
    }
  }, 20000);
});
