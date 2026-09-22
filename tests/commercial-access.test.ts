import { afterEach, describe, expect, it, vi } from "vitest";
import { accessExpiresAt, allowsOfferAccess, BRAND_STUDIO_OFFER } from "../lib/brand-studio-offer";
import { isCommercialReleaseEnabled, isLegalReleaseEnabled } from "../lib/legal-release";
import { commercialReceipt } from "../lib/commercial-receipt";

afterEach(() => vi.unstubAllEnvs());
describe("historical access and paid offer", () => {
  it.each([undefined, null, "brand_studio", "beta", "legacy"])("preserves historical plan %s regardless of dates", (plan) => {
    for (const date of [null, "2000-01-01", "invalid"]) {
      expect(allowsOfferAccess(plan, true, date)).toBe(true);
      expect(allowsOfferAccess(plan, false, date)).toBe(false);
    }
  });
  it("expires only the explicit commercial plan at the exact boundary", () => {
    const expiry = "2027-09-22T12:00:00.000Z";
    expect(allowsOfferAccess(BRAND_STUDIO_OFFER.version, true, expiry, Date.parse(expiry) - 1)).toBe(true);
    expect(allowsOfferAccess(BRAND_STUDIO_OFFER.version, true, expiry, Date.parse(expiry))).toBe(false);
    expect(allowsOfferAccess(BRAND_STUDIO_OFFER.version, true, null)).toBe(false);
  });
  it("uses twelve calendar months with leap-day clamping", () => {
    expect(accessExpiresAt("2026-09-22T12:34:56Z")).toBe("2027-09-22T12:34:56.000Z");
    expect(accessExpiresAt("2024-02-29T12:34:56Z")).toBe("2025-02-28T12:34:56.000Z");
    expect(() => accessExpiresAt("invalid")).toThrow();
  });
  it("requires explicit independent release switches", () => {
    vi.stubEnv("BRAND_STUDIO_LEGAL_RELEASE", "");
    vi.stubEnv("BRAND_STUDIO_COMMERCIAL_RELEASE", "enabled");
    expect(isLegalReleaseEnabled()).toBe(false);
    expect(isCommercialReleaseEnabled()).toBe(false);
    vi.stubEnv("BRAND_STUDIO_LEGAL_RELEASE", "enabled");
    expect(isCommercialReleaseEnabled()).toBe(true);
    vi.stubEnv("BRAND_STUDIO_COMMERCIAL_RELEASE", "true");
    expect(isCommercialReleaseEnabled()).toBe(false);
  });
  it("embeds the purchased document snapshot in the durable confirmation", () => {
    const text = commercialReceipt({ session_id: "cs_test", paid_at: "2026-09-22", expires_at: "2027-09-22", amount: 28900, currency: "eur", consent: { immediateText: "Consentement conservé", acceptedAt: "2026-09-22" }, legal_snapshot: [{ title: "CGV", version: "v1", content: [{ id: "1", title: "Contrat", body: "Texte accepté" }] } as never] });
    for (const value of ["289.00 EUR", "2027-09-22", "Texte accepté", "Consentement conservé", "version v1"]) expect(text).toContain(value);
  });
});
