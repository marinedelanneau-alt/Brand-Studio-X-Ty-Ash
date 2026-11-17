import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ account: vi.fn(), access: vi.fn(), payment: vi.fn(), single: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("@/lib/access-codes", () => ({ findAccountByAuthUserId: m.account, findAccountByCode: async () => null }));
vi.mock("@/lib/annual-payments", () => ({ getAnnualPayment: m.payment }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAuthServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "auth55" } }, error: null }) } }),
  createSupabaseServerClient: () => { const q = { select: () => q, eq: () => q, maybeSingle: m.single }; return { from: () => q }; },
}));
import { getCurrentAccount, getAuthenticatedAccount } from "../lib/session";
import { getSubscriptionAccessStatus, hasActiveAccess } from "../lib/subscriptions";
beforeEach(() => {
  vi.resetAllMocks();
  const account = { id: 55, is_active: true, is_admin: false, role: "user", auth_user_id: "auth55", annual_access_required: true };
  m.account.mockResolvedValue(account); m.single.mockResolvedValue({ data: account, error: null });
  m.payment.mockResolvedValue(null);
});
it("keeps an unpaid identity authenticated for checkout but protects every paid server action", async () => {
  expect((await getCurrentAccount())?.id).toBe(55);
  await expect(getAuthenticatedAccount()).rejects.toThrow("redirect:/commander");
  expect(await hasActiveAccess(55)).toBe(false);
});
it("allows the paid account and then denies it after expiry without signing it out", async () => {
  m.payment.mockResolvedValue({ status: "paid", paid_at: "2026-01-01", expires_at: "2099-01-01" });
  expect((await getAuthenticatedAccount()).id).toBe(55);
  m.payment.mockResolvedValue({ status: "paid", paid_at: "2000-01-01", expires_at: "2001-01-01" });
  m.account.mockResolvedValue({ id: 55, is_active: true, access_started_at: "2000-01-01", access_expires_at: "2001-01-01" });
  expect((await getCurrentAccount())?.id).toBe(55);
  await expect(getAuthenticatedAccount()).rejects.toThrow("redirect:/acces-expire");
  expect((await getSubscriptionAccessStatus(55)).accessGranted).toBe(false);
});
it("does not let legacy subscriptions or complimentary flags override annual reversals", async () => {
  m.single.mockResolvedValue({ data: { is_active: true, annual_access_required: true, complimentary_access: true }, error: null });
  for (const status of ["pending", "processing", "refunded", "disputed"]) {
    m.payment.mockResolvedValue({ status, paid_at: "2026-01-01", expires_at: "2099-01-01" });
    expect((await getSubscriptionAccessStatus(55)).accessGranted).toBe(false);
  }
});
it("keeps role-authorized Admins free and unlimited without querying the payment ledger", async () => {
  const account = { id: 1, is_active: true, role: "admin", is_admin: true, access_expires_at: "2000-01-01" };
  m.account.mockResolvedValue(account); m.single.mockResolvedValue({ data: account, error: null });
  expect((await getAuthenticatedAccount()).id).toBe(1);
  expect((await getSubscriptionAccessStatus(1)).accessGranted).toBe(true);
  expect(m.payment).not.toHaveBeenCalled();
});
