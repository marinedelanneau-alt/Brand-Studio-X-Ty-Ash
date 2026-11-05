import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  account: vi.fn(), access: vi.fn(), workspace: vi.fn(), read: vi.fn(), write: vi.fn(),
  remove: vi.fn(), duplicate: vi.fn(), status: vi.fn(), pdf: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getAuthenticatedAccount: mocks.account }));
vi.mock("@/lib/subscriptions", () => ({ hasActiveAccess: mocks.access }));
vi.mock("@/lib/training", () => ({ getWorkspaceData: mocks.workspace }));
vi.mock("@/lib/communication-actions", () => ({
  getCommunicationActions: mocks.read, getSuggestedCommunicationActions: () => [],
  upsertCommunicationAction: mocks.write, deleteCommunicationAction: mocks.remove,
  duplicateCommunicationAction: mocks.duplicate, updateCommunicationActionStatus: mocks.status,
}));
vi.mock("@/lib/communication-action-pdf", () => ({ renderCommunicationActionPdf: mocks.pdf }));
vi.mock("@/app/ui/communication-action-plan", () => ({ default: () => null }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
  redirect: () => { throw new Error("NEXT_REDIRECT"); },
  unstable_rethrow: () => {},
}));

import { communicationActionPlanEnabled } from "../lib/platform-features";
import ActionPlanPage from "../app/mon-espace/plan-action-communication/page";
import { GET } from "../app/mon-espace/plan-action-communication/pdf/route";
import { saveCommunicationAction, removeCommunicationAction, copyCommunicationAction, changeCommunicationActionStatus } from "../app/communication-actions-actions";
import type { CommunicationActionInput } from "../lib/communication-actions";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cplzwnlstcpqqzqeawgs.supabase.co");
  mocks.account.mockResolvedValue({ id: 7, company_name: "Projet test" });
  mocks.access.mockResolvedValue(true);
  mocks.workspace.mockResolvedValue({ project: { id: 42, name: "Projet test" }, modules: [] });
  mocks.read.mockResolvedValue([]);
  mocks.pdf.mockResolvedValue(Buffer.from("%PDF-test"));
});
afterEach(() => vi.unstubAllEnvs());

describe("retired TYASH communication plan", () => {
  it("is unavailable for every TYASH release and for TYASH content in other environments", () => {
    expect(communicationActionPlanEnabled()).toBe(false);
    expect(communicationActionPlanEnabled([{ stableKey: "module_1" }])).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://original-brand-studio.supabase.co");
    expect(communicationActionPlanEnabled()).toBe(true);
    expect(communicationActionPlanEnabled({ stableKey: "tyash_v1_module_test" })).toBe(false);
  });
  it("rejects the old page before authentication, project creation or roadmap reads", async () => {
    await expect(ActionPlanPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.account).not.toHaveBeenCalled();
    expect(mocks.workspace).not.toHaveBeenCalled();
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("returns Gone on the old PDF URL without reading or generating private data", async () => {
    const response = await GET(new NextRequest("https://example.test/mon-espace/plan-action-communication/pdf?year=2026"));
    expect(response.status).toBe(410);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.account).not.toHaveBeenCalled();
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.pdf).not.toHaveBeenCalled();
  });
  it("blocks all writes from an old open tab, including permanent deletion", async () => {
    const results = await Promise.all([
      saveCommunicationAction({} as CommunicationActionInput), removeCommunicationAction("old-action"),
      copyCommunicationAction("old-action"), changeCommunicationActionStatus({ actionId: "old-action", status: "Idée" }),
    ]);
    expect(results.every(r => r.status === "error")).toBe(true);
    for (const fn of [mocks.account, mocks.workspace, mocks.write, mocks.remove, mocks.duplicate, mocks.status]) expect(fn).not.toHaveBeenCalled();
  });
  it("preserves the page and PDF download in original Brand Studio", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://original-brand-studio.supabase.co");
    expect(await ActionPlanPage()).toBeTruthy();
    const response = await GET(new NextRequest("https://example.test/mon-espace/plan-action-communication/pdf?year=2026"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(mocks.read).toHaveBeenCalledWith(42);
    expect(mocks.pdf).toHaveBeenCalledWith({ brandName: "Projet test", actions: [], year: 2026 });
  });
});
