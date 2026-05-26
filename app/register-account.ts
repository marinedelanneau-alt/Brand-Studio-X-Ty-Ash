"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  attachAuthUserToAccount,
  findAccountByCode,
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
  const activationCode =
    typeof formData.get("activationCode") === "string"
      ? String(formData.get("activationCode")).trim().toUpperCase().replace(/\s+/g, "")
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

  if (!activationCode || !email || !password || !clientName || !companyName) {
    return {
      status: "error",
      message: "Merci de remplir le code, l'e-mail, le mot de passe, le nom et l'entreprise.",
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
      message: "Le mot de passe doit contenir au moins 8 caracteres.",
    };
  }

  try {
    const activation = await findUsableActivationCode({
      code: activationCode,
      email,
    });
    const legacyAccount = activation ? null : await findAccountByCode(activationCode);

    if (!activation && !legacyAccount) {
      return {
        status: "error",
        message: "Code d'activation invalide, expire ou deja utilise.",
      };
    }

    if (legacyAccount && legacyAccount.email.toLowerCase() !== email) {
      return {
        status: "error",
        message: "Ce code n'est pas associe a cet e-mail.",
      };
    }

    const existingAccount = await findAccountByEmail(email);

    if (existingAccount?.auth_user_id) {
      return {
        status: "error",
        message: "Un compte existe deja avec cet e-mail. Connectez-vous directement.",
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
        message: authError?.message ?? "Le compte n'a pas pu etre cree.",
      };
    }

    if (legacyAccount) {
      await attachAuthUserToAccount({
        accountId: legacyAccount.id,
        authUserId: authData.user.id,
      });
    } else if (!existingAccount) {
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
        message: "Le compte client n'a pas pu etre retrouve apres creation.",
      };
    }

    if (activation) {
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
    }

    const authSupabase = await createSupabaseAuthServerClient();
    const { error: signInError } = await authSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return {
        status: "error",
        message: "Compte cree. Connectez-vous avec votre e-mail et votre mot de passe.",
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
        "L'activation du compte a echoue. Verifiez votre code ou contactez le support.",
    };
  }

  redirect("/register/success");
}
