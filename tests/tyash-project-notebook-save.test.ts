import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ save: vi.fn(), account: vi.fn(), workspace: vi.fn(), access: vi.fn(), release: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/session", () => ({ getAuthenticatedAccount: mocks.account }));
vi.mock("@/lib/subscriptions", () => ({ hasActiveAccess: mocks.access }));
vi.mock("@/lib/training", () => ({ getWorkspaceData: mocks.workspace }));
vi.mock("@/lib/content-releases", () => ({ getRequestedPreviewMode: vi.fn(), resolveActiveContentRelease: mocks.release }));
vi.mock("@/lib/brand-guide", async importOriginal => ({ ...await importOriginal<typeof import("../lib/brand-guide")>(), saveBrandGuideSnapshot: mocks.save }));
import { saveBrandGuideExport } from "../app/brand-guide/actions";
import { makeGuide } from "./fixtures/brand-guide";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.account.mockResolvedValue({ id: 12, company_name: "Projet actuel" });
  mocks.access.mockResolvedValue(true); mocks.release.mockResolvedValue({ isPreviewMode: false });
  const exercise = { id: 1, module_id: 1, submodule_id: 1, type: "open", question: "Question publiée", position: 1, options: [] };
  mocks.workspace.mockResolvedValue({ project: { id: 50, name: "Projet actuel" }, modules: [{
    id: 1, stableKey: "tyash_v1_module_1", title: "Module publié", position: 1, is_published: true,
    exercises: [exercise], submodules: [{ id: 1, title: "Sous-module publié", position: 1, exercises: [exercise] }],
    answers: { 1: ["Réponse actuelle du serveur"] }, progress: { answeredCount: 1, exerciseCount: 1, completionPercent: 100 },
  }] });
});

describe("TYASH notebook refresh", () => {
  it("saves the authenticated project's current data rather than a stale browser guide", async () => {
    const stale = makeGuide();
    expect((await saveBrandGuideExport(stale)).status).toBe("success");
    const saved = mocks.save.mock.calls[0][0];
    expect(saved.projectId).toBe(50);
    expect(saved.guide.brandName).toBe("Projet actuel");
    expect(saved.guide.projectNotebook.modules[0].sections[0].answers[0].value).toBe("Réponse actuelle du serveur");
    expect(saved.guide.dna.mission).toBe("");
    expect(stale.dna.mission).not.toBe("");
  });
  it("keeps Admin preview read-only and preserves the existing access check", async () => {
    mocks.release.mockResolvedValue({ isPreviewMode: true });
    expect((await saveBrandGuideExport(makeGuide())).status).toBe("success");
    expect(mocks.save).not.toHaveBeenCalled();
    mocks.access.mockResolvedValue(false);
    expect((await saveBrandGuideExport(makeGuide())).status).toBe("error");
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
