import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ tasks: [] as (() => Promise<void>)[], lookup: vi.fn(), deliver: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (task: () => Promise<void>) => { m.tasks.push(task); } }));
vi.mock("@/lib/annual-stripe", () => ({ annualLiveMode: () => false }));
vi.mock("@/lib/annual-activation", () => ({ deliverAnnualWelcome: m.deliver }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => {
  const q = { select: () => q, eq: () => q, is: () => q, gt: () => q, limit: () => q, maybeSingle: m.lookup }; return { from: () => q };
} }));
import { POST } from "../app/api/annual-activation/resend/route";
function request(email: string, origin = "https://studio.test") { return new Request("https://studio.test/api/annual-activation/resend", { method: "POST", headers: { origin }, body: JSON.stringify({ email }) }); }
beforeEach(() => { vi.resetAllMocks(); m.tasks.length=0; });
it("returns the same public response before any account lookup for known, unknown and malformed addresses", async () => {
  for (const email of ["paid@example.test", "unknown@example.test", "invalid"]) {
    const response = await POST(request(email)); expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Si un accès payé peut être activé avec cette adresse, un e-mail vous sera envoyé." });
  }
  expect(m.lookup).not.toHaveBeenCalled();
});
it("resends only for an eligible paid purchase and keeps unknown addresses silent", async () => {
  m.lookup.mockResolvedValueOnce({ data: { id: "paid-order" }, error: null }).mockResolvedValue({ data: null, error: null });
  await POST(request("paid@example.test")); await m.tasks[0]();
  expect(m.deliver).toHaveBeenCalledWith("paid-order", true);
  await POST(request("unknown@example.test")); await m.tasks[1](); expect(m.deliver).toHaveBeenCalledTimes(1);
});
it("rejects cross-origin resend requests", async () => {
  expect((await POST(request("paid@example.test", "https://other.test"))).status).toBe(403); expect(m.tasks).toHaveLength(0);
});
