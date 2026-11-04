import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { generateModuleAnswerAssistance } from "../lib/module-answer-ai";
import type { WorkspaceModule } from "../lib/training-types";
const moduleItem = { id: -1, stableKey: "tyash_v1_module", tyashQuestionnaireRevision: "julien-2026-11-04", title: "TON ENTREPRISE", exercises: [{ id: -3, type: "open", options: [], question: "Que fait ton entreprise ?", explanation: "" }], answers: {}, submodules: [] } as unknown as WorkspaceModule;
const input = { module: moduleItem, exercise: moduleItem.exercises[0], mode: "suggest" as const, currentAnswers: {}, workspaceModules: [moduleItem], projectName: "Projet client" };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("TYASH AI assistance without paid calls", () => {
  it("does not disclose the missing environment variable or call OpenAI without a key", async () => {
    vi.stubEnv("OPENAI_API_KEY", ""); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(generateModuleAnswerAssistance(input)).rejects.toThrow("momentanément indisponible");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("guides an unanswered question without inventing company facts", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-unused"); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const result = await generateModuleAnswerAssistance(input);
    expect(result.coachingNote).toContain("Que fait ton entreprise ?");
    expect(result.values).toEqual([]); expect(fetchMock).not.toHaveBeenCalled();
  });
  it("uses the displayed question and a grounded tutoiement prompt with a server bearer key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-secret");
    const fetchMock = vi.fn(async (url: string) => url.includes("embeddings") ? new Response(JSON.stringify({ data: [{ embedding: [1,0] }] })) : new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ overview: "Tu peux préciser ton activité.", questions: [{ questionIndex: 0, values: ["Nous fabriquons des objets."] }] }) } }] })));
    vi.stubGlobal("fetch", fetchMock);
    const result = await generateModuleAnswerAssistance({ ...input, currentAnswers: { [-3]: ["Nous fabriquons des objets."] } });
    const call = fetchMock.mock.calls.find(([url]) => url.includes("chat/completions")) as unknown as [string, RequestInit] | undefined;
    expect(call).toBeDefined();
    const payload = JSON.parse(String(call![1].body));
    expect(payload.messages[0].content).toContain("N’invente aucun fait");
    expect(payload.messages[0].content).toContain("tutoie-le");
    expect(payload.messages.at(-1).content).toContain("Que fait ton entreprise ?");
    expect(JSON.stringify(result)).not.toContain("test-only-secret");
  });
});
