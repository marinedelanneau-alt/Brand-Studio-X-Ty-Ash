import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { generateModuleAnswerAssistance, supportsModuleAnswerAi } from "../lib/module-answer-ai";
import { answerAssistanceEnabled } from "../lib/platform-features";
import type { WorkspaceModule } from "../lib/training-types";
const moduleItem = { id: -1, stableKey: "tyash_v1_module", tyashQuestionnaireRevision: "julien-2026-11-04", title: "TON ENTREPRISE", exercises: [{ id: -3, type: "open", options: [], question: "Que fait ton entreprise ?", explanation: "" }], answers: {}, submodules: [] } as unknown as WorkspaceModule;
const input = { module: moduleItem, exercise: moduleItem.exercises[0], mode: "suggest" as const, currentAnswers: {}, workspaceModules: [moduleItem], projectName: "Projet client" };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("retired TYASH AI assistance", () => {
  it("blocks direct TYASH calls before accessing a provider, even with a configured key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-unused"); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const before = structuredClone(input);
    for (const mode of ["suggest", "improve"] as const) await expect(generateModuleAnswerAssistance({ ...input, mode })).rejects.toThrow("n’est plus proposée");
    expect(fetchMock).not.toHaveBeenCalled(); expect(input).toEqual(before);
  });
  it("disables every exercise format in the TYASH platform, including content without stable keys", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cplzwnlstcpqqzqeawgs.supabase.co");
    for (const type of ["open", "prompt_open", "group_open", "checklist", "fill_blank", "table"] as const) {
      expect(answerAssistanceEnabled()).toBe(false);
      expect(supportsModuleAnswerAi({ ...input.exercise, type })).toBe(false);
    }
  });
  it("preserves existing provider behavior for original Brand Studio", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://original.supabase.co");
    vi.stubEnv("OPENAI_API_KEY", "test-only-secret");
    const fetchMock = vi.fn(async (url: string) => url.includes("embeddings") ? new Response(JSON.stringify({ data: [{ embedding: [1,0] }] })) : new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ overview: "Tu peux préciser ton activité.", questions: [{ questionIndex: 0, values: ["Nous fabriquons des objets."] }] }) } }] })));
    vi.stubGlobal("fetch", fetchMock);
    const original = { ...moduleItem, stableKey: "original_module", tyashQuestionnaireRevision: undefined };
    const result = await generateModuleAnswerAssistance({ ...input, module: original, workspaceModules: [original], currentAnswers: { [-3]: ["Nous fabriquons des objets."] } });
    const call = fetchMock.mock.calls.find(([url]) => url.includes("chat/completions")) as unknown as [string, RequestInit] | undefined;
    expect(call).toBeDefined();
    const payload = JSON.parse(String(call![1].body));
    expect(payload.messages[0].content).toContain("Vouvoyez systématiquement");
    expect(payload.messages.at(-1).content).toContain("Que fait ton entreprise ?");
    expect(JSON.stringify(result)).not.toContain("test-only-secret");
  });
});
