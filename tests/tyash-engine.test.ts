import { describe, expect, it } from "vitest";
import { encodeTyAshBrowserDraft, decodeTyAshBrowserDraft, resolveTyAshExerciseId, tyAshBrowserKey } from "../lib/tyash-answer-identity";
import { completionOverride, countsTowardsProgress, validateCompletionRequirements } from "../lib/exercise-completion";
import { getSerializedGroupOpenOptions, getSerializedTableOptions, serializeIndexedAnswerItem } from "../lib/exercise-types";
import { allocateReleaseNumericIdentities } from "../lib/release-numeric-identities";
import { getAnswerKey } from "../lib/persistence/types";

const moduleItem = { stableKey: "tyash_v1_test_module", exercises: [{ id: -10, stableKey: "tyash_v1_test_question", position: 1, title: "Before" }] };

describe("Ty Ash identities", () => {
  it("does not restore a historical positional answer", () => {
    expect(resolveTyAshExerciseId(moduleItem, { module_key: "module_position_1", question_key: "module_position_1_exercise_position_1" })).toBeUndefined();
    expect(decodeTyAshBrowserDraft(JSON.stringify({ answers: { 1: ["old"] }, stableKeyVersion: 2 }), moduleItem, 1)).toBeNull();
  });
  it("restores stable answers and survives text edits", () => {
    const payload = encodeTyAshBrowserDraft(moduleItem, 1, { [-10]: ["saved"] }, [-10], 100);
    const edited = { ...moduleItem, exercises: [{ ...moduleItem.exercises[0], title: "After" }] };
    expect(decodeTyAshBrowserDraft(payload, edited, 1)?.answers[-10]).toEqual(["saved"]);
    expect(resolveTyAshExerciseId(edited, { module_key: edited.stableKey, question_key: edited.exercises[0].stableKey })).toBe(-10);
  });
  it("separates projects, modules and new exercise keys with identical positions/IDs", () => {
    const payload = encodeTyAshBrowserDraft(moduleItem, 1, { [-10]: ["saved"] }, [], 100);
    expect(decodeTyAshBrowserDraft(payload, moduleItem, 2)).toBeNull();
    expect(decodeTyAshBrowserDraft(payload, { ...moduleItem, stableKey: "tyash_v1_other_module" }, 1)).toBeNull();
    expect(decodeTyAshBrowserDraft(payload, { ...moduleItem, exercises: [{ ...moduleItem.exercises[0], stableKey: "tyash_v1_new_question" }] }, 1)?.answers).toEqual({});
    expect(tyAshBrowserKey(1, moduleItem)).not.toBe(tyAshBrowserKey(2, moduleItem));
    const scope = { userId: 1, projectId: 1, moduleId: -1, moduleStableKey: moduleItem.stableKey, exerciseKeys: { [-10]: moduleItem.exercises[0].stableKey } };
    expect(getAnswerKey(scope, -10)).not.toBe(getAnswerKey({ ...scope, moduleStableKey: "tyash_v1_other_module" }, -10));
    expect(getAnswerKey({ userId: 1, projectId: 1, moduleId: 1 }, 1)).toBe("1:1:1:1");
  });
});

describe("Completion metadata", () => {
  const open = { type: "open" as const, options: [] };
  it("keeps legacy rules for mandatory filled/empty answers", () => {
    expect(completionOverride(open, [])).toBeUndefined();
    expect(completionOverride(open, ["text"])).toBeUndefined();
    expect(countsTowardsProgress(open)).toBe(true);
    expect(completionOverride({ ...open, completion: { required: true } }, [])).toBeUndefined();
  });
  it("does not penalize optional filled/empty exercises", () => {
    const optional = { ...open, completion: { required: false } };
    expect(countsTowardsProgress(optional)).toBe(false);
    expect(completionOverride(optional, [])).toBe(true);
    expect(completionOverride(optional, ["text"])).toBe(true);
  });
  it("requires only mandatory group fields, using real indexed storage", () => {
    const group = { type: "group_open" as const, options: getSerializedGroupOpenOptions(["First", "Second", "Third"], { columns: 1 }), completion: { optionalFields: [1, 2] } };
    expect(completionOverride(group, [])).toBe(false);
    expect(completionOverride(group, [serializeIndexedAnswerItem(0, 0, "filled")])).toBe(true);
    expect(completionOverride(group, [serializeIndexedAnswerItem(1, 0, "only optional")])).toBe(false);
  });
  it("supports optional table rows and cells", () => {
    const table = { type: "table" as const, options: getSerializedTableOptions({ rows: 2, columns: 2, rowLabels: ["A", "B"], columnLabels: ["C", "D"] }), completion: { optionalRows: [1], optionalCells: [1] } };
    expect(completionOverride(table, ["filled", "", "", ""])).toBe(true);
    expect(completionOverride(table, ["", "filled", "filled", "filled"])).toBe(false);
    expect(completionOverride({ ...table, completion: undefined }, ["filled", "", "", ""])).toBeUndefined();
    expect(() => validateCompletionRequirements({ ...table, completion: { optionalCells: [4] } })).toThrow();
  });
});

describe("Future numeric identity preparation", () => {
  const fresh = () => [{ stableKey: "tyash_v1_test_module", submodules: [{ stableKey: "tyash_v1_test_submodule", exercises: [{ stableKey: "tyash_v1_test_exercise" }] }] }];
  it("reserves old IDs, persists unique new IDs and keeps them through reorder/edit", () => {
    const old = [{ stableKey: "module_old", id: -1, submodules: [] }];
    const allocated = allocateReleaseNumericIdentities(fresh(), [old]);
    expect(allocated[0].id).not.toBe(-1);
    const s = allocated[0].submodules[0];
    expect(new Set([allocated[0].id, s.id, s.exercises[0].id]).size).toBe(3);
    expect(s.exercises[0].module_id).toBe(allocated[0].id);
    expect(allocateReleaseNumericIdentities(allocated, [old, allocated])).toEqual(allocated);
    expect(fresh()[0]).not.toHaveProperty("id");
  });
  it("rejects recycling IDs for a different stable key", () => {
    expect(() => allocateReleaseNumericIdentities([{ ...fresh()[0], id: 93 }], [])).toThrow();
  });
});
