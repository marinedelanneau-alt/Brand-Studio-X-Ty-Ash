import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSerializedGroupOpenOptions, serializeIndexedAnswerItem } from "../lib/exercise-types";

const state = vi.hoisted(() => ({ modules: [] as unknown[], stable: [] as unknown[], rpcRows: [] as Record<string, unknown>[] }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/access-codes", () => ({ findAccountById: async () => ({ id: 1, role: "user" }) }));
vi.mock("@/lib/module-completion-fallback", () => ({ getCompletedModuleIdsFromCookie: async () => [93] }));
vi.mock("@/lib/content-releases", () => ({
  getRequestedPreviewMode: async () => null,
  getAdminPreviewAnswers: async () => ({}),
  resolveActiveContentRelease: async () => ({ source: "controlled", release: { id: "test" }, isPreviewMode: false }),
  getContentReleaseSnapshot: async () => ({ schema_version: 1, modules: state.modules }),
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({
  rpc: async (_name: string, input: { p_rows: Record<string, unknown>[] }) => { state.rpcRows = input.p_rows; return { error: null }; },
  from: (table: string) => {
    const data = table === "user_answers" ? state.stable : table === "project_exercise_answers" ? [{ module_id: 93, exercise_id: 4021, answer_text: "old numeric", updated_at: "2026-01-01" }] : table === "project_module_states" ? [{ module_id: 93, is_completed: true }] : [];
    const query = {
      select: () => query, eq: () => query, order: () => query, limit: () => query,
      returns: async () => ({ data, error: null }),
      maybeSingle: async () => ({ data: table === "brand_projects" ? { id: 1, account_id: 1 } : { guide_snapshot: { version: 1, modules: { "1": { "1:1": ["old backup"] } } } }, error: null }),
    };
    return query;
  },
}) }));

import { getWorkspaceData, getModuleProgress, upsertStableModuleAnswers } from "../lib/training";
import type { BrandModule, ModuleExercise } from "../lib/training-types";

function fixture(key = "tyash_v1_test_question", type = "open", options: string[] = []) {
  return [{ id: 93, stableKey: "tyash_v1_test_module", position: 1, title: "Test", is_published: true, submodules: [{ id: 1002, stableKey: "tyash_v1_test_submodule", position: 1, title: "Test", content_html: "", exercises: [{ id: 4021, stableKey: key, position: 1, type, question: "Test", options }] }] }];
}

beforeEach(() => { state.modules = fixture(); state.stable = []; state.rpcRows = []; });

describe("Actual workspace and saving paths", () => {
  it("rejects positional, numeric, backup and old completion sources even when IDs/positions coincide", async () => {
    state.stable = [{ module_key: "module_position_1", question_key: "module_position_1_submodule_position_1_exercise_position_1", answer_value: ["old"] }];
    const workspace = await getWorkspaceData(1);
    expect(workspace.modules[0].answers[4021] ?? []).toEqual([]);
    expect(workspace.modules[0].progress.completionPercent).toBe(0);
  });
  it("restores an exact stable association through title edits and rejects a different new key", async () => {
    state.stable = [{ module_key: "tyash_v1_test_module", question_key: "tyash_v1_test_question", answer_value: ["saved"], client_updated_at: "2026-01-01", client_revision: 1 }];
    expect((await getWorkspaceData(1)).modules[0].answers[4021]).toEqual(["saved"]);
    const edited = fixture();
    edited[0].submodules[0].exercises[0].question = "Edited text";
    edited[0].title = "Edited title";
    state.modules = edited;
    expect((await getWorkspaceData(1)).modules[0].answers[4021]).toEqual(["saved"]);
    state.stable = [{ module_key: "tyash_v1_other_module", question_key: "tyash_v1_test_question", answer_value: ["other module"] }];
    expect((await getWorkspaceData(1)).modules[0].answers[4021] ?? []).toEqual([]);
    state.modules = fixture("tyash_v1_different_question");
    expect((await getWorkspaceData(1)).modules[0].answers[4021] ?? []).toEqual([]);
  });
  it("saves exact stable keys while preserving historical positional writes", async () => {
    const input = { userId: 1, projectId: 1, moduleId: 93, modulePosition: 1, moduleStableKey: "tyash_v1_test_module", answers: [{ exerciseId: 4021, exercisePosition: 1, submodulePosition: 1, exerciseStableKey: "tyash_v1_test_question", values: ["saved"], clientUpdatedAt: 100 }] };
    await upsertStableModuleAnswers(input);
    expect(state.rpcRows[0].module_key).toBe(input.moduleStableKey);
    expect(state.rpcRows[0].question_key).toBe("tyash_v1_test_question");
    await upsertStableModuleAnswers({ ...input, moduleStableKey: undefined });
    expect(state.rpcRows[0].question_key).toBe("module_position_1_submodule_position_1_exercise_position_1");
  });
  it("counts only required exercises and required group fields on the server", () => {
    const moduleItem = { id: 1, position: 1, stableKey: "tyash_v1_test_module" } as BrandModule;
    const group = { id: 1, type: "group_open", options: getSerializedGroupOpenOptions(["Required", "Optional"], { columns: 1 }), completion: { optionalFields: [1] } } as unknown as ModuleExercise;
    const optional = { id: 2, type: "open", options: [], completion: { required: false } } as unknown as ModuleExercise;
    expect(getModuleProgress(moduleItem, [group, optional], {}, 1, false).completionPercent).toBe(0);
    expect(getModuleProgress(moduleItem, [group, optional], { 1: [serializeIndexedAnswerItem(0, 0, "yes")] }, 1, false).completionPercent).toBe(100);
    expect(getModuleProgress(moduleItem, [optional], {}, 1, false).completionPercent).toBe(100);
    expect(getModuleProgress(moduleItem, [{ ...optional, completion: undefined }], {}, 1, false).completionPercent).toBe(0);
    const required = { ...optional, completion: { required: true } };
    expect(getModuleProgress(moduleItem, [required], {}, 1, true).completionPercent).toBe(0);
    expect(getModuleProgress(moduleItem, [required], { 2: ["filled"] }, 1, false).completionPercent).toBe(100);
  });
});
