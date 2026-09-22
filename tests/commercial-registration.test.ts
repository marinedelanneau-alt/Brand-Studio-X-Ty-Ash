import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ activation: vi.fn(), account: vi.fn(), terms: vi.fn(), db: vi.fn(), auth: vi.fn(), insert: vi.fn(), attach: vi.fn(), subscription: vi.fn(), consume: vi.fn(), order: vi.fn(), createUser: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: vi.fn() }) }));
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("REDIRECT_SUCCESS"); } }));
vi.mock("@/lib/access-codes", () => ({ findAccountByEmail: mocks.account, insertAccount: mocks.insert, attachAuthUserToAccount: mocks.attach }));
vi.mock("@/lib/activation-codes", () => ({ findUsableActivationCode: mocks.activation, consumeActivationCode: mocks.consume }));
vi.mock("@/lib/subscriptions", () => ({ upsertSubscription: mocks.subscription }));
vi.mock("@/lib/legal", () => ({ getPublishedLegalDocument: mocks.terms }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.db, createSupabaseAuthServerClient: mocks.auth }));
import { registerAccount } from "../app/register-account";
import { BRAND_STUDIO_OFFER } from "../lib/brand-studio-offer";
const submit = () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ registrationToken: "token", email: "test@example.test", password: "password-test", clientName: "Test", companyName: "Studio", acceptedTerms: "on", termsId: "terms" })) form.set(key, value);
  return registerAccount({ status: "idle", message: "" }, form);
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.activation.mockResolvedValue({ id: 1, stripe_checkout_session_id: "cs_test" });
  mocks.account.mockResolvedValueOnce(null).mockResolvedValue({ id: 42 });
  mocks.terms.mockResolvedValue({ id: "terms", document_type: "terms_of_use", version: "v1" });
  mocks.createUser.mockResolvedValue({ data: { user: { id: "auth_new" } }, error: null });
  const query = { select: () => query, eq: () => query, not: () => query, maybeSingle: mocks.order };
  mocks.db.mockReturnValue({ auth: { admin: { createUser: mocks.createUser } }, from: (table: string) => {
    if (table === "commercial_orders_v1") return query;
    if (table === "legal_acceptances") return { insert: async () => ({ error: null }) };
    throw new Error(`Unexpected write: ${table}`);
  } });
  mocks.auth.mockResolvedValue({ auth: { signInWithPassword: async () => ({ error: null }) } });
});
describe("beta registration preservation", () => {
  it("retains the historical registration without legal queries or expiry", async () => {
    await expect(submit()).rejects.toThrow("REDIRECT_SUCCESS");
    expect(mocks.terms).not.toHaveBeenCalled();
    expect(mocks.order).not.toHaveBeenCalled();
    expect(mocks.subscription.mock.calls[0][0]).not.toHaveProperty("currentPeriodEnd");
    expect(mocks.subscription.mock.calls[0][0]).not.toHaveProperty("plan");
  });
  it("cannot downgrade a commercial code into a historical unlimited access", async () => {
    mocks.activation.mockResolvedValue({ id: 1, offer_version: BRAND_STUDIO_OFFER.version, stripe_checkout_session_id: "cs_new" });
    mocks.order.mockResolvedValue({ data: null, error: null });
    expect((await submit()).status).toBe("error");
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.subscription).not.toHaveBeenCalled();
  });
  it("copies the paid expiry instead of recalculating from registration", async () => {
    const expiry = new Date(Date.now() + 86400000).toISOString();
    mocks.activation.mockResolvedValue({ id: 1, offer_version: BRAND_STUDIO_OFFER.version, stripe_checkout_session_id: "cs_new" });
    mocks.order.mockResolvedValue({ data: { expires_at: expiry, offer_version: BRAND_STUDIO_OFFER.version }, error: null });
    await expect(submit()).rejects.toThrow("REDIRECT_SUCCESS");
    expect(mocks.subscription.mock.calls[0][0]).toMatchObject({ plan: BRAND_STUDIO_OFFER.version, currentPeriodEnd: expiry });
  });
  it("does not attach a commercial order to a pre-existing beta account", async () => {
    mocks.account.mockReset().mockResolvedValue({ id: 42 });
    mocks.activation.mockResolvedValue({ id: 1, offer_version: BRAND_STUDIO_OFFER.version });
    expect((await submit()).status).toBe("error");
    expect(mocks.attach).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.subscription).not.toHaveBeenCalled();
  });
});
