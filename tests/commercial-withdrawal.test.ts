import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ db: vi.fn(), mail: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.db }));
vi.mock("@/lib/mailer", () => ({ sendWithdrawalReceipt: mocks.mail }));
import { POST } from "../app/api/privacy/withdrawal/route";
const request = (extra = {}) => new Request("https://studio.example/api/privacy/withdrawal", { method: "POST", headers: { origin: "https://studio.example" }, body: JSON.stringify({ name: "Test", email: "buyer@example.test", receiptEmail: "receipt@example.test", sessionId: "cs_test_order", confirmed: true, ...extra }) });
describe("withdrawal without an account", () => {
  let declaration: Record<string, unknown> | null;
  let orderExists: boolean;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BRAND_STUDIO_LEGAL_RELEASE", "enabled");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://studio.example");
    declaration = null;
    orderExists = true;
    mocks.mail.mockResolvedValue(undefined);
    mocks.db.mockReturnValue({ from: (table: string) => {
      expect(["commercial_orders_v1", "commercial_withdrawals_v1"]).toContain(table);
      const query = {
        select: () => query,
        eq: (column: string, value: string) => { if (table === "commercial_orders_v1" && column === "email") expect(value).toBe("buyer@example.test"); return query; },
        not: () => query,
        maybeSingle: async () => ({ data: orderExists ? { session_id: "cs_test_order" } : null, error: null }),
        single: async () => ({ data: declaration, error: null }),
        upsert: async (payload: object, options: object) => {
          expect(options).toEqual({ onConflict: "session_id", ignoreDuplicates: true });
          declaration ??= { ...payload, received_at: "2026-09-22T12:00:00Z", receipt_sent_at: null };
          return { error: null };
        },
        update: (payload: object) => ({ eq: async () => { Object.assign(declaration!, payload); return { error: null }; } }),
      };
      return query;
    } });
  });
  afterEach(() => vi.unstubAllEnvs());
  it("stays unavailable until explicitly activated", async () => {
    vi.stubEnv("BRAND_STUDIO_LEGAL_RELEASE", "");
    expect((await POST(request())).status).toBe(404);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("requires explicit final confirmation", async () => {
    expect((await POST(request({ confirmed: false }))).status).toBe(400);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("records the declaration and sends its content and timestamp without changing access", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.mail).toHaveBeenCalledWith({ email: "receipt@example.test", text: expect.stringContaining("2026-09-22T12:00:00Z") });
    expect(mocks.mail.mock.calls[0][0].text).toContain("Je vous notifie ma rétractation");
    expect(declaration?.customer_name).toBe("Test");
  });
  it("does not disclose whether the order exists", async () => {
    const success = await (await POST(request())).json();
    orderExists = false;
    expect(await (await POST(request())).json()).toEqual(success);
    expect(mocks.mail).toHaveBeenCalledTimes(1);
  });
  it("retries delivery after a failure while preserving the first declaration", async () => {
    mocks.mail.mockRejectedValueOnce(new Error("Brevo unavailable"));
    expect((await POST(request())).status).toBe(503);
    const original = declaration;
    expect((await POST(request())).status).toBe(200);
    expect(declaration).toBe(original);
    expect((await POST(request())).status).toBe(200);
    expect(mocks.mail).toHaveBeenCalledTimes(2);
  });
});
