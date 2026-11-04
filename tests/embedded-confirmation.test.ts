import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), cookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => ({ checkout: { sessions: { retrieve: mocks.retrieve } } }) }));
import ConfirmationPage from "../app/commander/confirmation/page";
import { PLATFORM_CHECKOUT_FLOW } from "../lib/platform-checkout";
const render = async (id = "cs_test") => renderToStaticMarkup(await ConfirmationPage({ searchParams: Promise.resolve({ session_id: id }) }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: "owner" });
  mocks.retrieve.mockResolvedValue({ payment_status: "paid", status: "complete", customer_email: "private@example.test", metadata: { checkout_flow: PLATFORM_CHECKOUT_FLOW, return_owner: "owner" } });
});
describe("server-verified checkout confirmation", () => {
  it("confirms a paid session associated with the browser, without exposing personal data", async () => {
    const html = await render();
    expect(html).toContain("Votre paiement est confirmé.");
    expect(html).not.toContain("private@example.test");
  });
  it("does not trust a session ID without the browser cookie", async () => {
    mocks.cookie.mockReturnValue(undefined);
    expect(await render()).toContain("Nous ne pouvons pas vérifier votre commande.");
    expect(mocks.retrieve).not.toHaveBeenCalled();
  });
  it("does not confirm another browser's paid session", async () => {
    mocks.cookie.mockReturnValue({ value: "other" });
    expect(await render()).not.toContain("Votre paiement est confirmé.");
  });
  it("does not claim success when Stripe is unavailable", async () => {
    mocks.retrieve.mockRejectedValue(new Error("Stripe unavailable"));
    expect(await render()).toContain("Nous ne pouvons pas vérifier votre commande.");
  });
  it.each([["complete", "Votre paiement est en cours de validation."], ["open", "Votre paiement n’est pas finalisé."]])("handles unpaid %s sessions", async (status, title) => {
    mocks.retrieve.mockResolvedValue({ payment_status: "unpaid", status, metadata: { checkout_flow: PLATFORM_CHECKOUT_FLOW, return_owner: "owner" } });
    expect(await render()).toContain(title);
  });
});
