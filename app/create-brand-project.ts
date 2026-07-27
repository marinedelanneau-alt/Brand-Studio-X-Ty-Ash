"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { updateAccountCompanyName } from "@/lib/access-codes";
import { createProjectForAccount, uploadProjectLogo } from "@/lib/training";
import { getAuthenticatedAccount } from "@/lib/session";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

type ProjectState = {
  status: "idle" | "error";
  message: string;
};

export async function createBrandProject(
  _prevState: ProjectState,
  formData: FormData,
): Promise<ProjectState> {
  try {
    const account = await getAuthenticatedAccount();
    const name =
      typeof formData.get("name") === "string"
        ? formData.get("name")!.toString().trim()
        : "";
    const logo = formData.get("logo");

    if (!name) {
      return {
        status: "error",
        message: "Ajoute un nom pour créer ton projet de marque.",
      };
    }

    let logoUrl: string | undefined;

    if (logo instanceof File && logo.size > 0) {
      const isImage = logo.type.startsWith("image/");
      const isAllowedSize = logo.size <= 5 * 1024 * 1024;

      if (!isImage) {
        return {
          status: "error",
          message: "Le logo doit être une image.",
        };
      }

      if (!isAllowedSize) {
        return {
          status: "error",
          message: "Le logo doit faire moins de 5 Mo.",
        };
      }

      logoUrl = await uploadProjectLogo({
        accountId: account.id,
        file: logo,
      });
    }

    await createProjectForAccount(account.id, name, logoUrl);
    await updateAccountCompanyName({
      accountId: account.id,
      companyName: name,
    });
  } catch (error) {
    unstable_rethrow(error);

    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }

  revalidatePath("/mon-espace");
  revalidatePath("/");

  return {
    status: "idle",
    message: "",
  };
}
