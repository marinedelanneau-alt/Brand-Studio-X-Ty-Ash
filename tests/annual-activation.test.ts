import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ order: vi.fn(), claim: vi.fn(), rpc: vi.fn(), create: vi.fn(), link: vi.fn(), send: vi.fn(), updates: [] as Record<string, unknown>[], upsert: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/mailer", () => ({ sendAnnualWelcomeEmail: m.send }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => {
  const q = { select: () => q, update: (data: Record<string, unknown>) => { m.updates.push(data); return q; },
    eq: () => q, is: () => q, or: () => q, single: m.order, maybeSingle: m.claim, upsert: m.upsert,
    then: (fn: (value: unknown) => unknown) => Promise.resolve({ error: null }).then(fn) };
  return { from: () => q, rpc: m.rpc, auth: { admin: { createUser: m.create, generateLink: m.link } } };
} }));
import { fulfillGuestAnnualAccount, deliverAnnualWelcome } from "../lib/annual-activation";
import { decryptAnnualEmail } from "../lib/annual-email-payload";
const order = { id: "order", purchase_email: "guest@example.test", auth_user_id: "auth", status: "paid", fulfillment_state: "pending", expires_at: new Date(Date.now()+86400000).toISOString(), activation_required: true, password_initialized_at: null };
beforeEach(() => {
  vi.resetAllMocks(); m.updates.length=0;
  vi.stubEnv("ANNUAL_ACTIVATION_ENCRYPTION_KEY", Buffer.alloc(32,1).toString("base64"));
  m.order.mockResolvedValue({ data: order, error: null });
  m.claim.mockResolvedValue({ data: { ...order, fulfillment_state: "ready" }, error: null });
  m.rpc.mockImplementation(async (name: string) => ({ data: name === "annual_auth_identity" ? [{ id: "auth", has_password: false }] : "ready", error: null }));
  m.create.mockResolvedValue({ data: { user: { id: "auth" } }, error: null });
  m.link.mockResolvedValue({ data: { user: { id: "auth" }, properties: { hashed_token: "b".repeat(64) } }, error: null });
  m.upsert.mockResolvedValue({ error: null }); m.send.mockResolvedValue("message55");
});
it("creates an Auth identity only after paid evidence and persists the email before sending", async () => {
  m.rpc.mockResolvedValueOnce({ data: [], error: null });
  await fulfillGuestAnnualAccount("order");
  expect(m.create).toHaveBeenCalledWith({ email: "guest@example.test", email_confirm: false });
  expect(m.rpc).toHaveBeenCalledWith("bind_guest_annual_payment", { target_order_id: "order", target_auth_user_id: "auth" });
  const encrypted = m.updates.find(data => data.email_payload)?.email_payload as string;
  expect(encrypted).not.toContain("token_hash");
  expect(decryptAnnualEmail(encrypted).url).toContain("/activer?token_hash=");
  expect(m.updates).toContainEqual({ email_message_id: "message55", email_sent_at: expect.any(String) });
});
it("does not create an account or send email for an unpaid checkout", async () => {
  m.order.mockResolvedValue({ data: { ...order, status: "pending" }, error: null });
  await fulfillGuestAnnualAccount("order"); expect(m.create).not.toHaveBeenCalled(); expect(m.send).not.toHaveBeenCalled();
});
it("reuses an existing identity and never generates an activation link for an existing password", async () => {
  m.rpc.mockImplementation(async (name: string) => ({ data: name === "annual_auth_identity" ? [{ id: "auth", has_password: true }] : "ready", error: null }));
  m.claim.mockResolvedValue({ data: { ...order, fulfillment_state: "ready", activation_required: false }, error: null });
  await fulfillGuestAnnualAccount("order");
  expect(m.create).not.toHaveBeenCalled(); expect(m.link).not.toHaveBeenCalled();
  expect(m.send).toHaveBeenCalledWith(expect.objectContaining({ activationUrl: undefined }));
});
it("does not resend an email already acknowledged on a duplicate webhook", async () => {
  m.order.mockResolvedValue({ data: { ...order, fulfillment_state: "ready", email_message_id: "sent" }, error: null });
  m.claim.mockResolvedValue({ data: null, error: null });
  await fulfillGuestAnnualAccount("order"); expect(m.send).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});
it("propagates a partial failure so Stripe can retry without deleting the created identity", async () => {
  m.send.mockRejectedValue(new Error("provider timeout"));
  await expect(fulfillGuestAnnualAccount("order")).rejects.toThrow("provider timeout");
  expect(m.updates.some(data => "email_payload" in data)).toBe(true);
  expect(m.updates.some(data => "email_message_id" in data)).toBe(false);
});
it("holds duplicate active/Admin/expired purchases for review without issuing reset links", async () => {
  m.rpc.mockImplementation(async (name: string) => ({ data: name === "annual_auth_identity" ? [{ id: "auth", has_password: true }] : "existing_access", error: null }));
  await fulfillGuestAnnualAccount("order"); expect(m.send).not.toHaveBeenCalled(); expect(m.link).not.toHaveBeenCalled();
});
it("uses the same encrypted payload and provider idempotency key after an uncertain send", async () => {
  await deliverAnnualWelcome("order");
  const payload = m.updates.find(data => data.email_payload)?.email_payload;
  const first = m.send.mock.calls[0][0];
  m.claim.mockResolvedValue({ data: { ...order, fulfillment_state: "ready", email_payload: payload }, error: null });
  m.link.mockClear();
  await deliverAnnualWelcome("order");
  expect(m.send.mock.calls[1][0]).toEqual(first); expect(m.link).not.toHaveBeenCalled();
});
