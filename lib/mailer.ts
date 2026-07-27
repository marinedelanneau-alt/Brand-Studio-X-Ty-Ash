import "server-only";

import { BrevoClient } from "@getbrevo/brevo";

type SendAccessCodeEmailInput = {
  email: string;
  clientName: string;
  accessCode: string;
  companyName?: string | null;
};

type SendPasswordResetEmailInput = {
  email: string;
  resetUrl: string;
};

type SendAccountActivationEmailInput = {
  email: string;
  clientName: string;
  activationToken: string;
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
          <h1 style="margin:18px 0 12px; color:#1d2740; font-size:36px; line-height:1.1;">Ton code de connexion</h1>
          <p style="margin:0 0 20px; color:#5f6882; font-size:16px; line-height:1.7;">
            Bonjour ${input.clientName}, voici ton code d'accès pour te connecter à ton espace${input.companyName ? ` chez ${input.companyName}` : ""}.
          </p>
          <div style="padding:20px 24px; border-radius:18px; background:#fbf5ec; border:1px solid #ebdeca; margin:24px 0;">
            <p style="margin:0 0 8px; text-transform:uppercase; letter-spacing:0.22em; font-size:12px; color:#ab7331; font-weight:700;">Code personnel</p>
            <p style="margin:0; color:#1d2740; font-size:32px; font-weight:800; letter-spacing:0.16em;">${input.accessCode}</p>
          </div>
          <p style="margin:0 0 22px; color:#5f6882; font-size:15px; line-height:1.7;">
            Conserve ce code précieusement. Tu pourras aussi demander un nouvel envoi depuis l'écran de connexion.
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
    "Voici ton code de connexion Brand Studio :",
    input.accessCode,
    "",
    `Connecte-toi ici : ${dashboardUrl}`,
  ].join("\n");

  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Ton code de connexion Brand Studio",
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

function getPublicFormationUrl() {
  const configured =
    process.env.NEXT_PUBLIC_FORMATION_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://brand-studio-new.vercel.app";
  const unquoted = configured.trim().replace(/^(['"])(.*)\1$/, "$2");

  try {
    const url = new URL(unquoted);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url;
    }
  } catch {
    // Use the known production URL when an environment value is malformed.
  }

  return new URL("https://brand-studio-new.vercel.app");
}

export async function sendAccountActivationEmail(
  input: SendAccountActivationEmailInput,
) {
  const config = getBrevoConfig();
  const brevo = new BrevoClient({
    apiKey: config.apiKey,
    timeoutInSeconds: 30,
    maxRetries: 2,
  });
  const registerUrl = new URL("/register", getPublicFormationUrl());
  registerUrl.searchParams.set("activation", input.activationToken);
  const logoUrl = new URL("/logo.png", getPublicFormationUrl()).toString();
  const html = `
    <div style="margin:0; padding:40px 16px; background:#fffaf2; font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:620px; margin:0 auto; overflow:hidden; border:1px solid #eadfca; border-radius:28px; background:#ffffff; box-shadow:0 18px 46px rgba(126,102,78,0.10);">
        <div style="height:8px; background:linear-gradient(90deg,#cf7430 0%,#f0cf55 100%);"></div>
        <div style="padding:36px 38px 40px;">
          <img src="${logoUrl}" width="132" alt="Brand Studio" style="display:block; width:132px; height:auto; margin:0 0 30px;">
          <p style="margin:0; color:#cf7430; font-size:12px; font-weight:800; letter-spacing:0.22em; text-transform:uppercase;">Ton aventure commence ici</p>
          <h1 style="margin:14px 0 18px; color:#4b4550; font-family:Georgia,'Times New Roman',serif; font-size:40px; font-weight:500; line-height:1.05;">Bienvenue dans ton Brand Studio&nbsp;!</h1>
          <p style="margin:0 0 16px; color:#6f645b; font-size:16px; line-height:1.75;">
            Ton inscription est confirmée et ton espace est prêt. Tu vas pouvoir poser les fondations de ta marque, affirmer ce qui la rend unique et construire une identité qui te ressemble vraiment.
          </p>
          <p style="margin:0 0 28px; color:#6f645b; font-size:16px; line-height:1.75;">
            Crée maintenant ton compte et choisis ton mot de passe pour ouvrir les portes de ton studio et commencer ton parcours.
          </p>
          <a href="${registerUrl.toString()}" style="display:inline-block; padding:17px 26px; border-radius:16px; background:linear-gradient(135deg,#df9b39,#f1cc56); color:#ffffff; text-decoration:none; font-size:13px; font-weight:800; letter-spacing:0.10em; text-transform:uppercase; box-shadow:0 12px 26px rgba(223,155,57,0.22);">
            Créer mon espace
          </a>
          <div style="margin-top:30px; padding:18px 20px; border:1px solid #f0e4d3; border-radius:16px; background:#fffdf8;">
            <p style="margin:0; color:#7b7068; font-size:13px; line-height:1.65;">
              Ce lien est personnel, utilisable une seule fois et valable 30 jours.
            </p>
          </div>
          <p style="margin:30px 0 0; color:#4b4550; font-size:15px; line-height:1.7;">
            À tout de suite dans le studio,<br>
            <strong style="color:#cf7430;">L&apos;équipe Brand Studio</strong>
          </p>
        </div>
      </div>
      <p style="margin:20px auto 0; max-width:620px; color:#9a8f86; font-size:11px; line-height:1.6; text-align:center;">
        Brand Studio — construis une marque forte, cohérente et profondément singulière.
      </p>
    </div>
  `;

  const text = [
    "Bienvenue dans ton Brand Studio !",
    "",
    "Ton inscription est confirmée et ton espace est prêt.",
    "",
    "Crée ton compte et choisis ton mot de passe pour commencer ton parcours :",
    registerUrl.toString(),
    "",
    "Ce lien est personnel, utilisable une seule fois et valable 30 jours.",
    "",
    "À tout de suite dans le studio,",
    "L'équipe Brand Studio",
  ].join("\n");

  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Bienvenue dans ton Brand Studio ✨",
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

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const config = getBrevoConfig();
  const brevo = new BrevoClient({
    apiKey: config.apiKey,
    timeoutInSeconds: 30,
    maxRetries: 2,
  });
  const logoUrl = new URL("/logo.png", getPublicFormationUrl()).toString();

  const html = `
    <div style="margin:0; padding:40px 16px; background:#fffaf2; font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:620px; margin:0 auto; overflow:hidden; border:1px solid #eadfca; border-radius:28px; background:#ffffff; box-shadow:0 18px 46px rgba(126,102,78,0.10);">
        <div style="height:8px; background:linear-gradient(90deg,#cf7430 0%,#f0cf55 100%);"></div>
        <div style="padding:36px 38px 40px;">
          <img src="${logoUrl}" width="132" alt="Brand Studio" style="display:block; width:132px; height:auto; margin:0 0 30px;">
          <p style="margin:0; color:#cf7430; font-size:12px; font-weight:800; letter-spacing:0.22em; text-transform:uppercase;">Ton aventure commence ici</p>
          <h1 style="margin:14px 0 18px; color:#4b4550; font-family:Georgia,'Times New Roman',serif; font-size:40px; font-weight:500; line-height:1.05;">Bienvenue dans ton Brand Studio&nbsp;!</h1>
          <p style="margin:0 0 16px; color:#6f645b; font-size:16px; line-height:1.75;">
            Ton espace est prêt. Tu vas pouvoir poser les fondations de ta marque, affirmer ce qui la rend unique et construire une identité qui te ressemble vraiment.
          </p>
          <p style="margin:0 0 28px; color:#6f645b; font-size:16px; line-height:1.75;">
            Choisis maintenant ton mot de passe pour ouvrir les portes de ton studio et commencer ton parcours.
          </p>
          <a href="${input.resetUrl}" style="display:inline-block; padding:17px 26px; border-radius:16px; background:linear-gradient(135deg,#df9b39,#f1cc56); color:#ffffff; text-decoration:none; font-size:13px; font-weight:800; letter-spacing:0.10em; text-transform:uppercase; box-shadow:0 12px 26px rgba(223,155,57,0.22);">
            Créer mon mot de passe
          </a>
          <div style="margin-top:30px; padding:18px 20px; border:1px solid #f0e4d3; border-radius:16px; background:#fffdf8;">
            <p style="margin:0; color:#7b7068; font-size:13px; line-height:1.65;">
              Ce lien est personnel et temporaire. Si tu n&apos;es pas à l&apos;origine de cette demande, tu peux simplement ignorer cet e-mail.
            </p>
          </div>
          <p style="margin:30px 0 0; color:#4b4550; font-size:15px; line-height:1.7;">
            À tout de suite dans le studio,<br>
            <strong style="color:#cf7430;">L&apos;équipe Brand Studio</strong>
          </p>
        </div>
      </div>
      <p style="margin:20px auto 0; max-width:620px; color:#9a8f86; font-size:11px; line-height:1.6; text-align:center;">
        Brand Studio — construis une marque forte, cohérente et profondément singulière.
      </p>
    </div>
  `;

  const text = [
    "Bienvenue dans ton Brand Studio !",
    "",
    "Ton espace est prêt. Tu vas pouvoir poser les fondations de ta marque, affirmer ce qui la rend unique et construire une identité qui te ressemble vraiment.",
    "",
    "Choisis ton mot de passe pour commencer ton parcours :",
    input.resetUrl,
    "",
    "Ce lien est personnel et temporaire. Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.",
    "",
    "À tout de suite dans le studio,",
    "L'équipe Brand Studio",
  ].join("\n");

  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Bienvenue dans ton Brand Studio ✨",
    sender: {
      email: config.senderEmail,
      name: config.senderName,
    },
    to: [{ email: input.email }],
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
