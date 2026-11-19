import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const m = vi.hoisted(() => ({ payment: vi.fn(), filters: [] as unknown[][] }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/annual-stripe", () => ({ annualLiveMode: () => false }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => name === "tyash_purchase_owner" ? { value: "a".repeat(64) } : undefined }) }));
vi.mock("@/lib/session", () => ({ getCurrentAccount: async () => null }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => {
  const q = { select: () => q, eq: (...args: unknown[]) => { m.filters.push(args); return q; }, maybeSingle: m.payment };
  return { from: () => q };
} }));
vi.mock("@/app/ui/brand-studio-tyash-lockup", () => ({ default: () => <span>Logos</span> }));
vi.mock("@/app/ui/payment-confirmation-refresh", () => ({ default: () => <span>Vérification automatique</span> }));
import ConfirmationPage from "../app/commander/confirmation/page";
const render = async () => renderToStaticMarkup(await ConfirmationPage({ searchParams: Promise.resolve({ session_id: "cs_guest" }) }));
const payment = { status: "paid", paid_at: "2026-01-01", expires_at: "2099-01-01", fulfillment_state: "ready", activation_required: true, email_message_id: "mail55" };
beforeEach(() => { vi.resetAllMocks(); m.filters.length=0; m.payment.mockResolvedValue({ data: payment, error: null }); });
it("announces the email only after persisted fulfillment and delivery evidence", async () => {
  const html = await render();
  expect(html).toContain("Votre projet vidéo peut commencer !"); expect(html).toContain("Nous venons de vous envoyer un e-mail");
  expect(m.filters).toContainEqual(["session_id", "cs_guest"]);
  expect(m.filters).toContainEqual(["owner_hash", expect.stringMatching(/^[a-f0-9]{64}$/)]);
});
it.each([{ status: "pending" }, { fulfillment_state: "pending" }, { email_message_id: null }])("waits without claiming an email was sent: %o", async state => {
  m.payment.mockResolvedValue({ data: { ...payment, ...state }, error: null });
  const html = await render(); expect(html).not.toContain("Nous venons de vous envoyer un e-mail"); expect(html).toContain("Vérification automatique");
});
it("does not trust a return URL without the matching private purchase", async () => {
  m.payment.mockResolvedValue({ data: null, error: null });
  expect(await render()).not.toContain("Nous venons de vous envoyer un e-mail");
});
it("offers review for existing access and never advertises activation after expiry", async () => {
  for (const state of [{ fulfillment_state: "existing_access" }, { status: "refunded" }, { expires_at: "2020-01-01" }]) {
    m.payment.mockResolvedValue({ data: { ...payment, ...state }, error: null });
    const html = await render(); expect(html).toContain("nécessite une vérification"); expect(html).not.toContain("Nous venons de vous envoyer un e-mail");
  }
});
