import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
import { generateBrandGuide } from "../lib/brand-guide";
import { createBrandGuideData } from "../lib/brand-guide-pdf-data";
import { serializeIndexedAnswerItem, serializeChecklistEntries } from "../lib/exercise-types";
import { getDefaultBrandPersonaConfig, getBrandPersonaFields } from "../lib/brand-persona";
import type { BrandProject, ModuleExercise, WorkspaceModule } from "../lib/training-types";

function generate(rows: Array<{ label: string; answer: string[]; type?: ModuleExercise["type"]; options?: string[] }>) {
  const exercises = rows.map((row, id) => ({ id, module_id: 1, position: id, type: row.type ?? "open", question: row.label, options: row.options ?? [] }) as ModuleExercise);
  const workspaceModule = { title: "Vision & marque — Personnalité & ton — Baseline", position: 1, exercises, answers: Object.fromEntries(rows.map((row, id) => [id, row.answer])) } as unknown as WorkspaceModule;
  return generateBrandGuide({ project: { name: "Test" } as BrandProject, modules: [workspaceModule] });
}

describe("guide answer mapping", () => {
  it.each(["Mots à ne pas utiliser", "Quels mots ne veux-tu jamais utiliser ?", "Mots à écarter", "Vocabulaire interdit", "Quels adjectifs ne doivent pas représenter ta marque ?"])("keeps excluded language out of the positive column: %s", (label) => {
    const guide = generate([
      { label, answer: ["Hautaine, Coincée, Pas adaptable, Chère"] },
      { label: "Mots à privilégier", answer: ["Accessible, Libre"] },
    ]);
    const pdf = createBrandGuideData(guide);
    expect(pdf.language).toEqual({ use: ["Accessible", "Libre"], avoid: ["Hautaine", "Coincée", "Pas adaptable", "Chère"] });
    expect(pdf.summary.find((field) => field.label === "Mots-clés")?.value).toBe("Accessible · Libre");
  });

  it("keeps the positive column empty when only exclusions were answered", () => {
    const guide = generate([{ label: "Mots à ne pas utiliser", answer: ["Hautaine"] }]);
    expect(createBrandGuideData(guide).language).toEqual({ use: [], avoid: ["Hautaine"] });
    expect(guide.personality.traits).toEqual([]);
  });

  it("only transcribes checked vocabulary, including when nothing is checked", () => {
    const guide = generate([
      { label: "Mots à utiliser", type: "checklist", answer: serializeChecklistEntries([{ label: "Clair", checked: false }]) },
      { label: "Mots à ne pas utiliser", type: "checklist", answer: serializeChecklistEntries([{ label: "Hautaine", checked: true }, { label: "Libre", checked: false }]) },
    ]);
    expect(createBrandGuideData(guide).language).toEqual({ use: [], avoid: ["Hautaine"] });
  });

  it("separates positive and negative language within grouped questions", () => {
    const guide = generate([{ label: "Ton vocabulaire", type: "group_open", options: ["__question_item__:Mots à ne pas utiliser", "__question_item__:Mots à utiliser"], answer: [serializeIndexedAnswerItem(0, 0, "Hautaine"), serializeIndexedAnswerItem(1, 0, "Accessible")] }]);
    expect(createBrandGuideData(guide).language).toEqual({ use: ["Accessible"], avoid: ["Hautaine"] });
  });

  it("does not guess the direction of a combined language question", () => {
    const guide = generate([{ label: "Mots à utiliser et à éviter", answer: ["Hautaine, Libre"] }]);
    expect(createBrandGuideData(guide).language).toEqual({ use: [], avoid: [] });
  });

  it("uses the final persona and does not replace missing traits with invented traits", () => {
    const fields = getBrandPersonaFields(getDefaultBrandPersonaConfig());
    const guide = generate([{ label: "Persona", type: "brand_persona", answer: [serializeIndexedAnswerItem(fields.findIndex((field) => field.id === "persona_summary_sentence"), 0, "Portrait initial"), serializeIndexedAnswerItem(fields.findIndex((field) => field.id === "final_summary_sentence"), 0, "Portrait final")] }]);
    expect(guide.personality.persona).toBe("Portrait final");
    expect(guide.personality.traits).toEqual([]);
  });

  it("does not promote rejected traits or baseline variants to final answers", () => {
    const guide = generate([{ label: "Traits de personnalité à éviter", answer: ["Hautaine"] }, { label: "Variantes de baseline", answer: ["Une piste"] }]);
    expect(guide.personality.traits).toEqual([]);
    expect(guide.baseline).toContain("à compléter");
    expect(guide.baselineSection.variants).toEqual(["Une piste"]);
  });
  it("keeps each field attached to its question, including the PDF", () => {
    const guide = generate([
      { label: "Ton activité", answer: ["Animation et coaching"] },
      { label: "Mes offres sont-elles alignées avec mes missions ?", answer: ["Je pense que mes offres sont alignées avec mes missions"], type: "checklist" },
      { label: "Ta mission finale", answer: ["Accompagner la prise de parole"], type: "prompt_open" },
      { label: "Ta vision", answer: ["Une parole accessible à tous"] },
      { label: "Ta raison d’être", answer: ["Donner confiance"] },
      { label: "Ta promesse", answer: ["Une parole affirmée"], type: "prompt_open" },
      { label: "Ton positionnement", answer: ["Le coaching des orateurs"], type: "prompt_open" },
      { label: "Ta baseline finale", answer: ["Osez parler"], type: "prompt_open" },
      { label: "Ton de voix", answer: ["Chaleureux"] },
      { label: "Traits dominants", answer: ["Clair, Accessible"] },
      { label: "Contexte client", answer: ["Première conférence"] },
      { label: "Cible", answer: ["Les orateurs"] },
      { label: "Problème client", answer: ["Le trac"] },
      { label: "Différenciation", answer: ["La pratique"] },
      { label: "Concurrents", answer: ["Les écoles"] },
      { label: "Mots à utiliser", answer: ["Confiance"] },
      { label: "Mots à éviter", answer: ["Échec"] },
      { label: "Ambiance", answer: ["Lumineuse"] },
      { label: "Supports", answer: ["Affiches"] },
    ]);
    expect(guide.dna).toMatchObject({ activity: "Animation et coaching", mission: "Accompagner la prise de parole", vision: "Une parole accessible à tous", essence: "Donner confiance", promise: "Une parole affirmée" });
    expect(guide.positioning).toMatchObject({ finalPositioning: "Le coaching des orateurs", context: "Première conférence", target: "Les orateurs", problem: "Le trac", differentiation: "La pratique", competitors: "Les écoles" });
    expect(guide.personality).toMatchObject({ tone: "Chaleureux", traits: ["Clair", "Accessible"], wordsToUse: ["Confiance"], wordsToAvoid: ["Échec"] });
    expect(guide.baselineSection).toMatchObject({ final: "Osez parler", variants: [] });
    expect(guide.visualUniverse).toMatchObject({ ambiance: "Lumineuse", prioritySupports: ["Affiches"] });
    const pdf = createBrandGuideData(guide);
    expect(pdf.foundations).toContainEqual({ label: "Vision", value: guide.dna.vision });
    expect(JSON.stringify(pdf)).not.toContain("Je pense que mes offres");
  });

  it("does not fill missing sections from the module title or possessive ton", () => {
    const guide = generate([{ label: "Ton activité", answer: ["Coaching"] }]);
    expect(guide.dna.vision).toContain("à compléter");
    expect(guide.personality.tone).toContain("à compléter");
    expect(guide.baseline).toContain("à compléter");
  });

  it("separates indexed answers and preserves empty question positions", () => {
    const guide = generate([{ label: "Vision et mission", type: "group_open", options: ["__question_item__:Ta mission", "__question_item__:Ta vision", "__question_item__:Ton activité"], answer: [serializeIndexedAnswerItem(2, 0, "Coaching"), serializeIndexedAnswerItem(0, 0, "Accompagner")] }]);
    expect(guide.dna.mission).toBe("Accompagner");
    expect(guide.dna.activity).toBe("Coaching");
    expect(guide.dna.vision).toContain("à compléter");
  });

  it("prefers final formulations over preparatory answers", () => {
    const guide = generate([{ label: "Comment imagines-tu ta mission ?", answer: ["Brouillon"] }, { label: "Ta mission finale", type: "prompt_open", answer: ["Mission validée"] }]);
    expect(guide.dna.mission).toBe("Mission validée");
  });
});
