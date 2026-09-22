import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ current: vi.fn(), user: vi.fn(), workspace: vi.fn(), generate: vi.fn(), render: vi.fn(), save: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentAccount: mocks.current }));
vi.mock("@/lib/access-codes", () => ({ findAccountById: mocks.user }));
vi.mock("@/lib/training", () => ({ getWorkspaceData: mocks.workspace }));
vi.mock("@/lib/brand-guide", () => ({ generateGuideFromAnswers: mocks.generate, saveBrandGuideSnapshot: mocks.save }));
vi.mock("@/lib/brand-guide-pdf", () => ({ renderBrandGuidePdf: mocks.render }));
import { GET } from "../app/admin/users/[id]/guide/download/route";
const download = (id = "12") => GET(new Request(`https://studio.example/admin/users/${id}/guide/download`), { params: Promise.resolve({ id }) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.current.mockResolvedValue({ id: 1, role: "admin" });
  mocks.user.mockResolvedValue({ id: 12, company_name: "Marque Été", is_active: true });
  mocks.workspace.mockResolvedValue({ project: { id: 50, account_id: 12, name: "Projet" }, modules: [{ answers: { 123: ["Réponse du participant"] } }] });
  mocks.generate.mockReturnValue({ brandName: "Marque Été" });
  mocks.render.mockResolvedValue(Buffer.from("%PDF-1.7\nfixture"));
});
describe("admin participant guide download", () => {
  it("denies anonymous callers before reading participant data", async () => {
    mocks.current.mockResolvedValue(null);
    expect((await download()).status).toBe(401);
    expect(mocks.user).not.toHaveBeenCalled();
    expect(mocks.workspace).not.toHaveBeenCalled();
  });
  it("denies normal users, including access to their own id", async () => {
    mocks.current.mockResolvedValue({ id: 12, role: "user", is_admin: false });
    expect((await download()).status).toBe(403);
    expect(mocks.user).not.toHaveBeenCalled();
  });
  it("supports the historical is_admin flag", async () => {
    mocks.current.mockResolvedValue({ id: 1, is_admin: true });
    expect((await download()).status).toBe(200);
  });
  it.each(["0", "-1", "abc", "1.5", "1e1", "9007199254740992"])("rejects invalid id %s", async (id) => {
    expect((await download(id)).status).toBe(404);
    expect(mocks.user).not.toHaveBeenCalled();
  });
  it("returns a private PDF generated from the selected user's current answers without saving", async () => {
    const response = await download();
    expect(response.status).toBe(200);
    expect(mocks.user).toHaveBeenCalledWith(12);
    expect(mocks.workspace).toHaveBeenCalledWith(12);
    expect(mocks.generate).toHaveBeenCalledWith({ project: { id: 50, account_id: 12, name: "Projet" }, modules: [{ answers: { 123: ["Réponse du participant"] } }], brandName: "Marque Été" });
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="guide-de-marque-marque-ete-12.pdf"');
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.text()).toContain("%PDF-");
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("supports incomplete or expired participants without changing their access", async () => {
    mocks.user.mockResolvedValue({ id: 12, company_name: null, is_active: false });
    mocks.workspace.mockResolvedValue({ project: { id: 50, name: "Projet" }, modules: [] });
    expect((await download()).status).toBe(200);
    expect(mocks.generate).toHaveBeenCalledWith({ project: { id: 50, name: "Projet" }, modules: [], brandName: "Projet" });
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("returns 404 for a missing participant or an admin workspace", async () => {
    mocks.user.mockResolvedValue(null);
    expect((await download()).status).toBe(404);
    mocks.user.mockResolvedValue({ id: 12, is_admin: true });
    expect((await download()).status).toBe(404);
    expect(mocks.workspace).not.toHaveBeenCalled();
  });
  it("does not create a project when none exists", async () => {
    mocks.workspace.mockResolvedValue({ project: null, modules: [] });
    expect((await download()).status).toBe(404);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("reports PDF errors without exposing internals", async () => {
    mocks.render.mockRejectedValue(new Error("private database details"));
    const response = await download();
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private database details");
  });
});
