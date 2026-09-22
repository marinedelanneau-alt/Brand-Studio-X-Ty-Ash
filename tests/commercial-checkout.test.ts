import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ account: vi.fn(), existing: vi.fn(), document: vi.fn(), price: vi.fn(), checkout: vi.fn(), insert: vi.fn(), expire: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentAccount: mocks.account }));
vi.mock("@/lib/access-codes", () => ({ findAccountByEmail: mocks.existing }));
vi.mock("@/lib/legal", () => ({ getPublishedLegalDocument: mocks.document }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => ({ prices: { retrieve: mocks.price }, checkout: { sessions: { create: mocks.checkout, expire: mocks.expire } } }) }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ from: () => ({ insert: mocks.insert }) }) }));
import { POST } from "../app/api/stripe/create-brand-studio-order/route";
const request = (body = {}) => new Request("https://studio.example/api/stripe/create-brand-studio-order", { method: "POST", headers: { origin: "https://studio.example", "Content-Type": "application/json" }, body: JSON.stringify({ email: "new@example.test", acceptedTerms: true, immediateAccess: true, termsId: "terms-v1", ...body }) });
beforeEach(() => {
  vi.clearAllMocks();
  for (const [key, value] of Object.entries({ BRAND_STUDIO_LEGAL_RELEASE: "enabled", BRAND_STUDIO_COMMERCIAL_RELEASE: "enabled", BRAND_STUDIO_WITHDRAWAL_MODE: "service_immediate_validated", BRAND_STUDIO_VAT_STATUS: "validated", STRIPE_BRAND_STUDIO_PRICE_ID: "price_test", NEXT_PUBLIC_SITE_URL: "https://studio.example", BRAND_STUDIO_LIVE_PAYMENTS_APPROVED: "" })) vi.stubEnv(key, value);
  mocks.account.mockResolvedValue(null);
  mocks.existing.mockResolvedValue(null);
  mocks.document.mockResolvedValue({ id: "terms-v1", content: [{ id: "1", title: "Conditions", body: "Texte validé" }] });
  mocks.price.mockResolvedValue({ id: "price_test", active: true, type: "one_time", currency: "eur", unit_amount: 28900, livemode: false });
  mocks.checkout.mockResolvedValue({ id: "cs_test", url: "https://checkout.stripe.com/test" });
  mocks.insert.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());
describe("commercial checkout release barriers", () => {
  it.each(["BRAND_STUDIO_LEGAL_RELEASE", "BRAND_STUDIO_COMMERCIAL_RELEASE"])("returns 404 with %s disabled before any remote call", async (flag) => {
    vi.stubEnv(flag, "");
    expect((await POST(request())).status).toBe(404);
    expect(mocks.account).not.toHaveBeenCalled();
    expect(mocks.checkout).not.toHaveBeenCalled();
  });
  it("does not charge an existing beta account, including an anonymous matching email", async () => {
    mocks.existing.mockResolvedValue({ id: 42 });
    expect((await POST(request())).status).toBe(409);
    expect(mocks.checkout).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("requires both explicit consents and the current terms", async () => {
    expect((await POST(request({ immediateAccess: false }))).status).toBe(400);
    expect((await POST(request({ acceptedTerms: false }))).status).toBe(400);
    expect((await POST(request({ termsId: "old" }))).status).toBe(409);
    expect(mocks.checkout).not.toHaveBeenCalled();
  });
  it("blocks incomplete legal documents", async () => {
    mocks.document.mockResolvedValue({ id: "terms-v1", content: [{ id: "1", title: "Vendeur", body: "[ADRESSE À RENSEIGNER]" }] });
    expect((await POST(request())).status).toBe(503);
    expect(mocks.checkout).not.toHaveBeenCalled();
  });
  it("blocks live payments without separate approval", async () => {
    mocks.price.mockResolvedValue({ active: true, type: "one_time", currency: "eur", unit_amount: 28900, livemode: true });
    expect((await POST(request())).status).toBe(503);
    expect(mocks.checkout).not.toHaveBeenCalled();
  });
  it("creates only a pending order and no access or expiry before payment", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.checkout.mock.calls[0][0]).toMatchObject({ mode: "payment", payment_method_types: ["card"], consent_collection: { terms_of_service: "required" } });
    const order = mocks.insert.mock.calls[0][0];
    expect(order).not.toHaveProperty("expires_at");
    expect(order).not.toHaveProperty("paid_at");
    expect(order.account_id).toBeNull();
    expect(order.legal_snapshot).toHaveLength(4);
  });
  it("expires the Stripe session if evidence cannot be stored", async () => {
    mocks.insert.mockResolvedValue({ error: new Error("Database unavailable") });
    expect((await POST(request())).status).toBe(503);
    expect(mocks.expire).toHaveBeenCalledWith("cs_test");
  });
});
