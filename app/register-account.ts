"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  attachAuthUserToAccount,
  findAccountByEmail,
  insertAccount,
} from "@/lib/access-codes";
import {
  consumeActivationCode,
  findUsableActivationCode,
} from "@/lib/activation-codes";
import {
  createSupabaseAuthServerClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { upsertSubscription } from "@/lib/subscriptions";

type RegisterState = {
  status: "idle" | "error";
  message: string;
};

export async function registerAccount(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const registrationToken =
    typeof formData.get("registrationToken") === "string"
      ? String(formData.get("registrationToken")).trim().toUpperCase().replace(/\s+/g, "")
      : "";
  const email =
    typeof formData.get("email") === "string"
      ? String(formData.get("email")).trim().toLowerCase()
      : "";
  const password =
    typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const clientName =
    typeof formData.get("clientName") === "string"
      ? String(formData.get("clientName")).trim()
      : "";
  const companyName =
    typeof formData.get("companyName") === "string"
      ? String(formData.get("companyName")).trim()
      : "";

  if (!registrationToken || !email || !password || !clientName || !companyName) {
    return {
      status: "error",
      message: "Merci de remplir l'e-mail, le mot de passe, le nom et l'entreprise.",
    };
  }

  if (!email.includes("@")) {
    return {
      status: "error",
      message: "Merci de saisir un e-mail valide.",
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    };
  }

  try {
    const activation = await findUsableActivationCode({
      code: registrationToken,
      email,
    });

    if (!activation) {
      return {
        status: "error",
        message: "Ce lien personnel est invalide, expiré ou déjà utilisé.",
      };
    }

    const existingAccount = await findAccountByEmail(email);

    if (existingAccount?.auth_user_id) {
      return {
        status: "error",
        message: "Un compte existe déjà avec cet e-mail. Connecte-toi directement.",
      };
    }

    const adminSupabase = createSupabaseServerClient();
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          client_name: clientName,
          company_name: companyName,
        },
      });

    if (authError || !authData.user) {
      return {
        status: "error",
        message: authError?.message ?? "Le compte n'a pas pu être créé.",
      };
    }

    if (existingAccount) {
      await attachAuthUserToAccount({
        accountId: existingAccount.id,
        authUserId: authData.user.id,
      });
    } else {
      await insertAccount({
        code: null,
        authUserId: authData.user.id,
        email,
        clientName,
        companyName,
      });
    }

    const account = await findAccountByEmail(email);

    if (!account) {
      return {
        status: "error",
        message: "Le compte client n'a pas pu être retrouvé après création.",
      };
    }

    await upsertSubscription({
        userId: account.id,
        stripeCustomerId: activation.stripe_customer_id,
        stripeSubscriptionId: activation.stripe_subscription_id,
        stripeCheckoutSessionId: activation.stripe_checkout_session_id,
        priceId: activation.price_id,
        status: "paid",
        accessGranted: true,
      });

    await consumeActivationCode(activation.id);

    const authSupabase = await createSupabaseAuthServerClient();
    const { error: signInError } = await authSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return {
        status: "error",
        message: "Compte créé. Connecte-toi avec ton e-mail et ton mot de passe.",
      };
    }

    const cookieStore = await cookies();
    cookieStore.set("registration-client-name", clientName, {
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
        "La création du compte a échoué. Reprends ton lien personnel ou contacte le support.",
    };
  }

  redirect("/register/success");
}
