export const JULIEN_LIFETIME_EMAIL = "jsene@ty-ash.com";

export type LifetimeAccount = {
  email?: string;
  role?: string;
  is_admin?: boolean;
  access_started_at?: string | null;
  access_expires_at?: string | null;
  access_deletion_started_at?: string | null;
};

// Independent of is_active: an inactive Admin must never enter the deletion queue.
export function isLifetimeExempt(account: LifetimeAccount): boolean {
  return account.is_admin === true || account.role === "admin"
    || account.email?.trim().toLowerCase() === JULIEN_LIFETIME_EMAIL;
}

export function isAccountExpired(account: LifetimeAccount, now = Date.now()): boolean {
  if (isLifetimeExempt(account)) return false;
  if (account.access_deletion_started_at) return true;
  return !!account.access_expires_at && Date.parse(account.access_expires_at) <= now;
}

export function getExpiryReminderStage(expiresAt: string, now = Date.now()): "month" | "fortnight" | null {
  const expiry = new Date(expiresAt);
  if (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= now) return null;
  if (expiry.getTime() - now <= 14 * 86400000) return "fortnight";
  const monthBefore = new Date(expiry);
  const day = monthBefore.getUTCDate();
  monthBefore.setUTCDate(1);
  monthBefore.setUTCMonth(monthBefore.getUTCMonth() - 1);
  const lastDay = new Date(Date.UTC(monthBefore.getUTCFullYear(), monthBefore.getUTCMonth() + 1, 0)).getUTCDate();
  monthBefore.setUTCDate(Math.min(day, lastDay));
  return now >= monthBefore.getTime() ? "month" : null;
}

export function formatAccessExpiry(expiresAt: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(expiresAt));
}
