import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ list: vi.fn(), link: vi.fn(), send: vi.fn(), config: vi.fn(), grant: vi.fn(), authorize: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getAuthenticatedInvitationAdmin: m.authorize }));
vi.mock("@/lib/julien-access", () => ({ grantJulienAccess: m.grant }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ auth: { admin: { listUsers: m.list, generateLink: m.link } } }) }));
vi.mock("@/lib/mailer", () => ({ assertJulienEmailConfigured: m.config, sendJulienInvitationEmail: m.send }));
const invite = async () => (await import("../lib/julien-invitation")).prepareAndSendJulienInvitation();
beforeEach(() => {
 vi.resetModules(); vi.resetAllMocks(); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cplzwnlstcpqqzqeawgs.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-server-key");
 m.list.mockResolvedValue({ data: { users: [] }, error: null });
 m.link.mockResolvedValue({ data: { user: { id: "julien", email: "jsene@ty-ash.com" }, properties: { hashed_token: "secret-token" } }, error: null });
 m.send.mockResolvedValue("message-id");
});
describe("Julien invitation without SQL grant RPCs or duplicate identity", () => {
 it("creates an invitation, grants access and only then sends via Brevo", async () => {
   expect(await invite()).toMatchObject({ status: "success", account: "created", accessGranted: true, emailSent: true, message: "Invitation envoyée à jsene@ty-ash.com" });
   expect(m.link).toHaveBeenCalledWith({ type: "invite", email: "jsene@ty-ash.com", options: { redirectTo: "https://brand-studio-x-ty-ash.vercel.app/auth/reset/callback" } });
   expect(m.send).toHaveBeenCalledWith("https://brand-studio-x-ty-ash.vercel.app/auth/reset/callback?token_hash=secret-token&type=invite");
   expect(m.grant).toHaveBeenCalledWith("julien");
   expect(m.grant.mock.invocationCallOrder[0]).toBeLessThan(m.send.mock.invocationCallOrder[0]);
 });
 it("recovers an existing account without creating another", async () => {
   m.list.mockResolvedValue({ data: { users: [{ id: "same", email: "jsene@ty-ash.com" }] }, error: null });
   expect(await invite()).toMatchObject({ account: "existing", status: "success" });
   expect(m.link).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: "recovery" }));
 });
 it("handles concurrent account creation by switching to recovery", async () => {
   m.link.mockResolvedValueOnce({ data: {}, error: { code: "email_exists" } });
   expect(await invite()).toMatchObject({ account: "existing", status: "success" });
   expect(m.link.mock.calls.map(call => call[0].type)).toEqual(["invite", "recovery"]);
 });
 it("reports email failure without losing the access/account stages", async () => {
   m.send.mockRejectedValue(new Error("provider secret"));
   const result=await invite();
   expect(result).toMatchObject({ status: "error", account: "created", accessGranted: true, emailSent: false });
   expect(JSON.stringify(result)).not.toContain("provider secret");
 });
 it("does not email if access attribution fails", async () => {
   m.grant.mockRejectedValue(new Error("Attribution impossible"));
   expect(await invite()).toMatchObject({ status: "error", account: "created", accessGranted: false, emailSent: false });
   expect(m.send).not.toHaveBeenCalled();
 });
 it("checks Brevo configuration before creating an account", async () => {
   m.config.mockImplementation(() => { throw new Error("Missing Brevo environment variables"); });
   expect(await invite()).toMatchObject({ status: "error", account: "unchecked" });
   expect(m.link).not.toHaveBeenCalled();
 });
 it("refuses every other Supabase project", async () => {
   vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://other.supabase.co");
   expect(await invite()).toMatchObject({ status: "error" });
   expect(m.link).not.toHaveBeenCalled();
 });
 it("does not mistake failed Auth lookup for an absent user", async () => {
   m.list.mockResolvedValue({ data: null, error: { message: "offline" } });
   expect(await invite()).toMatchObject({ status: "error", account: "unchecked" });
   expect(m.link).not.toHaveBeenCalled();
 });
 it("coalesces concurrent and immediately repeated clicks on the same server", async () => {
   const results=await Promise.all([invite(),invite()]);
   expect(results.every(result=>result.status==="success")).toBe(true);
   expect(await invite()).toMatchObject({status:"success"});
   expect(m.link).toHaveBeenCalledTimes(1);expect(m.send).toHaveBeenCalledTimes(1);
 });
 it("authorizes every invocation even when a success is cached", async () => {
   await invite();m.authorize.mockRejectedValue(new Error("Forbidden"));
   await expect(invite()).rejects.toThrow("Forbidden");
   expect(m.send).toHaveBeenCalledTimes(1);
 });
 it("refuses any Auth identity other than Julien", async () => {
   m.link.mockResolvedValue({data:{user:{id:"other",email:"other@example.test"},properties:{hashed_token:"secret"}},error:null});
   expect(await invite()).toMatchObject({status:"error",emailSent:false});
   expect(m.grant).not.toHaveBeenCalled();expect(m.send).not.toHaveBeenCalled();
 });
});
