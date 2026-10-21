import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ send: vi.fn(), authorize: vi.fn(), grant: vi.fn(), list: vi.fn(), link: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@getbrevo/brevo", () => ({ BrevoClient: class { transactionalEmails = { sendTransacEmail: m.send }; } }));
vi.mock("@/lib/session", () => ({ getAuthenticatedInvitationAdmin: m.authorize }));
vi.mock("@/lib/julien-access", () => ({ grantJulienAccess: m.grant }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ auth: { admin: { listUsers: m.list, generateLink: m.link } } }) }));

beforeEach(() => {
  vi.resetModules(); vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cplzwnlstcpqqzqeawgs.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "supabase-service-secret");
  vi.stubEnv("BREVO_API_KEY", "brevo-api-secret");
  vi.stubEnv("BREVO_SENDER_EMAIL", "marine@example.test");
  m.list.mockResolvedValue({ data: { users: [{ id: "julien", email: "jsene@ty-ash.com" }] }, error: null });
  m.link.mockResolvedValue({ data: { user: { id: "julien", email: "jsene@ty-ash.com" }, properties: { hashed_token: "secure-hashed-token" } }, error: null });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

async function renderFailure(error: unknown) {
  m.send.mockRejectedValue(error);
  const { prepareAndSendJulienInvitation } = await import("../lib/julien-invitation");
  const state = await prepareAndSendJulienInvitation();
  const { default: Notice } = await import("../app/admin/clients/brevo-error-notice");
  const html = state.brevoError ? renderToStaticMarkup(createElement(Notice, { diagnostic: state.brevoError })) : "";
  return { state, html, serialized: JSON.stringify(state) };
}

describe("sanitized Brevo API diagnostic from real mailer to Admin UI", () => {
  it.each([[401, "unauthorized", "Key not found"], [400, "invalid_parameter", "Sender not valid"]])("renders Brevo HTTP %s, code and cleaned message", async (statusCode, code, message) => {
    const { state, html } = await renderFailure({ statusCode, body: { code, message } });
    expect(state).toMatchObject({ status: "error", account: "existing", accessGranted: true, emailSent: false, brevoError: { httpStatus: statusCode, code, message } });
    expect(html).toContain(`HTTP ${statusCode} — ${code} — ${message}`);
  });
  it.each([
    "brevo-api-secret supabase-service-secret secure-hashed-token",
    "action_link=https://example.test/recovery?token=hidden hashed_token=short password=tiny",
    '{"headers":{"Authorization":"Basic very-private","api-key":"short-key"},"password":"tiny"}',
    '{"token":"short-unknown-token","hashedToken":"short-hash","actionLink":"short-link"}',
    "https%3A%2F%2Fexample.test%2Frecovery%3Ftoken%3Dencoded-secret",
    String.raw`https:\/\/example.test\/recovery?hashed_token=escaped-secret`,
    String.raw`\u0070assword=unicode-secret`,
    "<img src=https://example.test/recovery?token=html-secret>",
  ])("never returns or renders secrets from provider fields: %s", async (message) => {
    const { html, serialized } = await renderFailure({ statusCode: 400, body: { code: "invalid_parameter", message }, rawResponse: { key: "raw-response-secret" }, message: "unsafe-sdk-message", stack: "unsafe-stack" });
    for (const secret of ["brevo-api-secret", "supabase-service-secret", "secure-hashed-token", "https://", "https%3A", "hidden", "tiny", "very-private", "short-key", "short-unknown-token", "short-hash", "short-link", "encoded-secret", "escaped-secret", "unicode-secret", "html-secret", "raw-response-secret", "unsafe-sdk-message", "unsafe-stack"]) {
      expect(serialized).not.toContain(secret); expect(html).not.toContain(secret);
    }
    expect(html).not.toContain("<img");
  });
  it("sanitizes the code field as well as the message", async () => {
    const { serialized } = await renderFailure({ statusCode: 401, body: { code: "brevo-api-secret", message: "Key not found" } });
    expect(serialized).not.toContain("brevo-api-secret");
  });
  it("uses a generic error when no structured API details exist", async () => {
    const { state, html } = await renderFailure(new Error("raw-error-with-password-and-token"));
    expect(state.brevoError).toEqual({ httpStatus: null, code: null, message: "No structured Brevo error response available." });
    expect(html).not.toContain("HTTP"); expect(html).not.toContain("raw-error");
  });
  it("rejects unauthorized callers before any mocked email or account operation", async () => {
    m.authorize.mockRejectedValue(new Error("Forbidden"));
    const { prepareAndSendJulienInvitation } = await import("../lib/julien-invitation");
    await expect(prepareAndSendJulienInvitation()).rejects.toThrow("Forbidden");
    expect(m.send).not.toHaveBeenCalled(); expect(m.grant).not.toHaveBeenCalled(); expect(m.list).not.toHaveBeenCalled();
  });
  it("does not expose unrelated raw errors before the email stage", async () => {
    m.grant.mockRejectedValue(new Error("supabase-service-secret https://example.test/?token=private"));
    const { prepareAndSendJulienInvitation } = await import("../lib/julien-invitation");
    const result = await prepareAndSendJulienInvitation();
    expect(result.message).toBe("Invitation impossible. Aucun email envoyé.");
    expect(result.brevoError).toBeUndefined(); expect(m.send).not.toHaveBeenCalled();
  });
});
