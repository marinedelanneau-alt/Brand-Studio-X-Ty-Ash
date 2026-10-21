import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ account: null as null | { id: number; role: string; is_admin: boolean; is_active: boolean; can_view_clients?: boolean; complimentary_access?: boolean } }));
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); }, unstable_rethrow: (error: unknown) => { throw error; } }));
vi.mock("@/lib/access-codes", () => ({ findAccountByAuthUserId: async () => state.account, findAccountByCode: async () => null }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAuthServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "auth" } }, error: null }) } }) }));
import { canAdminister, canReadClients } from "../lib/account-permissions";
import { getAuthenticatedAdmin, getAuthenticatedAccount, getAuthenticatedClientReader } from "../lib/session";
import { createTyAshPathwayDraft } from "../app/admin/releases/new-pathway-action";
import { publishFinalVersionForAllUsers, saveAdminModuleDraft } from "../app/admin/modules/actions";
import { inviteJulien } from "../app/admin/clients/viewer-actions";

describe("client_viewer server permissions", () => {
  beforeEach(() => { state.account = { id: 1, role: "user", is_admin: false, is_active: true, can_view_clients: true, complimentary_access: true }; });
  it("allows own workspace and client insight reads", async () => {
    expect((await getAuthenticatedClientReader()).can_view_clients).toBe(true);
    expect(canAdminister(state.account)).toBe(false);
    await expect(getAuthenticatedAdmin()).rejects.toThrow("redirect:/admin");
    expect((await getAuthenticatedAccount()).role).toBe("user");
  });
  it("keeps consultation separate from content administration", () => {
    expect(canAdminister({ role: "user", can_view_clients: true, is_admin: false })).toBe(false);
    expect(canReadClients({ role: "user", can_view_clients: true, is_admin: false })).toBe(true);
    expect(canAdminister({ role: "admin", can_view_clients: true, is_admin: true })).toBe(true);
  });
  it("preserves Marine's full Admin permissions", async () => {
    state.account!.role = "admin"; state.account!.is_admin = true;
    expect((await getAuthenticatedAdmin()).id).toBe(1);
    expect((await getAuthenticatedClientReader()).id).toBe(1);
  });
  it("gives normal users no new Admin access", async () => {
    state.account!.role = "user"; state.account!.can_view_clients = false;
    await expect(getAuthenticatedAdmin()).rejects.toThrow("/mon-espace");
    await expect(getAuthenticatedClientReader()).rejects.toThrow("/mon-espace");
    expect((await getAuthenticatedAccount()).role).toBe("user");
  });
  it("denies inactive accounts", async () => {
    state.account!.is_active = false;
    await expect(getAuthenticatedClientReader()).rejects.toThrow("redirect:/");
  });
  it("blocks direct server actions for content, publication, new pathways and role changes", async () => {
    await expect(createTyAshPathwayDraft()).rejects.toThrow("redirect:/admin");
    await expect(publishFinalVersionForAllUsers()).rejects.toThrow("redirect:/admin");
    expect(await saveAdminModuleDraft(new FormData())).toMatchObject({ status: "error" });
    await expect(inviteJulien({ status: "idle", account: "unchecked", accessGranted: false, emailSent: false, message: "" })).rejects.toThrow("redirect:/admin/clients");
  });
});
