"use server";

import { createSupabaseAuthServerClient } from "@/lib/supabase/server";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

type LoginState = {
  status: "idle" | "error" | "success";
  message: string;
};

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
