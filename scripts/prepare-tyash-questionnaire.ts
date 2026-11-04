import fs from "node:fs";
import { prepareTyashQuestionnaireRefonte, projectTyashQuestionnaire, TYASH_REMOVED_IDS, TYASH_MERGES } from "../lib/tyash-questionnaire-refonte";
import { validateReleaseModules, assertReleaseAnswerCompatibility } from "../lib/release-content-validation";
import type { WorkspaceModule } from "../lib/training-types";
import { getClientExerciseGroups } from "../lib/exercise-groups";

const source = JSON.parse(fs.readFileSync(".runtime/questionnaire-refonte/source.json", "utf8"));
const original = validateReleaseModules(source.modules) as unknown as WorkspaceModule[];
const draft = prepareTyashQuestionnaireRefonte(original);
validateReleaseModules(draft);
assertReleaseAnswerCompatibility(original, draft);
const visible = projectTyashQuestionnaire(draft.map(m => ({ ...m, answers: {}, answerVersions: {} })));
const questions = visible.flatMap(m => m.exercises);
const report = {
  sourceReleaseId: source.release_id, before: original.flatMap(m => m.exercises).length,
  after: questions.length, archived: TYASH_REMOVED_IDS.length, merged: Object.values(TYASH_MERGES).flat().length,
  prefilled: questions.filter(e => e.tyashQuestionnaire?.prefill).length,
  clientOpenAnswers: questions.filter(e => e.type === "open" && !e.tyashQuestionnaire?.prefill).length,
  referenceGroups: questions.filter(e => e.type === "group_open").length,
  sliders: questions.filter(e => e.type === "spectrum").length,
  beforeScreens: new Set(original.flatMap(m => m.exercises).map(e => e.exercise_group_id)).size,
  afterScreens: new Set(questions.map(e => e.exercise_group_id)).size,
  actualBeforeScreens: original.flatMap(m => m.submodules).reduce((n, s) => n + getClientExerciseGroups(s.exercises).length, 0),
  actualAfterScreens: visible.flatMap(m => m.submodules).reduce((n, s) => n + getClientExerciseGroups(s.exercises).length, 0),
  modules: visible.map(m => ({ title: m.title, questions: m.exercises.length, submodules: m.submodules.length })),
  remoteWrites: false, published: false,
};
fs.writeFileSync(".runtime/questionnaire-refonte/draft.json", JSON.stringify({ ...source, modules: draft }, null, 2));
fs.writeFileSync(".runtime/questionnaire-refonte/report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
