"use server";

import { projectDocumentCopy, projectDocumentTitle } from "@/lib/project-document-copy";

import { revalidatePath } from "next/cache";
import type { GeneratedBrandGuide } from "@/lib/brand-guide";
import { generateGuideFromAnswers, saveBrandGuideSnapshot } from "@/lib/brand-guide";
import { isTyAshContent } from "@/lib/tyash-answer-identity";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import { getWorkspaceData } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import {
  getRequestedPreviewMode,
  resolveActiveContentRelease,
} from "@/lib/content-releases";

export async function saveBrandGuideExport(guide: GeneratedBrandGuide) {
  try {
    const account = await getAuthenticatedAccount();
    const preview = await resolveActiveContentRelease({
      account,
      previewMode: await getRequestedPreviewMode(),
    });
    if (!(await hasActiveAccess(account.id))) {
      return {
        status: "error" as const,
        message: projectDocumentCopy("Débloquez Brand Studio pour sauvegarder votre guide.", "Débloquez Brand Studio pour sauvegarder votre carnet de projet."),
      };
    }
    const workspace = await getWorkspaceData(account.id);

    if (!workspace.project) {
      return {
        status: "error" as const,
        message: projectDocumentCopy("Créez d'abord votre projet de marque.", "Créez d’abord votre projet."),
      };
    }

    if (preview.isPreviewMode) {
      return {
        status: "success" as const,
        message:
          "Aperçu généré sans modifier les exports enregistrés de la version publiée.",
      };
    }

    await saveBrandGuideSnapshot({
      projectId: workspace.project.id,
      guide: projectDocumentTitle === "Carnet de projet" || workspace.modules.some(isTyAshContent) ? generateGuideFromAnswers({
        project: workspace.project, modules: workspace.modules, brandName: account.company_name?.trim() || workspace.project.name,
      }) : guide,
    });

    revalidatePath("/brand-guide");
    revalidatePath("/mon-espace");

    return {
      status: "success" as const,
      message: projectDocumentCopy("Votre Guide de Marque est prêt. Le snapshot a été sauvegardé.", "Votre carnet de projet est prêt. Il a été sauvegardé."),
    };
  } catch (error) {
    return {
      status: "error" as const,
      message: getUserFacingDataErrorMessage(error),
    };
  }
}
