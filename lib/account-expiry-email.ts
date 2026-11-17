import { formatAccessExpiry } from "./account-lifetime";

export function buildAccountExpiryEmail(input: {
  clientName: string | null; expiresAt: string; stage: "month" | "fortnight"; siteUrl: URL;
}) {
  const interval = input.stage === "month" ? "un mois" : "deux semaines";
  return {
    subject: `Votre accès Brand Studio expire dans ${interval} : sauvegardez vos données`,
    text: [
      input.clientName ? `Bonjour ${input.clientName},` : "Bonjour,",
      "",
      `Votre année d’accès à Brand Studio X Ty Ash arrive à son terme. Votre accès expirera le ${formatAccessExpiry(input.expiresAt)}.`,
      "",
      "À l’expiration, votre accès aux fonctionnalités payantes prendra fin, sans renouvellement automatique. Votre compte, vos réponses et vos fichiers seront conservés conformément à notre politique de conservation. Vous pouvez télécharger vos documents avant cette date.",
      "",
      `Connectez-vous à votre espace : ${new URL("/mon-espace", input.siteUrl)}`,
      `Téléchargez votre sauvegarde (connexion requise) : ${new URL("/api/account/backup", input.siteUrl)}`,
      "",
      "La sauvegarde ZIP contient vos réponses enregistrées et vos fichiers téléversés. Vous pouvez également télécharger vos documents PDF depuis votre espace.",
      "",
      "L’équipe Brand Studio X Ty Ash",
    ].join("\n"),
  };
}
