import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key() {
  const value = Buffer.from(process.env.ANNUAL_ACTIVATION_ENCRYPTION_KEY ?? "", "base64");
  if (value.length !== 32) throw new Error("Missing annual activation encryption key");
  return value;
}
export function assertAnnualEmailEncryptionConfigured() { key(); }
export function encryptAnnualEmail(payload: { url?: string; expiresAt: number; deliveryKey: string }) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}
export function decryptAnnualEmail(value: string): { url?: string; expiresAt: number; deliveryKey: string } {
  const buffer = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), buffer.subarray(0,12));
  decipher.setAuthTag(buffer.subarray(12,28));
  return JSON.parse(Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString("utf8"));
}
