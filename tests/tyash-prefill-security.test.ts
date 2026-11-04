import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ reader: vi.fn(), project: vi.fn(), upsert: vi.fn(), revalidate: vi.fn(), createProject: vi.fn() }));
vi.mock("@/lib/content-releases", () => ({ getApplicationReleaseState: async () => ({ current_draft_release_id: "draft" }), getContentReleaseSnapshot: async () => ({ modules: [{ stableKey: "tyash_v1_module", submodules: [{ exercises: tyashPrefillQuestions.map(q => ({ ...q, question: q.label, tyashQuestionnaire: { status: "active", prefill: true } })) }] }] }) }));
vi.mock("@/lib/session", () => ({ getAuthenticatedClientReader: mocks.reader }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/training", () => ({ createProjectForAccount: mocks.createProject }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ from: (table: string) => table === "brand_projects" ? { select: () => ({ eq: () => ({ maybeSingle: mocks.project }) }) } : { upsert: mocks.upsert } }) }));
import { saveTyashQuestionnairePrefill } from "../app/admin/clients/prepare/[id]/actions";
import { tyashPrefillQuestions } from "../lib/tyash-questionnaire-refonte";
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cplzwnlstcpqqzqeawgs.supabase.co");
  mocks.reader.mockResolvedValue({ id: 10, is_active: true, can_view_clients: true });
  mocks.project.mockResolvedValue({ data: { id: 42, account_id: 20 }, error: null });
  mocks.upsert.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());
const form = () => { const f = new FormData(); f.set("accountId", "20"); f.set("projectId", "999"); for (const q of tyashPrefillQuestions) { f.set(`present:${q.stableKey}`, "1"); f.set(q.stableKey, "Préparé par TYASH"); } return f; };
describe("TYASH prefill security", () => {
  it("limits the existing client reader to six baseline fields in the server-resolved project, never user_answers", async () => {
    const result = await saveTyashQuestionnairePrefill({ message: "" }, form());
    expect(result.message).toContain("enregistré");
    const rows = mocks.upsert.mock.calls[0][0]; expect(rows).toHaveLength(6);
    expect(rows.every((r: { project_id: number; updated_by: number }) => r.project_id === 42 && r.updated_by === 10)).toBe(true);
    expect(mocks.createProject).not.toHaveBeenCalled();
  });
  it("rejects a normal client without any write", async () => {
    mocks.reader.mockResolvedValue({ id: 20, is_active: true, role: "user" });
    await expect(saveTyashQuestionnairePrefill({ message: "" }, form())).rejects.toThrow("Accès refusé");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("rejects the principal Brand Studio environment", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://another-project.supabase.co");
    await expect(saveTyashQuestionnairePrefill({ message: "" }, form())).rejects.toThrow("TYASH");
    expect(mocks.project).not.toHaveBeenCalled();
  });
  it("does not trust a project owned by a different account", async () => {
    mocks.project.mockResolvedValue({ data: { id: 999, account_id: 30 }, error: null });
    await saveTyashQuestionnairePrefill({ message: "" }, form());
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("reports a missing migration without claiming success", async () => {
    mocks.upsert.mockResolvedValue({ error: { code: "PGRST205" } });
    expect((await saveTyashQuestionnairePrefill({ message: "" }, form())).message).toContain("migration");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
