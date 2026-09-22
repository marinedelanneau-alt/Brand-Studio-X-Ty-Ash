import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
const mocks = vi.hoisted(() => ({ db: vi.fn(), find: vi.fn(), create: vi.fn(), deliver: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.db }));
vi.mock("@/lib/activation-codes", () => ({ findActivationCodeByCheckoutSession: mocks.find, createActivationCode: mocks.create }));
vi.mock("@/lib/activation-email-delivery", () => ({ deliverActivationEmail: mocks.deliver }));
import { fulfillCommercialOrder } from "../lib/commercial-order-fulfillment";
import { BRAND_STUDIO_OFFER } from "../lib/brand-studio-offer";

describe("commercial webhook fulfillment", () => {
  let order: Record<string, unknown>;
  let activation: object | null;
  const session = { id: "cs_new", payment_status: "paid", mode: "payment", currency: "eur", amount_total: 28900, consent: { terms_of_service: "accepted" }, livemode: false } as Stripe.Checkout.Session;
  const event = { id: "evt_paid", created: Date.parse("2026-09-22T12:00:00Z") / 1000 };
  beforeEach(() => {
    vi.clearAllMocks();
    order = { session_id: "cs_new", offer_version: BRAND_STUDIO_OFFER.version, live_mode: false, email: "new@example.test", account_id: null, paid_at: null };
    activation = null;
    mocks.db.mockReturnValue({ from: (table: string) => {
      expect(table).toBe("commercial_orders_v1");
      const query = {
        select: () => query, eq: () => query,
        single: async () => ({ data: order, error: null }),
        update: (payload: object) => ({ eq: () => ({ is: async () => {
          if (!order.paid_at) Object.assign(order, payload);
          return { error: null };
        } }) }),
      };
      return query;
    } });
    mocks.find.mockImplementation(async () => activation);
    mocks.create.mockImplementation(async () => {
      if (activation) throw new Error("unique session violation");
      activation = { id: 1, status: "paid" };
      return activation;
    });
    mocks.deliver.mockResolvedValue(true);
  });
  it("replaying a payment keeps one activation and the original expiry", async () => {
    await fulfillCommercialOrder(session, event);
    await fulfillCommercialOrder(session, { id: "evt_duplicate", created: event.created + 86400 });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(order.paid_at).toBe("2026-09-22T12:00:00.000Z");
    expect(order.expires_at).toBe("2027-09-22T12:00:00.000Z");
    expect(order.payment_event_id).toBe(event.id);
  });
  it("recovers concurrent activation insertion through the unique session constraint", async () => {
    await Promise.all([fulfillCommercialOrder(session, event), fulfillCommercialOrder(session, event)]);
    expect(activation).toEqual({ id: 1, status: "paid" });
    expect(order.expires_at).toBe("2027-09-22T12:00:00.000Z");
  });
  it.each(["unpaid", "no_payment_required"])("does not grant access for %s", async (payment_status) => {
    await fulfillCommercialOrder({ ...session, payment_status } as Stripe.Checkout.Session, event);
    expect(mocks.db).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("rejects wrong price or missing consent before database writes", async () => {
    await expect(fulfillCommercialOrder({ ...session, amount_total: 1 }, event)).rejects.toThrow();
    await expect(fulfillCommercialOrder({ ...session, consent: null }, event)).rejects.toThrow();
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("never rewrites a historical account", async () => {
    order.account_id = 42;
    await expect(fulfillCommercialOrder(session, event)).rejects.toThrow("access unchanged");
    expect(order.paid_at).toBeNull();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("refuses a payment without matching evidence", async () => {
    order.offer_version = "legacy";
    await expect(fulfillCommercialOrder(session, event)).rejects.toThrow("evidence missing");
    expect(order.paid_at).toBeNull();
  });
  it("retries failed email delivery without recreating the activation", async () => {
    mocks.deliver.mockRejectedValueOnce(new Error("Brevo unavailable"));
    await expect(fulfillCommercialOrder(session, event)).rejects.toThrow("Brevo unavailable");
    await fulfillCommercialOrder(session, event);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
});
