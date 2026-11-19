export const ANNUAL_OFFER = {
  version: "tyash-beta-55-365-v1",
  name: "Brand Studio X TyASH — Accès 1 an",
  amount: 5200,
  currency: "eur",
  days: 365,
} as const;

export function annualAccessExpiresAt(paidAt: string) {
  const timestamp = Date.parse(paidAt);
  if (!Number.isFinite(timestamp)) throw new Error("Invalid payment date");
  return new Date(timestamp + ANNUAL_OFFER.days * 86400000).toISOString();
}

export function annualPaymentGrantsAccess(payment: { status: string; expires_at: string | null; paid_at: string | null }, now = Date.now()) {
  return payment.status === "paid" && !!payment.paid_at && !!payment.expires_at
    && Date.parse(payment.paid_at) <= now && Date.parse(payment.expires_at) > now;
}
