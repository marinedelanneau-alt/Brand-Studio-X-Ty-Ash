export const BRAND_STUDIO_OFFER = {
  version: "brand-studio-289-12m-v1",
  name: "Brand Studio",
  amount: 28900,
  currency: "eur",
  accessMonths: 12,
  mode: "payment",
  automaticRenewal: false,
} as const;

export const company = {
  name: "Marine DELANNEAU", status: "Entrepreneur individuel", siren: "880 074 497",
  activity: "Conseil en relations publiques et communication",
  locality: "36330 Le Poinçonnet", email: "contact@marined-communication.fr",
  address: "[ADRESSE PROFESSIONNELLE COMPLÈTE À RENSEIGNER]",
  vat: "[STATUT TVA À CONFIRMER]",
};

export function accessExpiresAt(paidAt: string) {
  const date = new Date(paidAt);
  if (!Number.isFinite(date.getTime())) throw new Error("Date de paiement invalide");
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString();
}

export function allowsOfferAccess(plan: string | null | undefined, granted: boolean, expiresAt: string | null, now = Date.now()) {
  if (!granted) return false;
  // Never retrofit an expiry to beta / historical accounts.
  if (plan !== BRAND_STUDIO_OFFER.version) return true;
  return Boolean(expiresAt && new Date(expiresAt).getTime() > now);
}

export const immediateServiceConsent = "Je demande expressément l’ouverture immédiate de mon accès à Brand Studio, avant la fin du délai légal de rétractation. Cette demande ne constitue pas, à elle seule, une renonciation à mon droit de rétractation.";
