import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ event: vi.fn(), items: vi.fn(), existing: vi.fn(), activation: vi.fn(), deliver: vi.fn(), upsert: vi.fn(), commercial: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => ({ webhooks: { constructEvent: mocks.event }, checkout: { sessions: { listLineItems: mocks.items } } }) }));
vi.mock("@/lib/activation-codes", () => ({ createActivationCode: mocks.activation, findActivationCodeByCheckoutSession: mocks.existing }));
vi.mock("@/lib/activation-email-delivery", () => ({ deliverActivationEmail: mocks.deliver }));
vi.mock("@/lib/subscriptions", () => ({ upsertSubscription: mocks.upsert }));
vi.mock("@/lib/commercial-order-fulfillment", () => ({ fulfillCommercialOrder: mocks.commercial }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
import { POST } from "../app/api/stripe/webhook/route";
import { PLATFORM_CHECKOUT_FLOW, PLATFORM_PRICE_ID } from "../lib/platform-checkout";
const session = { id: "cs_test", mode: "payment", currency: "eur", amount_subtotal: 5000, payment_status: "paid", customer: "cus_test", customer_email: "client@example.test", metadata: { checkout_flow: PLATFORM_CHECKOUT_FLOW, user_id: "" } };
const request = () => new Request("https://studio.example/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": "signature" }, body: "raw event" });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
  mocks.event.mockReturnValue({ type: "checkout.session.completed", data: { object: session } });
  mocks.items.mockResolvedValue({ data: [{ price: { id: PLATFORM_PRICE_ID }, quantity: 1 }] });
  mocks.existing.mockResolvedValue(null);
  mocks.activation.mockResolvedValue({ id: 12 });
});
describe("embedded checkout fulfillment through existing signed webhook", () => {
  it("grants guest activation with the actual 50 EUR price only after a verified event", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.event).toHaveBeenCalledWith("raw event", "signature", "whsec_test");
    expect(mocks.activation).toHaveBeenCalledWith(expect.objectContaining({ email: "client@example.test", priceId: PLATFORM_PRICE_ID, stripeCheckoutSessionId: "cs_test" }));
    expect(mocks.deliver).toHaveBeenCalledWith({ id: 12 });
  });
  it("reuses the existing activation when a webhook is replayed", async () => {
    mocks.existing.mockResolvedValue({ id: 12 });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.activation).not.toHaveBeenCalled();
  });
  it("does not grant access for an invalid signature", async () => {
    mocks.event.mockImplementation(() => { throw new Error("Invalid signature"); });
    expect((await POST(request())).status).toBe(400);
    expect(mocks.activation).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("waits for asynchronous payment success", async () => {
    mocks.event.mockReturnValue({ type: "checkout.session.completed", data: { object: { ...session, payment_status: "unpaid" } } });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.activation).not.toHaveBeenCalled();
    mocks.event.mockReturnValue({ type: "checkout.session.async_payment_succeeded", data: { object: session } });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.activation).toHaveBeenCalledTimes(1);
  });
  it("rejects a different price without attributing access", async () => {
    mocks.items.mockResolvedValue({ data: [{ price: { id: "price_other" }, quantity: 1 }] });
    expect((await POST(request())).status).toBe(500);
    expect(mocks.activation).not.toHaveBeenCalled();
  });
  it("updates a connected account through the existing access function", async () => {
    mocks.event.mockReturnValue({ type: "checkout.session.completed", data: { object: { ...session, metadata: { ...session.metadata, user_id: "42" } } } });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, accessGranted: true, status: "paid", priceId: PLATFORM_PRICE_ID }));
  });
});
