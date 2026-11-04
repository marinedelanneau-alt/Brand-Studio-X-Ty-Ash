import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@/lib/session", () => ({ getAuthenticatedAccount: async () => ({ id: 20 }) }));
vi.mock("@/lib/training", () => ({ getWorkspaceData: async () => ({ project: { name: "Client" }, modules: [{ id: -1, exercises: [{ id: -3 }] }] }) }));
vi.mock("@/lib/module-answer-ai", () => ({ supportsModuleAnswerAi: () => true, generateModuleAnswerAssistance: mocks.generate }));
import { requestModuleAnswerAssistance } from "../app/generate-module-answer-assistance";
describe("AI server action error privacy", () => {
  it("does not expose provider errors, variable names or secrets to the client", async () => {
    mocks.generate.mockRejectedValue(new Error("OPENAI_API_KEY sk_private_dummy upstream 401"));
    const result = await requestModuleAnswerAssistance({ moduleId: -1, exerciseId: -3, mode: "suggest", currentAnswers: {} });
    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toMatch(/OPENAI_API_KEY|sk_private_dummy|401/);
    expect(result.message).toContain("Tu peux continuer");
  });
});
