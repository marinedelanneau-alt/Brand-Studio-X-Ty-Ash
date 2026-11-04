import { describe, expect, it } from "vitest";
import { activeQuestionnaire, prefillQuestions, retainQuestionnaireHistory } from "../lib/questionnaire-admin";
import { projectTyashQuestionnaire } from "../lib/tyash-questionnaire";
import { assertReleaseAnswerCompatibility } from "../lib/release-content-validation";
import { resolveTyAshExerciseId } from "../lib/tyash-answer-identity";
import type { WorkspaceModule } from "../lib/training-types";

const fixture = () => [{ id: -1, stableKey: "tyash_v1_module", position: 1, title: "Module", tyashQuestionnaireRevision: "julien-2026-11-04", exercises: [], answers: {}, answerVersions: {}, submodules: [{ id: -2, module_id: -1, stableKey: "tyash_v1_submodule", title: "Introduction", content_html: "<p>Texte Admin</p>", position: 1, exercises: [{ id: -3, module_id: -1, submodule_id: -2, stableKey: "tyash_v1_question", position: 1, type: "open", question: "Question Admin", options: [] }] }] }].map(m => ({ ...m, exercises: m.submodules.flatMap(s => s.exercises) })) as unknown as WorkspaceModule[];

describe("Admin as questionnaire source of truth", () => {
  it("uses editable metadata for prefills without a six-question list", () => {
    const modules = fixture();
    expect(prefillQuestions(modules)).toHaveLength(0);
    modules[0].exercises[0].tyashQuestionnaire = { status: "active", prefill: true };
    expect(prefillQuestions(modules)[0].label).toBe("Question Admin");
    modules[0].exercises[0].tyashQuestionnaire.prefill = false;
    expect(prefillQuestions(modules)).toHaveLength(0);
  });
  it("retains removed definitions as archives, matching Admin and preview visibility", () => {
    const previous = fixture()[0]; const next = structuredClone(previous);
    next.submodules[0].exercises = []; next.exercises = [];
    const saved = retainQuestionnaireHistory(previous, next);
    expect(saved.exercises[0].stableKey).toBe(previous.exercises[0].stableKey);
    expect(activeQuestionnaire([saved])[0].exercises).toHaveLength(0);
    expect(projectTyashQuestionnaire([saved])[0].exercises).toHaveLength(0);
    expect(() => assertReleaseAnswerCompatibility([previous], [saved])).not.toThrow();
  });
  it("keeps edited text, choices and introductions exactly as saved", () => {
    const modules = fixture(); const question = modules[0].exercises[0];
    question.type = "multiple"; question.question = "Votre texte librement modifié"; question.options = ["Option Admin", "Autre option"];
    const preview = projectTyashQuestionnaire(modules)[0];
    expect(preview.submodules[0].content_html).toBe("<p>Texte Admin</p>");
    expect(preview.exercises[0].question).toBe(question.question);
    expect(preview.exercises[0].options).toEqual(question.options);
  });
  it("reads an unchanged historical answer namespace after a physical move", () => {
    const module = fixture()[0]; module.exercises[0].answerModuleStableKey = "tyash_v1_original";
    expect(resolveTyAshExerciseId(module, { module_key: "tyash_v1_original", question_key: "tyash_v1_question" })).toBe(-3);
    expect(resolveTyAshExerciseId(module, { module_key: "tyash_v1_unrelated", question_key: "tyash_v1_question" })).toBeUndefined();
  });
});
