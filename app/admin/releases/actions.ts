"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CONTENT_PREVIEW_COOKIE,
  cancelContentReleaseSchedule,
  createContentDraft,
  isAdminDraftPreviewEnabled,
  markContentReleaseReady,
  publishContentRelease,
  scheduleContentRelease,
  updateDraftFeatureConfiguration,
  type ContentPreviewMode,
} from "@/lib/content-releases";
import { getAuthenticatedAdmin } from "@/lib/session";

function requiredString(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`Le champ ${name} est obligatoire.`);
  return value;
}

function releasesRedirect(
  message: string,
  kind: "success" | "error" = "success",
): never {
  redirect(
    `/admin/releases?${new URLSearchParams({ message, kind }).toString()}`,
  );
}

function parseParisLocalDate(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const intended = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = intended;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (let iteration = 0; iteration < 2; iteration += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidate))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    );
    const observed = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    candidate += intended - observed;
  }
  return new Date(candidate);
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

export async function scheduleReleaseForAllUsers(formData: FormData) {
  await getAuthenticatedAdmin();
  const releaseId = requiredString(formData, "releaseId");
  const notes = requiredString(formData, "notes");
  const confirmation = requiredString(formData, "confirmation");
  const scheduledAtLocal = requiredString(formData, "scheduledAt");
  if (confirmation !== "DÉPLOYER À TOUS") {
    releasesRedirect(
      "Saisis exactement « DÉPLOYER À TOUS » pour confirmer.",
      "error",
    );
  }
  const scheduledAt = parseParisLocalDate(scheduledAtLocal);
  if (!scheduledAt || scheduledAt <= new Date()) {
    releasesRedirect("Choisis une date de déploiement future.", "error");
  }
  try {
    await scheduleContentRelease({
      releaseId,
      notes,
      scheduledAt: scheduledAt.toISOString(),
    });
  } catch (error) {
    releasesRedirect(
      error instanceof Error ? error.message : "La programmation a échoué.",
      "error",
    );
  }
  revalidatePath("/admin/releases");
  releasesRedirect(
    `Déploiement programmé pour le ${scheduledAt.toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
    })}.`,
  );
}

export async function cancelScheduledRelease(formData: FormData) {
  await getAuthenticatedAdmin();
  const scheduleId = requiredString(formData, "scheduleId");
  try {
    await cancelContentReleaseSchedule(scheduleId);
  } catch (error) {
    releasesRedirect(
      error instanceof Error ? error.message : "L’annulation a échoué.",
      "error",
    );
  }
  revalidatePath("/admin/releases");
  releasesRedirect("Le déploiement programmé a été annulé.");
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
