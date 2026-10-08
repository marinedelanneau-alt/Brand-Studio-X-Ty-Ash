import "server-only";
import {
  createContentDraft,
  getApplicationReleaseState,
  getContentRelease,
  getContentReleaseSnapshot,
  listContentReleaseSchedules,
  markContentReleaseReady,
  publishContentRelease,
  updateCurrentDraftSnapshot,
  type ContentReleaseSnapshot,
} from "./content-releases";
import { normalizeReleaseSnapshotModules } from "./content-release-diff";
import { assertReleaseAnswerCompatibility, validateReleaseModules } from "./release-content-validation";

export async function getAdminReleaseWorkspace() {
  const state = await getApplicationReleaseState();
  const published = await getContentRelease(state.published_release_id);
  if (!published || published.status !== "published") {
    throw new Error("Release publiée officielle introuvable ou invalide.");
  }
  const releaseId = state.current_draft_release_id ?? state.published_release_id;
  const release = releaseId === published.id ? published : await getContentRelease(releaseId);
  if (!release || (releaseId !== published.id && !["draft", "ready"].includes(release.status))) {
    throw new Error("Brouillon officiel introuvable ou invalide.");
  }
  const snapshot = await getContentReleaseSnapshot(releaseId);
  if (!snapshot || snapshot.schema_version !== 1) throw new Error("Snapshot de release introuvable ou incompatible.");
  const modules = validateReleaseModules(snapshot.modules);
  return { state, release, snapshot, modules };
}

export async function saveAdminReleaseModules(modules: unknown[], expectedUpdatedAt: string) {
  const workspace = await getAdminReleaseWorkspace();
  if (workspace.snapshot.updated_at !== expectedUpdatedAt) {
    throw new Error("Le brouillon a changé pendant l'enregistrement. Recharge l'éditeur avant de réessayer.");
  }
  const publishedSnapshot = await getContentReleaseSnapshot(workspace.state.published_release_id);
  if (!publishedSnapshot) throw new Error("Snapshot publié introuvable.");
  const normalized = normalizeReleaseSnapshotModules(modules);
  assertReleaseAnswerCompatibility(publishedSnapshot.modules, normalized);
  let releaseId = workspace.release.id;
  let snapshotUpdatedAt = workspace.snapshot.updated_at;
  if (workspace.release.status !== "draft") {
    if (workspace.release.status === "ready") {
      const schedules = await listContentReleaseSchedules();
      if (schedules.some((item) => item.release_id === releaseId && ["scheduled", "processing"].includes(item.status))) {
        throw new Error("Annule le déploiement programmé avant de modifier cette version prête.");
      }
    }
    releaseId = String(await createContentDraft({
      sourceReleaseId: workspace.release.id,
      name: "Brouillon Brand Studio X Ty Ash",
      replaceCurrentDraft: workspace.release.status === "ready",
    }));
    const createdSnapshot = await getContentReleaseSnapshot(releaseId);
    if (!createdSnapshot) throw new Error("Snapshot du nouveau brouillon introuvable.");
    snapshotUpdatedAt = createdSnapshot.updated_at;
  }
  await updateCurrentDraftSnapshot({
    releaseId,
    expectedUpdatedAt: snapshotUpdatedAt,
    modules: normalized,
    brandGuideSettings: workspace.snapshot.brand_guide_settings,
    pdfSettings: workspace.snapshot.pdf_settings,
    interfaceSettings: workspace.snapshot.interface_settings,
  });
  return releaseId;
}

export async function verifyCurrentDraft(releaseId?: string): Promise<{
  releaseId: string; snapshot: ContentReleaseSnapshot; status: string;
}> {
  const workspace = await getAdminReleaseWorkspace();
  if (!workspace.state.current_draft_release_id ||
      (releaseId && releaseId !== workspace.state.current_draft_release_id)) {
    throw new Error("Aucun brouillon courant correspondant à publier.");
  }
  const publishedSnapshot = await getContentReleaseSnapshot(workspace.state.published_release_id);
  if (!publishedSnapshot) throw new Error("Snapshot publié introuvable.");
  assertReleaseAnswerCompatibility(publishedSnapshot.modules, workspace.snapshot.modules);
  return { releaseId: workspace.release.id, snapshot: workspace.snapshot, status: workspace.release.status };
}

export async function publishCurrentAdminRelease(notes: string, requestedReleaseId?: string) {
  const draft = await verifyCurrentDraft(requestedReleaseId);
  if (draft.status === "draft") await markContentReleaseReady({ releaseId: draft.releaseId, notes });
  await publishContentRelease({ releaseId: draft.releaseId, notes });
}
