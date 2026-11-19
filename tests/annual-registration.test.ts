import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ existing: vi.fn(), insert: vi.fn(), create: vi.fn(), remove: vi.fn(), login: vi.fn(), subscription: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/access-codes", () => ({ findAccountByEmail: m.existing, insertAccount: m.insert, attachAuthUserToAccount: vi.fn() }));
vi.mock("@/lib/activation-codes", () => ({ findUsableActivationCode: vi.fn(), consumeActivationCode: vi.fn() }));
vi.mock("@/lib/subscriptions", () => ({ upsertSubscription: m.subscription }));
vi.mock("@/lib/legal", () => ({ getPublishedLegalDocument: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ auth: { admin: { createUser: m.create, deleteUser: m.remove } } }), createSupabaseAuthServerClient: async () => ({ auth: { signInWithPassword: m.login } }) }));
import { registerAccount } from "../app/register-account";
function submit() {
  const form = new FormData();
  for (const [key,value] of Object.entries({ email: "new@example.test", password: "password55", clientName: "Camille", companyName: "Studio", user_id: "attacker", is_admin: "true" })) form.set(key,value);
  return registerAccount({ status: "idle", message: "" },form);
}
beforeEach(() => {
  vi.resetAllMocks(); m.existing.mockResolvedValue(null); m.insert.mockResolvedValue(undefined);
  m.create.mockResolvedValue({ data: { user: { id: "auth55" } }, error: null });
  m.login.mockResolvedValue({ error: null });
});
it("closes the former account-before-payment action", async () => {
  expect((await submit()).status).toBe("error");
  expect(m.create).not.toHaveBeenCalled(); expect(m.insert).not.toHaveBeenCalled();
  expect(m.subscription).not.toHaveBeenCalled();
});
it("preserves existing accounts and their privileges", async () => {
  m.existing.mockResolvedValue({ id: 1, is_admin: true });
  expect((await submit()).status).toBe("error");
  expect(m.create).not.toHaveBeenCalled(); expect(m.insert).not.toHaveBeenCalled(); expect(m.remove).not.toHaveBeenCalled();
});
it("never creates or deletes Auth identities without a paid activation", async () => {
  m.insert.mockRejectedValue(new Error("DB failure"));
  expect((await submit()).status).toBe("error");
  expect(m.remove).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
  expect(m.subscription).not.toHaveBeenCalled(); expect(m.login).not.toHaveBeenCalled();
});
it("preserves the identity when profile insertion committed before a network error", async () => {
  m.existing.mockResolvedValueOnce(null).mockResolvedValue({ id: 55, auth_user_id: "auth55" });
  m.insert.mockRejectedValue(new Error("network timeout"));
  expect((await submit()).status).toBe("error");
  expect(m.remove).not.toHaveBeenCalled();
});
