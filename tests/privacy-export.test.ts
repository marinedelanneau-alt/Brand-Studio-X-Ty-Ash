import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ account: vi.fn(), workspace: vi.fn(), eq: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentAccount: mocks.account }));
vi.mock("@/lib/training", () => ({ getWorkspaceData: mocks.workspace }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ from: () => ({ select: () => ({ eq: mocks.eq }) }) }) }));
import { GET } from "../app/api/privacy/export/route";
describe("privacy export isolation", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("BRAND_STUDIO_LEGAL_RELEASE", "enabled"); });
  afterEach(() => vi.unstubAllEnvs());
  it("does not access data before explicit activation", async () => {
    vi.stubEnv("BRAND_STUDIO_LEGAL_RELEASE", "");
    expect((await GET()).status).toBe(404);
    expect(mocks.account).not.toHaveBeenCalled();
  });
  it("rejects anonymous access before querying account data", async () => {
    mocks.account.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(mocks.workspace).not.toHaveBeenCalled();
    expect(mocks.eq).not.toHaveBeenCalled();
  });
  it("scopes queries to the session and never exports access credentials", async () => {
    mocks.account.mockResolvedValue({ id: 42, email: "user@example.test", code: "SECRET", auth_user_id: "AUTH_ID", client_name: "Test", company_name: "Studio", created_at: "2026-01-01" });
    mocks.workspace.mockResolvedValue({ project: { name: "Projet" }, modules: [{ title: "Mission", exercises: [{ id: 1, question: "Ma mission" }], answers: { 1: ["Aider"] } }] });
    mocks.eq.mockResolvedValue({ data: [], error: null });
    const response = await GET();
    expect(mocks.workspace).toHaveBeenCalledWith(42);
    expect(mocks.eq).toHaveBeenCalledWith("account_id", 42);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    const body = await response.text();
    expect(body).toContain("Aider");
    expect(body).not.toContain("SECRET");
    expect(body).not.toContain("AUTH_ID");
  });
});
