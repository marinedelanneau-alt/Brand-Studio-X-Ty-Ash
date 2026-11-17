import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), removeFiles: vi.fn(), deleteUser: vi.fn(), send: vi.fn(), update: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ rpc: m.rpc, from: m.from, auth: { admin: { deleteUser: m.deleteUser } } }) }));
vi.mock("@/lib/account-storage", () => ({ removeAccountFiles: m.removeFiles }));
vi.mock("@/lib/mailer", () => ({ sendAccountExpiryEmail: m.send }));
import { runAccountExpiryJobs } from "../lib/account-expiry-jobs";
import { GET } from "../app/api/cron/account-expiry/route";

const reminder = { account_id: 42, email: "client@example.test", client_name: "Camille", expires_at: "2026-12-01T10:00:00Z", claim_token: "claim" };
const expired = { id: 42, email: "client@example.test", role: "user", is_admin: false, auth_user_id: "auth-client", access_expires_at: "2026-11-01T10:00:00Z", access_deletion_token: "token" };
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test");
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-13T10:00:00Z"));
  m.rpc.mockImplementation(async (name: string) => ({ data: name === "claim_expired_accounts" ? [expired] : [], error: null }));
  m.deleteUser.mockResolvedValue({ error: null }); m.removeFiles.mockResolvedValue(undefined);
  m.send.mockResolvedValue("receipt");
  const query = {
    select: () => query, eq: () => query, is: () => query, update: m.update,
    maybeSingle: async () => ({ data: { ...reminder, role: "user", access_expires_at: reminder.expires_at }, error: null }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [{ id: 7 }], error: null }).then(resolve),
  };
  m.update.mockReturnValue(query); m.from.mockReturnValue(query);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("expiry worker", () => {
  it("never claims or deletes expired accounts, Auth identities or project files", async () => {
    expect((await runAccountExpiryJobs()).accountsDeleted).toBe(0);
    expect(m.removeFiles).not.toHaveBeenCalled();
    expect(m.deleteUser).not.toHaveBeenCalled();
    expect(m.rpc.mock.calls.every(([name]) => name === "claim_account_expiry_reminders")).toBe(true);
  });
  it("refuses any protected account even if an incorrect claim returns one", async () => {
    m.rpc.mockImplementation(async (name: string) => ({ data: name === "claim_expired_accounts" ? [{ ...expired, email: "jsene@ty-ash.com" }] : [], error: null }));
    expect((await runAccountExpiryJobs()).accountsDeleted).toBe(0);
    expect(m.removeFiles).not.toHaveBeenCalled(); expect(m.deleteUser).not.toHaveBeenCalled();
  });
  it("records a reminder only after the provider confirms receipt", async () => {
    m.rpc.mockImplementation(async (name: string, args: { reminder_stage?: string }) => ({ data: name === "claim_account_expiry_reminders" && args.reminder_stage === "month" ? [reminder] : [], error: null }));
    expect((await runAccountExpiryJobs()).remindersSent).toBe(1);
    expect(m.send).toHaveBeenCalledWith(expect.objectContaining({ stage: "month", email: reminder.email }));
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ message_id: "receipt" }));
    m.update.mockClear(); m.send.mockRejectedValueOnce(new Error("provider unavailable"));
    expect((await runAccountExpiryJobs()).remindersSent).toBe(0);
    expect(m.update).not.toHaveBeenCalled();
  });
  it("requires the cron secret before accessing any account", async () => {
    vi.stubEnv("CRON_SECRET", "secret");
    expect((await GET(new Request("https://example.test/api/cron/account-expiry"))).status).toBe(401);
    expect(m.rpc).not.toHaveBeenCalled();
    expect((await GET(new Request("https://example.test/api/cron/account-expiry", { headers: { authorization: "Bearer secret" } }))).status).toBe(200);
  });
});
