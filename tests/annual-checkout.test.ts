import { beforeEach, afterEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ account: vi.fn(), user: vi.fn(), access: vi.fn(), price: vi.fn(), create: vi.fn(), retrieve: vi.fn(), reserve: vi.fn(), update: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "a".repeat(64) }), set: vi.fn() }) }));
vi.mock("@/lib/mailer", () => ({ assertAnnualWelcomeEmailConfigured: vi.fn() }));
vi.mock("@/lib/legal", () => ({ getPublishedLegalDocument: async (type: string) => ({ id: type, version: "1", content: [] }) }));
vi.mock("@/lib/session", () => ({ getCurrentAccount: m.account }));
vi.mock("@/lib/subscriptions", () => ({ getSubscriptionAccessStatus: m.access }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => ({ prices: { retrieve: m.price }, checkout: { sessions: { create: m.create, retrieve: m.retrieve } } }) }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAuthServerClient: async () => ({ auth: { getUser: m.user } }),
  createSupabaseServerClient: () => {
    const q = { update: m.update, eq: () => q, is: async () => ({ error: null }) };
    m.update.mockReturnValue(q);
    return { rpc: m.reserve, from: () => q };
  },
}));
import { POST } from "../app/api/stripe/create-checkout-session/route";
import { annualLiveMode } from "../lib/annual-stripe";
import { annualAccessExpiresAt, annualPaymentGrantsAccess } from "../lib/annual-offer";
const request = (origin = "https://studio.test", extra = {}) => new Request("https://studio.test/api/stripe/create-checkout-session", { method: "POST", headers: { origin }, body: JSON.stringify({ email: "  VERIFIED@Example.test ", acceptedTerms: true, termsId: "terms_of_use", salesId: "sales_terms", user_id: 999, auth_user_id: "attacker", amount: 1, ...extra }) });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ANNUAL_ACTIVATION_ENCRYPTION_KEY", Buffer.alloc(32, 1).toString("base64"));
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://studio.test");
  for (const [key,value] of Object.entries({ STRIPE_MODE: "test", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_PRICE_ID: "price_test55", SUPABASE_SERVICE_ROLE_KEY: "fake", NEXT_PUBLIC_SUPABASE_URL: "https://testproject.supabase.co", STRIPE_TEST_SUPABASE_PROJECT_REF: "testproject", STRIPE_LIVE_SUPABASE_PROJECT_REF: "liveproject", VERCEL_ENV: "preview" })) vi.stubEnv(key,value);
  m.user.mockResolvedValue({ data: { user: { id: "auth_verified", email: "verified@example.test" } }, error: null });
  m.account.mockResolvedValue(null);
  m.access.mockResolvedValue({ accessGranted: false });
  m.price.mockResolvedValue({ active: true, type: "one_time", currency: "eur", unit_amount: 5200, tax_behavior: "inclusive", livemode: false });
  m.reserve.mockResolvedValue({ data: { id: "order1", checkout_attempt: 1, price_id: "price_test55", checkout_expires_at: "2026-11-17T12:00:00Z" }, error: null });
  m.create.mockResolvedValue({ id: "cs_test55", url: "https://checkout.stripe.com/c/pay/test55" });
});
afterEach(() => vi.unstubAllEnvs());
it("normalizes guest email and uses the existing 52 EUR ledger without creating an account", async () => {
  expect((await POST(request())).status).toBe(200);
  expect(m.reserve).toHaveBeenCalledWith("reserve_guest_annual_checkout", expect.objectContaining({ target_email: "verified@example.test", target_owner_hash: expect.stringMatching(/^[a-f0-9]{64}$/), target_live_mode: false }));
  expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ mode: "payment", allow_promotion_codes: true, client_reference_id: "order1", customer_email: "verified@example.test", line_items: [{ price: "price_test55", quantity: 1 }], metadata: expect.objectContaining({ order_id: "order1", checkout_flow: "annual_guest_v1" }) }), { idempotencyKey: "annual-order1-1" });
  expect(m.update.mock.calls.every(([payload]) => !('access_granted' in payload) && !('paid_at' in payload))).toBe(true);
});
it("requires same origin, a valid email and current legal acceptance before touching Stripe", async () => {
  expect((await POST(request("https://attacker.test"))).status).toBe(403);
  expect((await POST(request(undefined, { email: "invalid" }))).status).toBe(400);
  expect((await POST(request(undefined, { acceptedTerms: false }))).status).toBe(400);
  expect((await POST(request(undefined, { salesId: "obsolete" }))).status).toBe(400);
  expect(m.create).not.toHaveBeenCalled();
});
it("blocks an active account and a processing payment", async () => {
  m.account.mockResolvedValue({ id: 42, email: "verified@example.test", is_active: true });
  m.access.mockResolvedValueOnce({ accessGranted: true });
  expect((await POST(request())).status).toBe(409);
  m.reserve.mockResolvedValueOnce({ data: null, error: new Error("processing") });
  expect((await POST(request())).status).toBe(409);
  expect(m.create).not.toHaveBeenCalled();
});
it("reuses an open session when the user retries an abandoned checkout", async () => {
  m.reserve.mockResolvedValue({ data: { session_id: "cs_existing" }, error: null });
  m.retrieve.mockResolvedValue({ status: "open", url: "https://checkout.stripe.com/c/pay/existing" });
  expect(await (await POST(request())).json()).toEqual({ url: "https://checkout.stripe.com/c/pay/existing" });
  expect(m.create).not.toHaveBeenCalled();
});
it.each([{ unit_amount: 5000 }, { unit_amount: 28900 }, { currency: "usd" }, { tax_behavior: "exclusive" }, { livemode: true }, { type: "recurring" }])("rejects incompatible price %o", async invalid => {
  m.price.mockResolvedValue({ active: true, type: "one_time", currency: "eur", unit_amount: 5200, livemode: false, ...invalid });
  expect((await POST(request())).status).toBe(503);
  expect(m.create).not.toHaveBeenCalled();
});
it("isolates TEST and LIVE keys, deployments and databases", () => {
  expect(annualLiveMode()).toBe(false);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://liveproject.supabase.co");
  expect(() => annualLiveMode()).toThrow(/Supabase/);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://testproject.supabase.co");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_fake");
  expect(() => annualLiveMode()).toThrow(/key\/mode/);
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake"); vi.stubEnv("VERCEL_ENV", "production");
  expect(() => annualLiveMode()).toThrow(/Test payments/);
  vi.stubEnv("STRIPE_MODE", "live"); vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_fake");
  expect(() => annualLiveMode()).toThrow(/not approved/);
  vi.stubEnv("STRIPE_LIVE_PAYMENTS_APPROVED", "yes"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://liveproject.supabase.co");
  expect(annualLiveMode()).toBe(true);
});
it("counts exactly 365 days across leap years and expires at the exact boundary", () => {
  expect(annualAccessExpiresAt("2023-03-01T12:00:00Z")).toBe("2024-02-29T12:00:00.000Z");
  const payment = { status: "paid", paid_at: "2026-01-01T00:00:00Z", expires_at: "2027-01-01T00:00:00Z" };
  expect(annualPaymentGrantsAccess(payment, Date.parse(payment.expires_at)-1)).toBe(true);
  expect(annualPaymentGrantsAccess(payment, Date.parse(payment.expires_at))).toBe(false);
  expect(annualPaymentGrantsAccess({ ...payment, status: "refunded" }, Date.parse(payment.paid_at))).toBe(false);
});
