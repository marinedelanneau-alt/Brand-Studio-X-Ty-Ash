import { createHash, randomBytes } from "node:crypto";

export const PURCHASE_COOKIE = "tyash_purchase_owner";
export const privateCookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
export function newPrivateToken() { return randomBytes(32).toString("hex"); }
export function fingerprint(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function normalizePurchaseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : null;
}
