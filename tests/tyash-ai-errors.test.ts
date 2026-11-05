import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ generate: vi.fn(), account: vi.fn(), workspace: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@/lib/session", () => ({ getAuthenticatedAccount: mocks.account }));
vi.mock("@/lib/training", () => ({ getWorkspaceData: mocks.workspace }));
vi.mock("@/lib/module-answer-ai", () => ({ supportsModuleAnswerAi: () => true, generateModuleAnswerAssistance: mocks.generate }));
import { requestModuleAnswerAssistance } from "../app/generate-module-answer-assistance";
afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });
describe("AI server action error privacy", () => {
  it("does not expose provider errors, variable names or secrets to the client", async () => {
    mocks.account.mockResolvedValue({ id: 20 });
    mocks.workspace.mockResolvedValue({ project: { name: "Client" }, modules: [{ id: -1, exercises: [{ id: -3 }] }] });
    mocks.generate.mockRejectedValue(new Error("OPENAI_API_KEY sk_private_dummy upstream 401"));
    const result = await requestModuleAnswerAssistance({ moduleId: -1, exerciseId: -3, mode: "suggest", currentAnswers: {} });
    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toMatch(/OPENAI_API_KEY|sk_private_dummy|401/);
    expect(result.message).toContain("Tu peux continuer");
  });
  it("blocks stale TYASH UI requests before authentication, workspace reads or generation", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cplzwnlstcpqqzqeawgs.supabase.co");
    const result = await requestModuleAnswerAssistance({ moduleId: -1, exerciseId: -3, mode: "improve", currentAnswers: {} });
    expect(result).toMatchObject({ status: "error", values: [] });
    expect(mocks.account).not.toHaveBeenCalled(); expect(mocks.workspace).not.toHaveBeenCalled(); expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("also blocks TYASH stable content independently of the deployment environment", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://original.supabase.co");
    mocks.account.mockResolvedValue({ id: 20 });
    mocks.workspace.mockResolvedValue({ project: { name: "Client" }, modules: [{ id: -1, stableKey: "tyash_v1_module", exercises: [{ id: -3 }] }] });
    expect((await requestModuleAnswerAssistance({ moduleId: -1, exerciseId: -3, mode: "suggest", currentAnswers: {} })).status).toBe("error");
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});
