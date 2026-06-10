"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getAuthenticatedAccount } from "@/lib/session";
import { updateProjectLogoForAccount, uploadProjectLogo } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

type LogoState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function updateWorkspaceLogo(
  _prevState: LogoState,
  formData: FormData,
): Promise<LogoState> {
  try {
    const account = await getAuthenticatedAccount();
    const logo = formData.get("logo");

    if (!(logo instanceof File) || logo.size === 0) {
      return {
        status: "error",
        message: "Sélectionne un logo à importer.",
      };
    }

    if (!logo.type.startsWith("image/")) {
      return {
        status: "error",
        message: "Le fichier doit être une image.",
      };
    }

    if (logo.size > 5 * 1024 * 1024) {
      return {
        status: "error",
        message: "Le logo doit faire moins de 5 Mo.",
      };
    }

    const logoUrl = await uploadProjectLogo({
      accountId: account.id,
      file: logo,
    });

    await updateProjectLogoForAccount({
      accountId: account.id,
      logoUrl,
    });
  } catch (error) {
    unstable_rethrow(error);

    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }

  revalidatePath("/mon-espace");

  return {
    status: "success",
    message: "Logo mis à jour.",
  };
}
