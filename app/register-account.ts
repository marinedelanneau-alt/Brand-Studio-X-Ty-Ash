"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  findAccountByEmail,
  insertAccount,
  isCodeAvailable,
} from "@/lib/access-codes";
import { sendAccessCodeEmail } from "@/lib/mailer";

type RegisterState = {
  status: "idle" | "error";
  message: string;
};

function generateAccessCode() {
  return `BRAND-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

async function generateUniqueAccessCode() {
  let generatedCode = generateAccessCode();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const available = await isCodeAvailable(generatedCode);
    if (available) {
      return generatedCode;
    }

    generatedCode = generateAccessCode();
  }

  return generatedCode;
}

export async function registerAccount(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email =
    typeof formData.get("email") === "string"
      ? String(formData.get("email")).trim().toLowerCase()
      : "";
  const clientName =
    typeof formData.get("clientName") === "string"
      ? String(formData.get("clientName")).trim()
      : "";
  const companyName =
    typeof formData.get("companyName") === "string"
      ? String(formData.get("companyName")).trim()
      : "";

  if (!email || !clientName || !companyName) {
    return {
      status: "error",
      message: "Merci de remplir l'email, le nom et l'entreprise.",
    };
  }

  if (!email.includes("@")) {
    return {
      status: "error",
      message: "Merci de saisir un email valide.",
    };
  }

  let generatedCode = "";
  let emailStatus = "sent";
  let emailWarning = "";

  try {
    const existingUser = await findAccountByEmail(email);

    if (!existingUser) {
      generatedCode = await generateUniqueAccessCode();
      await insertAccount({
        code: generatedCode,
        email,
        clientName,
        companyName,
      });
    } else {
      generatedCode = existingUser.code;
    }

    try {
      await sendAccessCodeEmail({
        email,
        clientName,
        companyName,
        accessCode: generatedCode,
      });
    } catch {
      emailStatus = "warning";
      emailWarning =
        "Le compte a bien ete cree, mais l'e-mail n'a pas pu etre envoye. Utilisez le code affiche ci-dessous.";
    }

    const cookieStore = await cookies();
    cookieStore.set("registration-access-code", generatedCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
    cookieStore.set("registration-client-name", clientName, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
    cookieStore.set("registration-email-status", emailStatus, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
    cookieStore.set("registration-email-warning", emailWarning, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
  } catch {
    return {
      status: "error",
      message:
        "Configuration Supabase incomplete. Ajoutez vos variables d'environnement pour activer l'inscription.",
    };
  }

  redirect("/register/success");
}
