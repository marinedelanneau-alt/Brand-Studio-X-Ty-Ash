import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ grant: vi.fn(), order: vi.fn(), verify: vi.fn(), update: vi.fn(), identity: vi.fn(), getUser: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => {
    const q = { update: () => q, eq: () => q, is: () => q, gt: () => q, select: () => q, maybeSingle: m.grant, single: m.order,
      then: (fn: (value: unknown) => unknown) => Promise.resolve({ error: null }).then(fn) };
    return { from: () => q, rpc: m.identity, auth: { admin: { getUserById: m.getUser } } };
  },
  createSupabaseAuthServerClient: async () => ({ auth: { verifyOtp: m.verify, updateUser: m.update } }),
}));
import { initializeAnnualPassword } from "../app/activer/actions";
const token = "a".repeat(64);
function submit(extra = {}) {
  const form = new FormData();
  Object.entries({ token, password: "a-private-password", confirmation: "a-private-password", ...extra }).forEach(([key,value]) => form.set(key,value));
  return initializeAnnualPassword({ error: "" }, form);
}
beforeEach(() => {
  vi.resetAllMocks();
  m.grant.mockResolvedValue({ data: { id: "grant", order_id: "order", auth_user_id: "auth" }, error: null });
  m.order.mockResolvedValue({ data: { status: "paid", expires_at: new Date(Date.now()+86400000).toISOString(), password_initialized_at: null, auth_user_id: "auth" }, error: null });
  m.getUser.mockResolvedValue({ data: { user: { email: "paid@example.test" } }, error: null });
  m.identity.mockResolvedValue({ data: [{ id: "auth", has_password: false }], error: null });
  m.verify.mockResolvedValue({ data: { user: { id: "auth" } }, error: null });
  m.update.mockResolvedValue({ error: null });
});
it("requires a one-use grant and a matching Supabase-verified identity before setting the password", async () => {
  await expect(submit()).rejects.toThrow("redirect:/mon-espace");
  expect(m.verify).toHaveBeenCalledWith({ token_hash: token, type: "recovery" });
  expect(m.update).toHaveBeenCalledWith({ password: "a-private-password" });
});
it("rejects mismatched passwords without touching Auth", async () => {
  expect((await submit({ confirmation: "different" })).error).toContain("identiques");
  expect(m.grant).not.toHaveBeenCalled(); expect(m.verify).not.toHaveBeenCalled();
});
it("rejects expired or already consumed links even when the browser already has a session", async () => {
  m.grant.mockResolvedValue({ data: null, error: null });
  expect((await submit()).error).toContain("expiré"); expect(m.verify).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
});
it.each(["pending", "refunded", "disputed"])("does not initialize a %s purchase", async status => {
  m.order.mockResolvedValue({ data: { status }, error: null });
  expect((await submit()).error).toBeTruthy(); expect(m.verify).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
});
it("never replaces an existing password as a side effect of payment", async () => {
  m.identity.mockResolvedValue({ data: [{ id: "auth", has_password: true }], error: null });
  expect((await submit()).error).toContain("déjà défini"); expect(m.verify).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
});
it("rejects a valid Supabase token belonging to a different user", async () => {
  m.verify.mockResolvedValue({ data: { user: { id: "another-user" } }, error: null });
  expect((await submit()).error).toBeTruthy(); expect(m.update).not.toHaveBeenCalled();
});
it("does not set a password when Supabase rejects an expired OTP", async () => {
  m.verify.mockResolvedValue({ data: { user: null }, error: new Error("expired") });
  expect((await submit()).error).toContain("expiré"); expect(m.update).not.toHaveBeenCalled();
});
