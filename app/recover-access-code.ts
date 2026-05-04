"use server";

import { findAccountByEmail } from "@/lib/access-codes";
import { sendAccessCodeEmail } from "@/lib/mailer";

type RecoverState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function recoverAccessCode(
  _prevState: RecoverState,
  formData: FormData,
): Promise<RecoverState> {
  const email =
    typeof formData.get("email") === "string"
      ? String(formData.get("email")).trim().toLowerCase()
      : "";

  if (!email) {
    return {
      status: "error",
      message: "Merci de renseigner votre e-mail.",
    };
  }

  if (!email.includes("@")) {
    return {
      status: "error",
      message: "Merci de saisir un e-mail valide.",
    };
  }

  let account = null;

  try {
    account = await findAccountByEmail(email);
  } catch {
    return {
      status: "error",
      message:
        "Impossible de verifier votre adresse pour le moment. Reessayez dans un instant.",
    };
  }

  if (!account) {
    return {
      status: "success",
      message:
        "Si un compte existe avec cet e-mail, un message contenant votre code vient d'etre envoye.",
    };
  }

  try {
    await sendAccessCodeEmail({
      email: account.email,
      clientName: account.client_name ?? "client",
      companyName: account.company_name,
      accessCode: account.code,
    });
  } catch {
    return {
      status: "error",
      message:
        "L'envoi de l'e-mail a echoue. Verifiez votre configuration Brevo.",
    };
  }

  return {
    status: "success",
    message:
      "Si un compte existe avec cet e-mail, un message contenant votre code vient d'etre envoye.",
  };
}
