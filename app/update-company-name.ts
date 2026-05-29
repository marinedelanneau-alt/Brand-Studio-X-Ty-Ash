"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { updateAccountCompanyName } from "@/lib/access-codes";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { getAuthenticatedAccount } from "@/lib/session";

type CompanyNameState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function updateCompanyName(
  _prevState: CompanyNameState,
  formData: FormData,
): Promise<CompanyNameState> {
  try {
    const account = await getAuthenticatedAccount();
    const companyName =
      typeof formData.get("companyName") === "string"
        ? formData.get("companyName")!.toString().trim()
        : "";

    if (!companyName) {
      return {
        status: "error",
        message: "Ajoutez le nom de votre entreprise.",
      };
    }

    if (companyName.length > 120) {
      return {
        status: "error",
        message: "Le nom de l'entreprise doit faire moins de 120 caracteres.",
      };
    }

    await updateAccountCompanyName({
      accountId: account.id,
      companyName,
    });
  } catch (error) {
    unstable_rethrow(error);

    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }

  revalidatePath("/mon-espace");
  revalidatePath("/brand-guide");

  return {
    status: "success",
    message: "Nom d'entreprise mis a jour.",
  };
}
