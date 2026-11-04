import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import seed from "../content/tyash-v1/pathway.json";
import mapping from "../content/tyash-refonte/question-map.json";
import { prepareTyashQuestionnaireRefonte, projectTyashQuestionnaire, tyashPrefillQuestions, TYASH_QUESTIONNAIRE_REVISION } from "../lib/tyash-questionnaire-refonte";
import { validateReleaseModules, assertReleaseAnswerCompatibility } from "../lib/release-content-validation";
import { applyTyashPrefills } from "../lib/tyash-questionnaire-prefill";
import { buildSpectrumAnswer, parseStoredSpectrumConfig, serializeSpectrumAnswer } from "../lib/spectrum";
import { getModuleProgress } from "../lib/training";
import { buildModuleSummaryCard } from "../lib/module-summary";
import { getClientExerciseGroups } from "../lib/exercise-groups";
import type { WorkspaceModule } from "../lib/training-types";

function source(): WorkspaceModule[] {
  return validateReleaseModules(seed.map((m, mi) => ({ ...m, id: mapping.entries.find(e => e.module === mi + 1)!.moduleId, stableKey: mapping.entries.find(e => e.module === mi + 1)!.moduleKey, submodules: m.submodules.map((s, si) => ({ ...s, id: mapping.entries.find(e => e.module === mi + 1 && e.submodule === si + 1)!.submoduleId, stableKey: mapping.entries.find(e => e.module === mi + 1 && e.submodule === si + 1)!.submoduleKey, exercises: s.exercises.map(e => { const ref = mapping.entries.find(q => q.templateId === e.id)!; return { ...e, id: ref.id, stableKey: ref.stableKey, question: ref.question, exercise_group_id: `tyash_v1_${e.exercise_group_id}` }; }) })) }))) as unknown as WorkspaceModule[];
}
function draft() { return prepareTyashQuestionnaireRefonte(source()).map(m => ({ ...m, answers: {}, answerVersions: {} } as WorkspaceModule)); }
const ref = (id: number) => mapping.entries.find(e => e.templateId === id)!;
const question = (modules: WorkspaceModule[], id: number) => modules.flatMap(m => m.exercises).find(e => e.stableKey === ref(id).stableKey)!;

describe("TYASH questionnaire revision", () => {
  it("retains all 106 identities and compatible answer slots while exposing 54 questions, 6 prefills and 12 sliders", () => {
    const original = source(); const revised = draft();
    expect(() => assertReleaseAnswerCompatibility(original, revised)).not.toThrow();
    expect(revised.flatMap(m => m.exercises)).toHaveLength(106);
    expect(revised.every((m, i) => m.editorRevision && m.editorRevision !== original[i].editorRevision)).toBe(true);
    const visible = projectTyashQuestionnaire(revised);
    expect(visible.flatMap(m => m.exercises)).toHaveLength(54);
    expect(visible.map(m => m.exercises.length)).toEqual([20, 6, 9, 19]);
    expect(visible.map(m => m.submodules.length)).toEqual([5,3,3,3]);
    expect(visible.flatMap(m => m.exercises).filter(e => e.tyashQuestionnaire?.prefill)).toHaveLength(6);
    expect(visible.flatMap(m => m.exercises).filter(e => e.type === "open" && !e.tyashQuestionnaire?.prefill)).toHaveLength(26);
    expect(visible.flatMap(m => m.exercises).filter(e => e.type === "spectrum")).toHaveLength(12);
    expect(projectTyashQuestionnaire(original.map(m => ({ ...m, answers: {}, answerVersions: {} })))).toEqual(original.map(m => ({ ...m, answers: {}, answerVersions: {} })));
  });
  it("keeps the two personality questions on the same screen", () => {
    const m = projectTyashQuestionnaire(draft())[0];
    expect(getClientExerciseGroups(m.exercises).some(g => g.questions.some(e => e.id === ref(1010).id) && g.questions.some(e => e.id === ref(1011).id))).toBe(true);
  });
  it("makes every slider complete without a justification and preserves its historical comment", () => {
    for (const m of projectTyashQuestionnaire(draft())) {
      for (const e of m.exercises.filter(e => e.type === "spectrum")) {
        const config = parseStoredSpectrumConfig(e.options);
        expect(config.enableJustification).toBe(false); expect(config.requireJustification).toBe(false);
        const value = serializeSpectrumAnswer(buildSpectrumAnswer({ config, score: 67, justification: "Historical comment" }));
        expect(getModuleProgress(m, [e], { [e.id]: [value] }, 4, false).completionPercent).toBe(100);
        const summary = buildModuleSummaryCard({ projectName: "Test", module: { ...m, exercises: [e], answers: { [e.id]: [value] } } });
        expect(JSON.stringify(summary)).toContain("67/100"); expect(JSON.stringify(summary)).not.toContain("Historical comment");
      }
    }
  });
  it("moves the call to action with its original answer identity", () => {
    const modules = draft(); const original = modules[3];
    original.answers[ref(1105).id] = ["Nous contacter"];
    original.answerVersions[ref(1105).id] = { updatedAt: 123, revision: 1 };
    const next = projectTyashQuestionnaire(modules);
    expect(next[2].answers[ref(1105).id]).toEqual(["Nous contacter"]);
    expect(question(next, 1105).answerModuleStableKey).toBe(original.stableKey);
    expect(next[3].exercises.some(e => e.id === ref(1105).id)).toBe(false);
  });
  it("combines old merged answers without duplicates and lets a subsequent client correction win", () => {
    const modules = draft();
    modules[3].answers[ref(1086).id] = ["Produit A"];
    modules[3].answerVersions[ref(1086).id] = { updatedAt: 1, revision: 0 };
    modules[3].answers[ref(1087).id] = ["Le geste de fabrication"];
    const next = projectTyashQuestionnaire(modules);
    expect(next[3].answers[ref(1086).id][0]).toContain("Produit A");
    expect(next[3].answers[ref(1086).id][0]).toContain("Le geste de fabrication");
    expect(next[3].exercises.some(e => e.id === ref(1087).id)).toBe(false);
    modules[3].answers[ref(1086).id] = ["Correction client"];
    modules[3].answerVersions[ref(1086).id] = { updatedAt: Date.now() + 1000, revision: 1 };
    expect(projectTyashQuestionnaire(modules)[3].answers[ref(1086).id]).toEqual(["Correction client"]);
    modules[3].answers[ref(1086).id] = [];
    expect(projectTyashQuestionnaire(modules)[3].answers[ref(1086).id]).toEqual([]);
  });
  it("does not require a reference or an explanation when TYASH chooses the direction", () => {
    const modules = projectTyashQuestionnaire(draft());
    expect(question(modules, 1076).options).toHaveLength(1);
    expect(question(modules, 1076).completion?.required).toBe(false);
    expect(question(modules, 1074).completion?.required).toBe(false);
    expect(question(modules, 1075).completion?.required).toBe(false);
    expect(question(modules, 1082).options).not.toContain("Voix off");
    expect(question(modules, 1082).options).not.toContain("Interviews");
    expect(question(modules, 1082).options).toContain("Musique");
  });
  it("applies project-scoped prefills without replacing persisted client corrections or explicit clears", () => {
    const modules = draft(); const q = tyashPrefillQuestions[0];
    const prefills = [{ project_id: 42, module_key: q.moduleKey, question_key: q.stableKey, values: ["Préparé par TYASH"], updated_at: new Date().toISOString() }];
    expect(applyTyashPrefills(modules, prefills)[0].answers[q.id]).toEqual(["Préparé par TYASH"]);
    modules[0].answers[q.id] = ["Correction client"]; modules[0].answerVersions[q.id] = { updatedAt: 123, revision: 1 };
    expect(applyTyashPrefills(modules, prefills)[0].answers[q.id]).toEqual(["Correction client"]);
    modules[0].answers[q.id] = [];
    expect(applyTyashPrefills(modules, prefills)[0].answers[q.id]).toEqual([]);
    expect(applyTyashPrefills(modules, [{ ...prefills[0], module_key: "tyash_v1_other" }])[0].prefilledQuestionKeys).toEqual([]);
  });
  it("uses an explicit revision gate and refuses unrelated identities", () => {
    expect(draft().every(m => m.tyashQuestionnaireRevision === TYASH_QUESTIONNAIRE_REVISION)).toBe(true);
    const modules = source(); modules[0].submodules[0].exercises[0].stableKey = "other_product";
    expect(() => prepareTyashQuestionnaireRefonte(modules)).toThrow();
  });
  it("blocks a partially prepared release and an unknown move destination", () => {
    const partial = draft(); delete partial[2].tyashQuestionnaireRevision;
    expect(() => validateReleaseModules(partial)).toThrow("intégralement");
    const invalid = draft(); question(invalid, 1105).tyashQuestionnaire!.displaySubmoduleKey = "tyash_v1_missing_submodule";
    expect(() => validateReleaseModules(invalid)).toThrow("Destination");
  });
});
