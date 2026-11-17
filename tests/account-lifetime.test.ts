import { describe, expect, it } from "vitest";
import { isAccountExpired, isLifetimeExempt, getExpiryReminderStage } from "../lib/account-lifetime";
import { buildAccountExpiryEmail } from "../lib/account-expiry-email";

describe("one-year account lifetime", () => {
  it("protects Admins regardless of active flag and Julien without granting him Admin privileges", () => {
    for (const account of [{ is_admin: true }, { role: "admin" }, { email: " JSENE@TY-ASH.COM " }]) {
      expect(isLifetimeExempt(account)).toBe(true);
      expect(isAccountExpired({ ...account, access_expires_at: "2000-01-01", access_deletion_started_at: "2000-01-01" })).toBe(false);
    }
    expect(isLifetimeExempt({ role: "user", email: "client@example.test" })).toBe(false);
  });
  it("ends access at the exact boundary and while deletion is being retried", () => {
    const expiry = "2027-11-13T10:00:00Z";
    expect(isAccountExpired({ access_expires_at: expiry }, Date.parse(expiry) - 1)).toBe(false);
    expect(isAccountExpired({ access_expires_at: expiry }, Date.parse(expiry))).toBe(true);
    expect(isAccountExpired({ access_deletion_started_at: expiry }, Date.parse(expiry) - 1)).toBe(true);
    expect(isAccountExpired({})).toBe(false); // Deploy code before the database migration.
  });
  it("uses one calendar month and fourteen days, including short months", () => {
    const expiry = "2027-03-31T10:00:00Z";
    expect(getExpiryReminderStage(expiry, Date.parse("2027-02-28T09:59:59Z"))).toBeNull();
    expect(getExpiryReminderStage(expiry, Date.parse("2027-02-28T10:00:00Z"))).toBe("month");
    expect(getExpiryReminderStage(expiry, Date.parse("2027-03-17T10:00:00Z"))).toBe("fortnight");
    expect(getExpiryReminderStage(expiry, Date.parse(expiry))).toBeNull();
  });
  it("explains data retention, the exact date and backup link in both formal French reminders", () => {
    for (const stage of ["month", "fortnight"] as const) {
      const email = buildAccountExpiryEmail({ clientName: "Camille", stage, expiresAt: "2027-11-13T10:00:00Z", siteUrl: new URL("https://example.test") });
      expect(email.text).toContain("13 novembre 2027");
      expect(email.text).toContain("compte, vos réponses et vos fichiers seront conservés");
      expect(email.text).toContain("https://example.test/api/account/backup");
      expect(email.subject).toContain(stage === "month" ? "un mois" : "deux semaines");
    }
  });
});
