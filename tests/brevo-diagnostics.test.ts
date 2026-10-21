import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { logJulienBrevoFailure } from "../lib/brevo-diagnostics";

const link = new URL("https://brand-studio-x-ty-ash.vercel.app/auth/reset/callback?token_hash=activation-hash-secret&type=recovery");
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("BREVO_API_KEY", "brevo-api-key-secret");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "supabase-service-role-secret");
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("Brevo server diagnostics without credential or activation-link disclosure", () => {
  it.each([
    [400, "invalid_parameter", "Invalid sender"],
    [401, "unauthorized", "Key not found"],
    [403, "permission_denied", "Access denied"],
    [429, "too_many_requests", "Rate limit exceeded"],
    [500, "internal_error", "Internal server error"],
  ])("retains structured HTTP %s API diagnostics", (statusCode, code, message) => {
    logJulienBrevoFailure({ statusCode, body: { code, message } }, link);
    expect(console.error).toHaveBeenCalledExactlyOnceWith("[Ty Ash] Julien Brevo email failure", {
      httpStatus: statusCode, code, message,
    });
  });
  it("removes secrets and secure links even when echoed in a provider message", () => {
    logJulienBrevoFailure({ statusCode: 400, body: {
      code: "invalid_parameter",
      message: `Invalid sender; brevo-api-key-secret supabase-service-role-secret ${link} activation-hash-secret ${encodeURIComponent(link.toString())} Bearer unknown-bearer-token token=other-secret`,
      request: { apiKey: "brevo-api-key-secret" },
    }, message: "unsafe SDK message", rawResponse: { sensitive: "never log" }, stack: "unsafe stack" }, link);
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    for (const value of ["brevo-api-key-secret", "supabase-service-role-secret", "activation-hash-secret", "unknown-bearer-token", "other-secret", link.toString(), "unsafe SDK message", "unsafe stack", "never log"]) {
      expect(logged).not.toContain(value);
    }
    expect(logged).toContain("invalid_parameter");
    expect(logged).toContain("[REDACTED_SENSITIVE_DETAIL]");
  });
  it("does not pretend a timeout has an HTTP response", () => {
    logJulienBrevoFailure({ name: "BrevoTimeoutError", message: link.toString() }, link);
    expect(console.error).toHaveBeenCalledWith(expect.any(String), {
      httpStatus: null, code: null, message: "Brevo request timed out; acceptance is unknown.",
    });
  });
  it("does not serialize raw non-JSON responses or the SDK fallback message", () => {
    logJulienBrevoFailure({ body: `raw body ${link}`, message: `request ${link}`, statusCode: "401" }, link);
    expect(console.error).toHaveBeenCalledWith(expect.any(String), {
      httpStatus: null, code: null, message: "No structured Brevo error response available.",
    });
  });
});
