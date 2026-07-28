"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CONTENT_PREVIEW_COOKIE,
  createContentDraft,
  isAdminDraftPreviewEnabled,
  markContentReleaseReady,
  publishContentRelease,
  updateDraftFeatureConfiguration,
  type ContentPreviewMode,
} from "@/lib/content-releases";
import { getAuthenticatedAdmin } from "@/lib/session";

function requiredString(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`Le champ ${name} est obligatoire.`);
  return value;
}

function releasesRedirect(message: string, kind: "success" | "error" = "success") {
  redirect(
    `/admin/releases?${new URLSearchParams({ message, kind }).toString()}`,
  );
}

export async function createDraftRelease(formData: FormData) {
  await getAuthenticatedAdmin();
  const sourceReleaseId = requiredString(formData, "sourceReleaseId");
  const name = requiredString(formData, "name");
  const replaceCurrentDraft = formData.get("replaceCurrentDraft") === "on";

  try {
    await createContentDraft({ sourceReleaseId, name, replaceCurrentDraft });
  } catch (error) {
    releasesRedirect(
      error instanceof Error ? error.message : "Le brouillon n’a pas pu être créé.",
      "error",
    );
  }
  revalidatePath("/admin/releases");
  releasesRedirect("Nouveau brouillon créé depuis la version sélectionnée.");
}

export async function markReleaseReady(formData: FormData) {
  await getAuthenticatedAdmin();
  const releaseId = requiredString(formData, "releaseId");
  const notes = requiredString(formData, "notes");
  try {
    await markContentReleaseReady({ releaseId, notes });
  } catch (error) {
    releasesRedirect(
      error instanceof Error ? error.message : "La release n’a pas pu être validée.",
      "error",
    );
  }
  revalidatePath("/admin/releases");
  releasesRedirect("La release est prête à publier. La production reste inchangée.");
}

export async function publishReleaseForAllUsers(formData: FormData) {
  await getAuthenticatedAdmin();
  const releaseId = requiredString(formData, "releaseId");
  const notes = requiredString(formData, "notes");
  const confirmation = requiredString(formData, "confirmation");

  if (confirmation !== "PUBLIER POUR TOUS") {
    releasesRedirect(
      "Saisis exactement « PUBLIER POUR TOUS » pour confirmer.",
      "error",
    );
  }

  try {
    await publishContentRelease({ releaseId, notes });
  } catch (error) {
    releasesRedirect(
      error instanceof Error ? error.message : "La publication a échoué.",
      "error",
    );
  }
  revalidatePath("/admin/releases");
  revalidatePath("/mon-espace");
  releasesRedirect("Release publiée atomiquement pour tous les utilisateurs.");
}

export async function enterContentPreview(formData: FormData) {
  await getAuthenticatedAdmin();
  if (!isAdminDraftPreviewEnabled()) {
    releasesRedirect(
      "L’aperçu brouillon est désactivé dans cet environnement.",
      "error",
    );
  }
  const mode = requiredString(formData, "mode") as ContentPreviewMode;
  if (mode !== "new_user" && mode !== "current_answers") {
    releasesRedirect("Mode d’aperçu invalide.", "error");
  }
  (await cookies()).set(CONTENT_PREVIEW_COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
  redirect("/mon-espace");
}

export async function exitContentPreview() {
  await getAuthenticatedAdmin();
  (await cookies()).delete(CONTENT_PREVIEW_COOKIE);
  redirect("/admin/releases");
}

export async function saveDraftFeatureFlag(formData: FormData) {
  await getAuthenticatedAdmin();
  const releaseId = requiredString(formData, "releaseId");
  const featureKey = requiredString(formData, "featureKey");
  const rolloutPercentage = Number(formData.get("rolloutPercentage"));
  const allowedUserIds = String(formData.get("allowedUserIds") ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
  if (!Number.isInteger(rolloutPercentage) || rolloutPercentage < 0 || rolloutPercentage > 100) {
    releasesRedirect("Le pourcentage doit être compris entre 0 et 100.", "error");
  }
  try {
    await updateDraftFeatureConfiguration({
      releaseId,
      featureKey,
      enabled: formData.get("enabled") === "on",
      adminOnly: formData.get("adminOnly") === "on",
      rolloutPercentage,
      allowedUserIds,
    });
  } catch (error) {
    releasesRedirect(
      error instanceof Error ? error.message : "Le feature flag n’a pas pu être enregistré.",
      "error",
    );
  }
  revalidatePath("/admin/releases");
  releasesRedirect("Feature flag enregistré uniquement dans le brouillon.");
}
