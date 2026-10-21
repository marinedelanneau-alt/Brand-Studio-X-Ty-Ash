import "server-only";

// Never log the SDK error, request, headers, rawResponse, stack or email body.
// BrevoError.message itself includes the response body, so it is not a safe fallback.
export type BrevoDiagnostic = { httpStatus: number | null; code: string | null; message: string };

export class BrevoDeliveryError extends Error {
  constructor(readonly diagnostic: BrevoDiagnostic) {
    super("Envoi Brevo non confirmé.");
    this.name = "BrevoDeliveryError";
  }
}

export function getJulienBrevoDiagnostic(error: unknown, activationUrl: URL): BrevoDiagnostic {
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
    let safe = value.replace(/\\u([0-9a-f]{4})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16))).replace(/\\\//g, "/");
    for (let pass = 0; pass < 2; pass++) {
      try { safe = decodeURIComponent(safe); } catch { break; }
    }
    for (const secret of secrets) {
      for (const variant of [secret, encodeURIComponent(secret)]) safe = safe.split(variant).join("[REDACTED]");
    }
    // A provider may echo a serialized payload or authentication headers in its
    // message. Suppress that entire field instead of attempting to expose it.
    if (/action[_ -]?link|hashed[_ -]?token|token[_ -]?hash|access[_ -]?token|refresh[_ -]?token|\btoken\b|\bbearer\b|password|mot de passe|headers|authorization|api[-_]?key|service[_ -]?role|recovery[_ -]?link/i.test(safe)) {
      return "[REDACTED_SENSITIVE_DETAIL]";
    }
    return safe
      .replace(/https?:\/\/[^\s<>"']+/gi, "[REDACTED_URL]")
      .replace(/Bearer\s+[^\s,"'}]+/gi, "Bearer [REDACTED]")
      .replace(/\b(?:token_hash|access_token|refresh_token|token|api[-_]?key)\s*[:=]\s*[^\s,;"'}]+/gi, "[REDACTED_CREDENTIAL]")
      .replace(/\b[A-Za-z0-9_.+-]{32,}\b/g, "[REDACTED_OPAQUE_VALUE]")
      .replace(/[\r\n\t]/g, " ").slice(0, 1000);
  };
  const status = record.statusCode;
  return {
    httpStatus: typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    code: clean(body.code),
    message: clean(body.message) ?? (record.name === "BrevoTimeoutError"
      ? "Brevo request timed out; acceptance is unknown."
      : "No structured Brevo error response available."),
  };
}

export function logJulienBrevoFailure(error: unknown, activationUrl: URL): BrevoDiagnostic {
  const diagnostic = getJulienBrevoDiagnostic(error, activationUrl);
  console.error("[Ty Ash] Julien Brevo email failure", diagnostic);
  return diagnostic;
}
