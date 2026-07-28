"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/session";
import { callEditorialRpc, getVersionReview } from "@/lib/editorial-admin";
import { isControlledAdminPublishingEnabled } from "@/lib/content-releases";

const id = (formData: FormData) => String(formData.get("versionId") ?? "");

function refresh(message: string) {
  revalidatePath("/admin/versions");
  redirect(`/admin/versions?message=${encodeURIComponent(message)}`);
}

function blockLegacyVersioning() {
  if (isControlledAdminPublishingEnabled()) {
    redirect(
      "/admin/releases?kind=error&message=Le%20versionnement%20historique%20est%20désactivé.",
    );
  }
}

export async function createDraftFromVersion(formData: FormData) {
  blockLegacyVersioning();
  await getAuthenticatedAdmin();
  await callEditorialRpc("create_module_draft", {
    source_version_id: id(formData),
  });
  refresh("Brouillon créé.");
}

export async function publishVersion(formData: FormData) {
  blockLegacyVersioning();
  await getAuthenticatedAdmin();
  const versionId = id(formData);
  const review = await getVersionReview(versionId);
  if (review.issues.some((item) => item.severity === "error")) {
    refresh("Publication bloquée : corrige les erreurs critiques.");
  }
  await callEditorialRpc("publish_module_version", {
    target_version_id: versionId,
    audit_metadata: { notes: String(formData.get("notes") ?? "") },
  });
  revalidatePath("/mon-espace");
  revalidatePath("/mon-espace/module/[moduleId]", "page");
  refresh("Version publiée. Les réponses sont conservées.");
}

export async function scheduleVersion(formData: FormData) {
  blockLegacyVersioning();
  await getAuthenticatedAdmin();
  const localDate = String(formData.get("publishAt") ?? "");
  const publishAt = new Date(localDate);
  if (!localDate || Number.isNaN(publishAt.valueOf())) refresh("Date invalide.");
  await callEditorialRpc("schedule_module_version", {
    target_version_id: id(formData),
    publish_at: publishAt.toISOString(),
    timezone_name: "Europe/Paris",
    notes: String(formData.get("notes") ?? ""),
  });
  refresh("Publication programmée.");
}

export async function cancelSchedule(formData: FormData) {
  blockLegacyVersioning();
  await getAuthenticatedAdmin();
  await callEditorialRpc("cancel_scheduled_version", {
    target_version_id: id(formData),
  });
  refresh("Programmation annulée.");
}
