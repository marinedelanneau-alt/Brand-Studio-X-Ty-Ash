import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const m = vi.hoisted(() => ({ payment: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getCurrentAccount: async () => ({ id: 55, is_active: true, annual_access_required: true }) }));
vi.mock("@/lib/annual-payments", () => ({ getAnnualPayment: m.payment }));
vi.mock("@/app/ui/brand-studio-tyash-lockup", () => ({ default: () => <span>Logos</span> }));
vi.mock("@/app/ui/payment-confirmation-refresh", () => ({ default: () => <span>Vérification automatique</span> }));
import ConfirmationPage from "../app/commander/confirmation/page";
const render = async (id = "cs55") => renderToStaticMarkup(await ConfirmationPage({ searchParams: Promise.resolve({ session_id: id }) }));
beforeEach(() => { m.payment.mockResolvedValue({ session_id: "cs55", status: "paid", paid_at: "2026-01-01", expires_at: "2099-01-01" }); });
it("shows an activated access only for the authenticated owner's paid ledger entry", async () => {
  const html = await render();
  expect(html).toContain("Votre accès est activé pour 1 an.");
  expect(html).toContain('href="/mon-espace"');
});
it("does not trust a different session ID or a pending ledger entry", async () => {
  expect(await render("cs_another")).not.toContain("Votre accès est activé");
  m.payment.mockResolvedValue({ session_id: "cs55", status: "pending" });
  const html = await render();
  expect(html).toContain("Vérification automatique");
  expect(html).not.toContain("Votre accès est activé");
});
it("never confirms activation for refunded, disputed or unavailable payments", async () => {
  for (const status of ["refunded", "disputed"]) {
    m.payment.mockResolvedValue({ session_id: "cs55", status });
    expect(await render()).toContain("Un remboursement ou une contestation a suspendu vos droits");
  }
  m.payment.mockRejectedValue(new Error("offline"));
  expect(await render()).not.toContain("Votre accès est activé");
});
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
