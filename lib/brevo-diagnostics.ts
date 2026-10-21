import "server-only";

// Never log the SDK error, request, headers, rawResponse, stack or email body.
// BrevoError.message itself includes the response body, so it is not a safe fallback.
export function logJulienBrevoFailure(error: unknown, activationUrl: URL) {
  const record = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const body = record.body && typeof record.body === "object" ? record.body as Record<string, unknown> : {};
  const secrets = [activationUrl.toString(),
    ...Array.from(activationUrl.searchParams.entries()).filter(([name]) => /token|code/i.test(name)).map(([, value]) => value),
    ...Object.entries(process.env)
      .filter(([name, value]) => /KEY|TOKEN|SECRET|PASSWORD/i.test(name) && !!value)
      .map(([, value]) => value as string),
  ].filter(Boolean).sort((a, b) => b.length - a.length);
  const clean = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    let safe = value;
    for (const secret of secrets) {
      for (const variant of [secret, encodeURIComponent(secret)]) safe = safe.split(variant).join("[REDACTED]");
    }
    return safe
      .replace(/https?:\/\/[^\s<>"']+/gi, "[REDACTED_URL]")
      .replace(/Bearer\s+[^\s,"'}]+/gi, "Bearer [REDACTED]")
      .replace(/\b(?:token_hash|access_token|refresh_token|token|api[-_]?key)\s*[:=]\s*[^\s,;"'}]+/gi, "[REDACTED_CREDENTIAL]")
      .replace(/\b[A-Za-z0-9_.+-]{32,}\b/g, "[REDACTED_OPAQUE_VALUE]")
      .replace(/[\r\n\t]/g, " ").slice(0, 1000);
  };
  const status = record.statusCode;
  console.error("[Ty Ash] Julien Brevo email failure", {
    httpStatus: typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    code: clean(body.code),
    message: clean(body.message) ?? (record.name === "BrevoTimeoutError"
      ? "Brevo request timed out; acceptance is unknown."
      : "No structured Brevo error response available."),
  });
}
