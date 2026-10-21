import { describe, expect, it } from "vitest";
import { clientOptionAnswerLabel, formalizeClientCopy, withFormalClientCopy } from "../lib/client-copy";
import { buildModuleSummaryCard } from "../lib/module-summary";
import type { ModuleExercise, WorkspaceModule } from "../lib/training-types";
import { getDefaultSmartFeedbackConfig } from "../lib/smart-feedback";

function fixture(): WorkspaceModule {
  const exercise: ModuleExercise = {
    id: -3, stableKey: "tyash_v1_question_fixture", module_id: -1, submodule_id: -2,
    position: 1, type: "multiple", question: "Que fait ton entreprise ?",
    explanation: "<h3>Présente ton entreprise</h3><p>Présente-nous ton entreprise simplement.</p>",
    answer_placeholder: "Décris-nous une seule personne ou catégorie de personnes.",
    options: ["fait comprendre clairement ton activité ;", "Je ne sais pas"],
    audio_url: null, audio_transcript: null, exercise_group_id: "tyash_v1_group_fixture",
    feedback_config: { ...getDefaultSmartFeedbackConfig(), enabled: true,
      neutralMessage: "Bonne base. Tu peux préciser davantage pour rendre la réponse plus exploitable.",
      rules: [{ id: "original-rule", condition: "length_less_than", value: 80, level: "improve", message: "Ta réponse est encore courte. Tu peux préciser qui tu aides, ce que tu apportes et comment." }],
    },
  };
  return {
    id: -1, stableKey: "tyash_v1_module_fixture", title: "TON ENTREPRISE", position: 1,
    video_url: "", audio_url: null, audio_transcript: null, content_html: "", is_published: true, created_at: "", updated_at: "",
    submodules: [{ id: -2, stableKey: "tyash_v1_submodule_fixture", module_id: -1, title: "TON HISTOIRE", position: 1,
      content_html: "<p>Quel a été le tien ?</p>", video_url: "", audio_url: null, audio_transcript: null, created_at: "", updated_at: "", exercises: [exercise] }],
    exercises: [exercise], answers: { [-3]: ["fait comprendre clairement ton activité ;", "TON HISTOIRE"] },
    answerVersions: { [-3]: { revision: 9, updatedAt: 12345 } },
    progress: { answeredCount: 1, exerciseCount: 1, isCompleted: true, isUnlocked: true, completionPercent: 100 },
  };
}

describe("formal French client presentation without changing stored identities or responses", () => {
  it("formalizes module, submodule, question, explanation, placeholder and feedback", () => {
    const result = withFormalClientCopy(fixture());
    expect(result.title).toBe("VOTRE ENTREPRISE");
    expect(result.submodules[0].title).toBe("VOTRE HISTOIRE");
    expect(result.submodules[0].content_html).toBe("<p>Quel a été le vôtre ?</p>");
    expect(result.exercises[0]).toMatchObject({ question: "Que fait votre entreprise ?", answer_placeholder: "Décrivez-nous une seule personne ou catégorie de personnes." });
    expect(result.exercises[0].explanation).toBe("<h3>Présentez votre entreprise</h3><p>Présentez-nous votre entreprise simplement.</p>");
    expect(result.exercises[0].feedback_config?.neutralMessage).toContain("Vous pouvez");
    expect(result.exercises[0].feedback_config?.rules[0]).toMatchObject({ id: "original-rule", value: 80, message: "Votre réponse est encore courte. Vous pouvez préciser qui vous aidez, ce que vous apportez et comment." });
  });
  it("retains raw option values and all selected answers, including older informal text", () => {
    const original = fixture(); const serialized = JSON.stringify(original); const result = withFormalClientCopy(original);
    expect(JSON.stringify(original)).toBe(serialized);
    expect(result.answers).toBe(original.answers);
    expect(result.answerVersions).toBe(original.answerVersions);
    expect(result.progress).toBe(original.progress);
    expect(result.exercises[0].options).toBe(original.exercises[0].options);
    expect(result.submodules[0].exercises[0].options).toBe(original.submodules[0].exercises[0].options);
    expect(formalizeClientCopy(result.exercises[0].options[0])).toBe("fait comprendre clairement votre activité ;");
    expect(result.answers[-3]).toEqual(original.answers[-3]);
  });
  it("retains module, submodule, question and group identities and ordering", () => {
    const original = fixture(); const result = withFormalClientCopy(original);
    for (const key of ["id", "stableKey", "position"] as const) {
      expect(result[key]).toBe(original[key]);
      expect(result.submodules[0][key]).toBe(original.submodules[0][key]);
      expect(result.exercises[0][key]).toBe(original.exercises[0][key]);
    }
    expect(result.exercises[0].exercise_group_id).toBe(original.exercises[0].exercise_group_id);
  });
  it("formalizes predefined answer labels in summaries without rewriting free text", () => {
    const original = fixture();
    const exercise = original.exercises[0];
    const value = exercise.options[0];
    expect(clientOptionAnswerLabel(exercise, value)).toBe("fait comprendre clairement votre activité ;");
    expect(clientOptionAnswerLabel({ ...exercise, type: "open" }, value)).toBe(value);
    expect(clientOptionAnswerLabel(exercise, "TON HISTOIRE")).toBe("TON HISTOIRE");
    const summary = buildModuleSummaryCard({ module: withFormalClientCopy(original), projectName: "Mon projet" });
    expect(summary.highlights[0].value).toContain("votre activité");
    expect(original.answers[-3][0]).toBe(value);
  });
  it("preserves HTML attributes, named entities and the noun ton", () => {
    const html = '<p data-source="TON HISTOIRE">Quels produits ou services proposes-tu aujourd&#x27;hui ?</p>';
    expect(formalizeClientCopy(html)).toBe('<p data-source="TON HISTOIRE">Quels produits ou services proposez-vous aujourd&#x27;hui ?</p>');
    expect(formalizeClientCopy("Le ton de voix et votre ton de marque donnent le ton.")).toBe("Le ton de voix et votre ton de marque donnent le ton.");
  });
  it("does not repeatedly rewrite already formal copy or first-person answer prompts", () => {
    const formal = "VOTRE ENTREPRISE — Que fait votre entreprise ? Je ne sais pas";
    expect(formalizeClientCopy(formal)).toBe(formal);
    const once = withFormalClientCopy(fixture());
    expect(withFormalClientCopy(once)).toEqual(once);
  });
  it("leaves historical non-Ty-Ash source modules untouched", () => {
    const original = fixture(); original.stableKey = "module_1";
    expect(withFormalClientCopy(original)).toBe(original);
  });
});
