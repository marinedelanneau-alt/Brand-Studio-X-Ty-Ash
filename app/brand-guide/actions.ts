"use server";

import { revalidatePath } from "next/cache";
import type { GeneratedBrandGuide } from "@/lib/brand-guide";
import { saveBrandGuideSnapshot } from "@/lib/brand-guide";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import { getWorkspaceData } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

export async function saveBrandGuideExport(guide: GeneratedBrandGuide) {
  try {
    const account = await getAuthenticatedAccount();
    if (!(await hasActiveAccess(account.id))) {
      return {
        status: "error" as const,
        message: "Débloque Brand Studio pour sauvegarder ton guide.",
      };
    }
    const workspace = await getWorkspaceData(account.id);

    if (!workspace.project) {
      return {
        status: "error" as const,
        message: "Crée d'abord ton projet de marque.",
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
      message: "Ton Guide de Marque est prêt. Le snapshot a été sauvegardé.",
    };
  } catch (error) {
    return {
      status: "error" as const,
      message: getUserFacingDataErrorMessage(error),
    };
  }
}
