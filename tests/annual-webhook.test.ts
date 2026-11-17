import Stripe from "stripe";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn(), items: vi.fn(), update: vi.fn(), intent: vi.fn(), filters: [] as unknown[][] }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/annual-stripe", () => ({ annualLiveMode: () => false, getAnnualStripe: () => stripeClient() }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => stripeClient() }));
vi.mock("@/lib/subscriptions", () => ({ upsertSubscription: vi.fn() }));
vi.mock("@/lib/activation-codes", () => ({ createActivationCode: vi.fn(), findActivationCodeByCheckoutSession: vi.fn() }));
vi.mock("@/lib/activation-email-delivery", () => ({ deliverActivationEmail: vi.fn() }));
vi.mock("@/lib/commercial-order-fulfillment", () => ({ fulfillCommercialOrder: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => {
  const q = { select: () => q, eq: (...args: unknown[]) => { m.filters.push(args); return q; }, in: () => q,
    is: () => q, single: m.single, update: m.update,
    then: (fn: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(fn) };
  m.update.mockReturnValue(q);
  return { rpc: m.rpc, from: () => q };
} }));
const sdk = new Stripe("sk_test_fake");
function stripeClient() { return { webhooks: sdk.webhooks, checkout: { sessions: { listLineItems: m.items } }, paymentIntents: { retrieve: m.intent } }; }
import { POST } from "../app/api/stripe/webhook/route";
import { ANNUAL_OFFER } from "../lib/annual-offer";
const session = { id: "cs_test55", mode: "payment", livemode: false, currency: "eur", amount_total: 5500, payment_status: "paid", payment_intent: "pi55", customer: "cus55", client_reference_id: "auth55", metadata: { offer_version: ANNUAL_OFFER.version, order_id: "order55", auth_user_id: "auth55" } };
function request(type = "checkout.session.completed", object: unknown = session, valid = true) {
  const payload = JSON.stringify({ id: "evt55", created: 1794900000, livemode: false, type, data: { object } });
  const signature = sdk.webhooks.generateTestHeaderString({ payload, secret: valid ? "whsec_fake" : "whsec_wrong" });
  return new Request("https://studio.test/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signature }, body: payload });
}
beforeEach(() => {
  vi.resetAllMocks(); m.filters.length=0; vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fake");
  m.single.mockResolvedValue({ data: { id: "order55", auth_user_id: "auth55", price_id: "price55", live_mode: false }, error: null });
  m.items.mockResolvedValue({ has_more: false, data: [{ price: { id: "price55" }, quantity: 1 }] });
  m.rpc.mockResolvedValue({ error: null });
  m.intent.mockResolvedValue({ metadata: { order_id: "order55", offer_version: ANNUAL_OFFER.version } });
});
afterEach(() => vi.unstubAllEnvs());
it("verifies a real Stripe signature and atomically activates only the evidenced 55 EUR purchase", async () => {
  expect((await POST(request())).status).toBe(200);
  expect(m.rpc).toHaveBeenCalledWith("apply_annual_payment", expect.objectContaining({ target_session_id: "cs_test55", target_payment_intent_id: "pi55", target_live_mode: false, target_event_id: "evt55" }));
});
it("rejects a bad signature without reading or changing rights", async () => {
  expect((await POST(request(undefined, session, false))).status).toBe(400);
  expect(m.rpc).not.toHaveBeenCalled(); expect(m.single).not.toHaveBeenCalled();
});
it("waits for asynchronous confirmation and records failed or expired checkouts", async () => {
  expect((await POST(request("checkout.session.completed", { ...session, payment_status: "unpaid" }))).status).toBe(200);
  expect(m.rpc).not.toHaveBeenCalled(); expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ status: "processing" }));
  expect((await POST(request("checkout.session.async_payment_succeeded"))).status).toBe(200);
  expect(m.rpc).toHaveBeenCalledTimes(1);
  await POST(request("checkout.session.async_payment_failed", { ...session, payment_status: "unpaid" }));
  expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
  await POST(request("checkout.session.expired", { ...session, payment_status: "unpaid" }));
  expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ status: "expired" }));
});
it.each([{ amount_total: 5000 }, { currency: "usd" }, { client_reference_id: "another_user" }])("does not activate an incompatible purchase %o", async invalid => {
  expect((await POST(request(undefined, { ...session, ...invalid }))).status).toBe(500);
  expect(m.rpc).not.toHaveBeenCalled();
});
it("retries a transient database activation error instead of acknowledging it", async () => {
  m.rpc.mockResolvedValueOnce({ error: new Error("unavailable") });
  expect((await POST(request())).status).toBe(500);
  expect((await POST(request())).status).toBe(200);
});
it("revokes a full refund and any dispute, leaving partial refunds unchanged", async () => {
  await POST(request("charge.refunded", { amount: 5500, amount_refunded: 1000, refunded: false, payment_intent: "pi55" }));
  expect(m.update).not.toHaveBeenCalled();
  await POST(request("charge.refunded", { amount: 5500, amount_refunded: 5500, refunded: true, payment_intent: "pi55" }));
  expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ status: "refunded" }));
  expect(m.filters).toContainEqual(["id", "order55"]);
  await POST(request("charge.dispute.created", { payment_intent: "pi55" }));
  expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ status: "disputed" }));
});
