"use server";

import { createSupabaseAuthServerClient } from "@/lib/supabase/server";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { headers } from "next/headers";

type LoginState = {
  status: "idle" | "error" | "success";
  message: string;
};

async function getPublicSiteUrl() {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const proto = forwardedProto ?? (host?.includes("localhost") ? "http" : "https");

  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_FORMATION_URL?.replace(/\/$/, "") ||
    "https://brand-studio-new.vercel.app"
  );
}

export async function loginWithPassword(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email =
    typeof formData.get("email") === "string"
      ? String(formData.get("email")).trim().toLowerCase()
      : "";
  const password =
    typeof formData.get("password") === "string" ? String(formData.get("password")) : "";

  if (!email || !password) {
    return {
      status: "error",
      message: "Merci de renseigner ton e-mail et ton mot de passe.",
    };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        status: "error",
        message: "Identifiants invalides.",
      };
    }

    return {
      status: "success",
      message: "Connexion réussie, redirection en cours...",
    };
  } catch (error) {
    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }
}

export async function sendPasswordlessLoginLink(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email =
    typeof formData.get("email") === "string"
      ? String(formData.get("email")).trim().toLowerCase()
      : "";

  if (!email) {
    return {
      status: "error",
      message: "Merci de renseigner ton e-mail pour recevoir le lien.",
    };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const siteUrl = await getPublicSiteUrl();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      return {
        status: "error",
        message: "Impossible d'envoyer le lien de connexion pour cet e-mail.",
      };
    }

    return {
      status: "success",
      message: "Lien de connexion envoye. Ouvre ta boite mail pour acceder a ton espace.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }
}

export async function sendPasswordResetLink(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email =
    typeof formData.get("email") === "string"
      ? String(formData.get("email")).trim().toLowerCase()
      : "";

  if (!email) {
    return {
      status: "error",
      message: "Merci de renseigner ton e-mail pour reinitialiser ton mot de passe.",
    };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const siteUrl = await getPublicSiteUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/reset/callback`,
    });

    if (error) {
      const resetErrorMessage = error.message.trim();

      return {
        status: "error",
        message:
          resetErrorMessage.toLowerCase().includes("redirect") ||
          resetErrorMessage.toLowerCase().includes("not allowed")
            ? "URL de reinitialisation non autorisee dans Supabase. Ajoute https://brand-studio-new.vercel.app/auth/reset/callback dans Authentication > URL Configuration > Redirect URLs."
            : `Impossible d'envoyer le lien de reinitialisation : ${resetErrorMessage}`,
      };
    }

    return {
      status: "success",
      message: "Lien de reinitialisation envoye. Ouvre ta boite mail pour choisir un nouveau mot de passe.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }
}

export async function updatePassword(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password =
    typeof formData.get("password") === "string" ? String(formData.get("password")) : "";

  if (password.length < 8) {
    return {
      status: "error",
      message: "Le mot de passe doit contenir au moins 8 caracteres.",
    };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return {
        status: "error",
        message: "Le mot de passe n'a pas pu etre mis a jour. Recommence depuis le lien recu par e-mail.",
      };
    }

    return {
      status: "success",
      message: "Mot de passe mis a jour. Redirection en cours...",
    };
  } catch (error) {
    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }
}
