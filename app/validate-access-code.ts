"use server";

import { cookies } from "next/headers";
import { findAccountByCode } from "@/lib/access-codes";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

type ActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function validateAccessCode(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawCode = formData.get("accessCode");
  const accessCode =
    typeof rawCode === "string"
      ? rawCode.trim().toUpperCase().replace(/\s+/g, "")
      : "";

  if (!accessCode) {
    return {
      status: "error",
      message: "Merci de renseigner ton code d'accès.",
    };
  }

  try {
    const data = await findAccountByCode(accessCode);

    if (!data || data.is_active === false) {
      return {
        status: "error",
        message: "Code invalide ou désactivé. Réessaie avec ton accès.",
      };
    }

    const cookieStore = await cookies();
    cookieStore.set("formation-access", accessCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set("formation-client-name", data.client_name ?? "client", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const labelText =
      typeof data.client_name === "string" && data.client_name.trim().length > 0
        ? data.client_name
        : "client";

    return {
      status: "success",
      message: `Bienvenue ${labelText}, redirection en cours...`,
    };
  } catch (error) {
    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }
}
