import "server-only";

import { BrevoClient } from "@getbrevo/brevo";

type SendAccessCodeEmailInput = {
  email: string;
  clientName: string;
  accessCode: string;
  companyName?: string | null;
};

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "Brand Studio";
  const replyToEmail = process.env.BREVO_REPLY_TO_EMAIL;
  const replyToName = process.env.BREVO_REPLY_TO_NAME ?? senderName;

  if (!apiKey || !senderEmail) {
    throw new Error("Missing Brevo environment variables");
  }

  return {
    apiKey,
    senderEmail,
    senderName,
    replyToEmail,
    replyToName,
  };
}

export async function sendAccessCodeEmail(input: SendAccessCodeEmailInput) {
  const config = getBrevoConfig();
  const brevo = new BrevoClient({
    apiKey: config.apiKey,
    timeoutInSeconds: 30,
    maxRetries: 2,
  });
  const dashboardUrl =
    process.env.NEXT_PUBLIC_FORMATION_URL ?? "http://localhost:3000";

  const html = `
    <div style="font-family: Arial, sans-serif; background:#f7f1e9; padding:32px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:24px; overflow:hidden; border:1px solid #eadfce;">
        <div style="height:6px; background:linear-gradient(90deg,#b67d3d,#e4bb72);"></div>
        <div style="padding:32px;">
          <p style="margin:0; letter-spacing:0.25em; text-transform:uppercase; font-size:12px; color:#ab7331; font-weight:700;">Brand Studio</p>
          <h1 style="margin:18px 0 12px; color:#1d2740; font-size:36px; line-height:1.1;">Votre code de connexion</h1>
          <p style="margin:0 0 20px; color:#5f6882; font-size:16px; line-height:1.7;">
            Bonjour ${input.clientName}, voici votre code d'acces pour vous connecter a votre espace${input.companyName ? ` chez ${input.companyName}` : ""}.
          </p>
          <div style="padding:20px 24px; border-radius:18px; background:#fbf5ec; border:1px solid #ebdeca; margin:24px 0;">
            <p style="margin:0 0 8px; text-transform:uppercase; letter-spacing:0.22em; font-size:12px; color:#ab7331; font-weight:700;">Code personnel</p>
            <p style="margin:0; color:#1d2740; font-size:32px; font-weight:800; letter-spacing:0.16em;">${input.accessCode}</p>
          </div>
          <p style="margin:0 0 22px; color:#5f6882; font-size:15px; line-height:1.7;">
            Conservez ce code precieusement. Vous pourrez aussi en demander l'envoi a nouveau depuis l'ecran de connexion.
          </p>
          <a href="${dashboardUrl}" style="display:inline-block; padding:16px 26px; border-radius:16px; background:linear-gradient(135deg,#b67d3d,#e4bb72); color:#17130d; text-decoration:none; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; font-size:13px;">
            Se connecter
          </a>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Bonjour ${input.clientName},`,
    "",
    "Voici votre code de connexion Brand Studio :",
    input.accessCode,
    "",
    `Connectez-vous ici : ${dashboardUrl}`,
  ].join("\n");

  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Votre code de connexion Brand Studio",
    sender: {
      email: config.senderEmail,
      name: config.senderName,
    },
    to: [
      {
        email: input.email,
        name: input.clientName,
      },
    ],
    replyTo: config.replyToEmail
      ? {
          email: config.replyToEmail,
          name: config.replyToName,
        }
      : undefined,
    htmlContent: html,
    textContent: text,
  });
}
