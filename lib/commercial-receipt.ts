import type { LegalDocument } from "@/lib/legal";

export function commercialReceipt(order: {
  session_id: string; paid_at: string; expires_at: string; amount: number;
  currency: string; legal_snapshot: LegalDocument[];
  consent: { immediateText: string; acceptedAt: string };
}) {
  return [
    "Confirmation de commande Brand Studio",
    `Référence : ${order.session_id}`,
    `Total payé : ${(order.amount / 100).toFixed(2)} ${order.currency.toUpperCase()}`,
    `Paiement confirmé : ${order.paid_at}`,
    `Accès jusqu'au : ${order.expires_at} (12 mois à compter du paiement)`,
    "Paiement unique, sans renouvellement automatique.",
    `Acceptation : ${order.consent.acceptedAt}`,
    order.consent.immediateText,
    "Contact et rétractation : contact@marined-communication.fr",
    "La fonctionnalité « Se rétracter du contrat » est accessible dans le pied de page du site, sans compte.",
    "Conservez ce document, qui contient les textes contractuels de votre commande.",
    ...order.legal_snapshot.map((document) => [
      `${document.title} — version ${document.version}`,
      ...document.content.map((section) => `${section.title}\n${section.body}`),
    ].join("\n\n")),
  ].join("\n\n");
}
