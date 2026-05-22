"use server";

import { revalidatePath } from "next/cache";
import type { GeneratedBrandGuide } from "@/lib/brand-guide";
import { saveBrandGuideSnapshot } from "@/lib/brand-guide";
import { getAuthenticatedAccount } from "@/lib/session";
import { getWorkspaceData } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

export async function saveBrandGuideExport(guide: GeneratedBrandGuide) {
  try {
    const account = await getAuthenticatedAccount();
    const workspace = await getWorkspaceData(account.id);

    if (!workspace.project) {
      return {
        status: "error" as const,
        message: "Creez d'abord votre projet de marque.",
      };
    }

    await saveBrandGuideSnapshot({
      projectId: workspace.project.id,
      guide,
    });

    revalidatePath("/brand-guide");
    revalidatePath("/mon-espace");

    return {
      status: "success" as const,
      message: "Ton Guide de Marque est pret. Le snapshot a ete sauvegarde.",
    };
  } catch (error) {
    return {
      status: "error" as const,
      message: getUserFacingDataErrorMessage(error),
    };
  }
}
