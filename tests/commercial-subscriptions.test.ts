import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ single: vi.fn(), update: vi.fn(), insert: vi.fn(), from: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ from: mocks.from }) }));
import { getSubscriptionAccessStatus, upsertSubscription } from "../lib/subscriptions";
import { getCurrentTermsRequirement } from "../lib/legal";
import { BRAND_STUDIO_OFFER } from "../lib/brand-studio-offer";
beforeEach(() => {
  vi.clearAllMocks();
  const query = { select: () => query, eq: () => query, order: () => query, limit: () => query, maybeSingle: mocks.single, update: mocks.update, insert: mocks.insert };
  mocks.from.mockReturnValue(query);
  mocks.update.mockReturnValue({ eq: async () => ({ error: null }) });
});
describe("subscription storage boundaries", () => {
  it("historical access remains valid with an old period end and does not write", async () => {
    mocks.single.mockResolvedValue({ data: { plan: "brand_studio", status: "paid", access_granted: true, current_period_end: "2000-01-01" }, error: null });
    expect((await getSubscriptionAccessStatus(42)).accessGranted).toBe(true);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("commercial access expires even if the stored access_granted flag is still true", async () => {
    mocks.single.mockResolvedValue({ data: { plan: BRAND_STUDIO_OFFER.version, status: "paid", access_granted: true, current_period_end: "2000-01-01" }, error: null });
    expect((await getSubscriptionAccessStatus(42)).accessGranted).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("old Stripe events cannot overwrite the commercial plan or erase its expiry", async () => {
    mocks.single.mockResolvedValue({ data: { id: 7, plan: BRAND_STUDIO_OFFER.version }, error: null });
    await upsertSubscription({ userId: 42, status: "active", accessGranted: true });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("keeps legacy subscription writes available", async () => {
    mocks.single.mockResolvedValue({ data: { id: 7, plan: "brand_studio" }, error: null });
    await upsertSubscription({ userId: 42, status: "active", accessGranted: true });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ plan: "brand_studio", access_granted: true }));
  });
  it("never imposes newly activated legal enforcement on a beta account", async () => {
    vi.stubEnv("BRAND_STUDIO_LEGAL_RELEASE", "enabled");
    try {
      mocks.single.mockResolvedValue({ data: { plan: "brand_studio" }, error: null });
      expect(await getCurrentTermsRequirement("auth_beta", { id: 42, created_at: "2026-01-01" })).toBeNull();
      expect(mocks.from).toHaveBeenCalledTimes(1);
      expect(mocks.from).toHaveBeenCalledWith("subscriptions");
    } finally { vi.unstubAllEnvs(); }
  });
});
