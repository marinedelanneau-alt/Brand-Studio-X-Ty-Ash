import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ account: vi.fn(), access: vi.fn(), customer: vi.fn(), price: vi.fn(), create: vi.fn(), cookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: mocks.cookie }) }));
vi.mock("@/lib/session", () => ({ getCurrentAccount: mocks.account }));
vi.mock("@/lib/subscriptions", () => ({ getSubscriptionAccessStatus: mocks.access, findStripeCustomerId: mocks.customer }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => ({ prices: { retrieve: mocks.price }, checkout: { sessions: { create: mocks.create } } }) }));
import { POST } from "../app/api/stripe/create-embedded-checkout-session/route";
import { PLATFORM_PRICE_ID } from "../lib/platform-checkout";
const request = (email = "client@example.test", origin = "https://studio.example") => new Request("https://studio.example/api/stripe/create-embedded-checkout-session", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify({ email, priceId: "price_attacker", amount: 1 }) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.account.mockResolvedValue(null);
  mocks.price.mockResolvedValue({ active: true, type: "one_time", currency: "eur", unit_amount: 5000, tax_behavior: "inclusive" });
  mocks.create.mockResolvedValue({ client_secret: "cs_secret" });
});
describe("embedded platform checkout", () => {
  it("uses the existing fixed price, preserves dynamic payment methods and promotion codes, and returns only the client secret", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ clientSecret: "cs_secret" });
    expect(mocks.price).toHaveBeenCalledWith(PLATFORM_PRICE_ID);
    const params = mocks.create.mock.calls[0][0];
    expect(params).toMatchObject({ ui_mode: "embedded_page", mode: "payment", line_items: [{ price: PLATFORM_PRICE_ID, quantity: 1 }], allow_promotion_codes: true, customer_email: "client@example.test", metadata: { user_id: "", product: "brand_studio" } });
    expect(params.return_url).toBe("https://studio.example/commander/confirmation?session_id={CHECKOUT_SESSION_ID}");
    expect(params).not.toHaveProperty("success_url");
    expect(params).not.toHaveProperty("cancel_url");
    expect(params).not.toHaveProperty("payment_method_types");
    expect(mocks.cookie).toHaveBeenCalledWith("platform_checkout_owner", expect.any(String), expect.objectContaining({ httpOnly: true, secure: true, sameSite: "lax" }));
  });
  it("rejects another origin before any Stripe call", async () => {
    expect((await POST(request("client@example.test", "https://evil.test"))).status).toBe(403);
    expect(mocks.price).not.toHaveBeenCalled();
  });
  it("requires a valid email", async () => {
    expect((await POST(request("invalid"))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each([{ unit_amount: 28900 }, { currency: "usd" }, { active: false }, { type: "recurring" }, { tax_behavior: "exclusive" }])("refuses an incompatible price: %j", async (change) => {
    mocks.price.mockResolvedValue({ active: true, type: "one_time", currency: "eur", unit_amount: 5000, ...change });
    expect((await POST(request())).status).toBe(503);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("does not replace an existing access", async () => {
    mocks.account.mockResolvedValue({ id: 1, email: "existing@example.test" });
    mocks.access.mockResolvedValue({ accessGranted: true });
    expect((await POST(request())).status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("retains the account identity and Stripe customer without writing access before payment", async () => {
    mocks.account.mockResolvedValue({ id: 1, email: "existing@example.test" });
    mocks.access.mockResolvedValue({ accessGranted: false, plan: "brand_studio" });
    mocks.customer.mockResolvedValue("cus_existing");
    expect((await POST(request())).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_existing", customer_email: undefined, metadata: expect.objectContaining({ user_id: "1" }) }));
  });
});
