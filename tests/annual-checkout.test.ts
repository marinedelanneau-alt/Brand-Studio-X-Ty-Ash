import { beforeEach, afterEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ account: vi.fn(), user: vi.fn(), access: vi.fn(), price: vi.fn(), create: vi.fn(), retrieve: vi.fn(), reserve: vi.fn(), update: vi.fn() }));
vi.mock("server-only", () => ({}));
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
const request = (origin = "https://studio.test") => new Request("https://studio.test/api/stripe/create-checkout-session", { method: "POST", headers: { origin }, body: JSON.stringify({ user_id: 999, auth_user_id: "attacker", amount: 1 }) });
beforeEach(() => {
  vi.resetAllMocks();
  for (const [key,value] of Object.entries({ STRIPE_MODE: "test", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_PRICE_ID: "price_test55", SUPABASE_SERVICE_ROLE_KEY: "fake", NEXT_PUBLIC_SUPABASE_URL: "https://testproject.supabase.co", STRIPE_TEST_SUPABASE_PROJECT_REF: "testproject", STRIPE_LIVE_SUPABASE_PROJECT_REF: "liveproject", VERCEL_ENV: "preview" })) vi.stubEnv(key,value);
  m.user.mockResolvedValue({ data: { user: { id: "auth_verified", email: "verified@example.test" } }, error: null });
  m.account.mockResolvedValue({ id: 42, email: "verified@example.test", auth_user_id: "auth_verified", annual_access_required: true });
  m.access.mockResolvedValue({ accessGranted: false });
  m.price.mockResolvedValue({ active: true, type: "one_time", currency: "eur", unit_amount: 5500, tax_behavior: "inclusive", livemode: false });
  m.reserve.mockResolvedValue({ data: { id: "order1", checkout_attempt: 1, price_id: "price_test55", checkout_expires_at: "2026-11-17T12:00:00Z" }, error: null });
  m.create.mockResolvedValue({ id: "cs_test55", url: "https://checkout.stripe.com/c/pay/test55" });
});
afterEach(() => vi.unstubAllEnvs());
it("uses the verified Supabase identity, 55 EUR and a stable idempotency key without granting access", async () => {
  expect((await POST(request())).status).toBe(200);
  expect(m.reserve).toHaveBeenCalledWith("reserve_annual_checkout", expect.objectContaining({ target_account_id: 42, target_auth_user_id: "auth_verified", target_live_mode: false }));
  expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ mode: "payment", client_reference_id: "auth_verified", line_items: [{ price: "price_test55", quantity: 1 }], metadata: expect.objectContaining({ auth_user_id: "auth_verified" }) }), { idempotencyKey: "annual-order1-1" });
  expect(m.update.mock.calls.every(([payload]) => !('access_granted' in payload) && !('paid_at' in payload))).toBe(true);
});
it("requires authentication and same origin before touching Stripe", async () => {
  expect((await POST(request("https://attacker.test"))).status).toBe(403);
  m.user.mockResolvedValue({ data: { user: null }, error: null });
  expect((await POST(request())).status).toBe(401);
  expect(m.create).not.toHaveBeenCalled();
});
it("blocks an active account and a processing payment", async () => {
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
  m.price.mockResolvedValue({ active: true, type: "one_time", currency: "eur", unit_amount: 5500, livemode: false, ...invalid });
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
