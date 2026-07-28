import "server-only";

import { cookies } from "next/headers";
import {
  createSupabaseAuthServerClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { resolveReleaseSelectionIntent } from "@/lib/content-release-policy";

export const CONTENT_PREVIEW_COOKIE = "brand-studio-content-preview";

export type ContentReleaseStatus = "draft" | "ready" | "published" | "archived";
export type ContentPreviewMode = "current_answers" | "new_user";

export type ContentRelease = {
  id: string;
  version_number: number;
  name: string;
  status: ContentReleaseStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  source_release_id: string | null;
  notes: string | null;
};

export type ContentReleaseSnapshot = {
  release_id: string;
  schema_version: number;
  modules: unknown[];
  brand_guide_settings: Record<string, unknown>;
  pdf_settings: Record<string, unknown>;
  interface_settings: Record<string, unknown>;
  updated_at: string;
};

export type ReleaseState = {
  published_release_id: string;
  current_draft_release_id: string | null;
  updated_at: string;
};

export type ContentReleaseSchedule = {
  id: string;
  release_id: string;
  scheduled_at: string;
  timezone: string;
  notes: string;
  status: "scheduled" | "processing" | "published" | "cancelled" | "failed";
  error_message: string | null;
  created_at: string;
  published_at: string | null;
};

export type ActiveContentRelease = {
  source: "legacy" | "controlled";
  release: ContentRelease | null;
  publishedReleaseId: string | null;
  draftReleaseId: string | null;
  isPreviewMode: boolean;
  previewMode: ContentPreviewMode | null;
  warning: string | null;
};

type ViewerAccount = {
  role?: string | null;
  is_admin?: boolean | null;
};

function isAdmin(account: ViewerAccount | null | undefined) {
  return account?.role === "admin" || account?.is_admin === true;
}

export function isAdminDraftPreviewEnabled() {
  const environment =
    process.env.NEXT_PUBLIC_APP_ENV ??
    process.env.VERCEL_ENV ??
    (process.env.NODE_ENV === "development" ? "development" : "production");

  return (
    process.env.NEXT_PUBLIC_ENABLE_ADMIN_DRAFT_PREVIEW === "true" &&
    environment !== "production"
  );
}

export function isControlledProductionContentEnabled() {
  return process.env.CONTENT_RELEASE_READ_MODE === "controlled";
}

export function isControlledAdminPublishingEnabled() {
  return (
    isAdminDraftPreviewEnabled() ||
    process.env.ENABLE_CONTROLLED_ADMIN_PUBLISHING === "true"
  );
}

export async function getRequestedPreviewMode(): Promise<ContentPreviewMode | null> {
  if (!isAdminDraftPreviewEnabled()) return null;
  const value = (await cookies()).get(CONTENT_PREVIEW_COOKIE)?.value;
  return value === "new_user" || value === "current_answers" ? value : null;
}

export async function listContentReleases() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_releases")
    .select(
      "id,version_number,name,status,created_at,updated_at,published_at,source_release_id,notes",
    )
    .order("version_number", { ascending: false })
    .returns<ContentRelease[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getApplicationReleaseState() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("application_release_state")
    .select("published_release_id,current_draft_release_id,updated_at")
    .eq("id", 1)
    .maybeSingle<ReleaseState>();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("État des releases introuvable.");
  return data;
}

export async function getContentRelease(releaseId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_releases")
    .select(
      "id,version_number,name,status,created_at,updated_at,published_at,source_release_id,notes",
    )
    .eq("id", releaseId)
    .maybeSingle<ContentRelease>();

  if (error) throw new Error(error.message);
  return data;
}

export async function getContentReleaseSnapshot(releaseId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_release_snapshots")
    .select(
      "release_id,schema_version,modules,brand_guide_settings,pdf_settings,interface_settings,updated_at",
    )
    .eq("release_id", releaseId)
    .maybeSingle<ContentReleaseSnapshot>();

  if (error) throw new Error(error.message);
  return data;
}

export async function resolveActiveContentRelease(input: {
  account?: ViewerAccount | null;
  previewMode?: ContentPreviewMode | null;
}): Promise<ActiveContentRelease> {
  const initialIntent = resolveReleaseSelectionIntent({
    viewerIsAdmin: isAdmin(input.account),
    adminPreviewEnabled: isAdminDraftPreviewEnabled(),
    controlledProductionEnabled: isControlledProductionContentEnabled(),
    previewMode: input.previewMode ?? null,
    publishedReleaseId: null,
    draftReleaseId: null,
  });

  if (initialIntent.source === "legacy") {
    return {
      source: "legacy",
      release: null,
      publishedReleaseId: null,
      draftReleaseId: null,
      isPreviewMode: false,
      previewMode: null,
      warning: null,
    };
  }

  try {
    const state = await getApplicationReleaseState();
    const intent = resolveReleaseSelectionIntent({
      viewerIsAdmin: isAdmin(input.account),
      adminPreviewEnabled: isAdminDraftPreviewEnabled(),
      controlledProductionEnabled: isControlledProductionContentEnabled(),
      previewMode: input.previewMode ?? null,
      publishedReleaseId: state.published_release_id,
      draftReleaseId: state.current_draft_release_id,
    });
    const requestedReleaseId =
      intent.requestedReleaseId ?? state.published_release_id;
    const release = await getContentRelease(requestedReleaseId);
    const validPreview =
      intent.previewRequested &&
      release !== null &&
      (release.status === "draft" || release.status === "ready");

    if (!release || (intent.previewRequested && !validPreview)) {
      const published = await getContentRelease(state.published_release_id);
      return {
        source: "controlled",
        release: published,
        publishedReleaseId: state.published_release_id,
        draftReleaseId: state.current_draft_release_id,
        isPreviewMode: false,
        previewMode: null,
        warning: intent.previewRequested
          ? "Le brouillon est absent ou invalide. La version publiée reste affichée."
          : "La release publiée est introuvable.",
      };
    }

    return {
      source: "controlled",
      release,
      publishedReleaseId: state.published_release_id,
      draftReleaseId: state.current_draft_release_id,
      isPreviewMode: validPreview,
      previewMode: validPreview ? input.previewMode ?? null : null,
      warning: null,
    };
  } catch (error) {
    return {
      source: "legacy",
      release: null,
      publishedReleaseId: null,
      draftReleaseId: null,
      isPreviewMode: false,
      previewMode: null,
      warning:
        error instanceof Error
          ? `Système de releases indisponible : ${error.message}`
          : "Système de releases indisponible.",
    };
  }
}

async function callAuthenticatedReleaseRpc(
  name: string,
  parameters: Record<string, unknown>,
) {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.rpc(name, parameters);
  if (error) throw new Error(error.message);
  return data;
}

export function createContentDraft(input: {
  sourceReleaseId: string;
  name: string;
  replaceCurrentDraft?: boolean;
}) {
  return callAuthenticatedReleaseRpc("clone_content_release", {
    source_release_id: input.sourceReleaseId,
    draft_name: input.name,
    replace_current_draft: input.replaceCurrentDraft ?? false,
  });
}

export function markContentReleaseReady(input: {
  releaseId: string;
  notes: string;
}) {
  return callAuthenticatedReleaseRpc("mark_content_release_ready", {
    target_release_id: input.releaseId,
    release_notes: input.notes,
  });
}

export function publishContentRelease(input: {
  releaseId: string;
  notes: string;
}) {
  return callAuthenticatedReleaseRpc("publish_content_release", {
    draft_release_id: input.releaseId,
    release_notes: input.notes,
  });
}

export function scheduleContentRelease(input: {
  releaseId: string;
  scheduledAt: string;
  notes: string;
}) {
  return callAuthenticatedReleaseRpc("schedule_content_release", {
    target_release_id: input.releaseId,
    deployment_at: input.scheduledAt,
    deployment_notes: input.notes,
  });
}

export function cancelContentReleaseSchedule(scheduleId: string) {
  return callAuthenticatedReleaseRpc("cancel_content_release_schedule", {
    target_schedule_id: scheduleId,
  });
}

export async function listContentReleaseSchedules() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_release_schedules")
    .select(
      "id,release_id,scheduled_at,timezone,notes,status,error_message,created_at,published_at",
    )
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<ContentReleaseSchedule[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function updateCurrentDraftSnapshot(input: {
  releaseId: string;
  modules: unknown[];
  brandGuideSettings?: Record<string, unknown>;
  pdfSettings?: Record<string, unknown>;
  interfaceSettings?: Record<string, unknown>;
}) {
  return callAuthenticatedReleaseRpc("update_current_draft_snapshot", {
    target_release_id: input.releaseId,
    snapshot_schema_version: 1,
    snapshot_modules: input.modules,
    snapshot_brand_guide_settings: input.brandGuideSettings ?? {},
    snapshot_pdf_settings: input.pdfSettings ?? {},
    snapshot_interface_settings: input.interfaceSettings ?? {},
  });
}

export async function getAdminPreviewAnswers(input: {
  accountId: number;
  releaseId: string;
}) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_preview_answer_sets")
    .select("answers")
    .eq("admin_account_id", input.accountId)
    .eq("release_id", input.releaseId)
    .eq("mode", "new_user")
    .maybeSingle<{ answers: Record<string, Record<string, string[]>> }>();

  if (error) throw new Error(error.message);
  return data?.answers ?? {};
}

export function saveAdminPreviewAnswers(input: {
  releaseId: string;
  moduleKey: string;
  answers: Record<string, string[]>;
}) {
  return callAuthenticatedReleaseRpc("upsert_admin_preview_answers", {
    target_release_id: input.releaseId,
    module_key: input.moduleKey,
    module_answers: input.answers,
  });
}

export function clearAdminPreviewAnswers(releaseId: string) {
  return callAuthenticatedReleaseRpc("clear_admin_preview_answers", {
    target_release_id: releaseId,
  });
}

export function stableRolloutBucket(userId: number, featureKey: string) {
  let hash = 2166136261;
  const value = `${featureKey}:${userId}`;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

export async function isFeatureEnabled(input: {
  releaseId: string;
  featureKey: string;
  userId: number;
  isAdmin: boolean;
}) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("feature_configurations")
    .select("enabled,admin_only,rollout_percentage,allowed_user_ids")
    .eq("release_id", input.releaseId)
    .eq("stable_key", input.featureKey)
    .maybeSingle<{
      enabled: boolean;
      admin_only: boolean;
      rollout_percentage: number;
      allowed_user_ids: number[];
    }>();

  if (error || !data?.enabled) return false;
  if (data.admin_only) return input.isAdmin;
  if (data.allowed_user_ids.includes(input.userId)) return true;
  return stableRolloutBucket(input.userId, input.featureKey) < data.rollout_percentage;
}

export async function listFeatureConfigurations(releaseId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("feature_configurations")
    .select(
      "stable_key,enabled,admin_only,rollout_percentage,allowed_user_ids,configuration",
    )
    .eq("release_id", releaseId)
    .order("stable_key")
    .returns<
      Array<{
        stable_key: string;
        enabled: boolean;
        admin_only: boolean;
        rollout_percentage: number;
        allowed_user_ids: number[];
        configuration: Record<string, unknown>;
      }>
    >();
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function updateDraftFeatureConfiguration(input: {
  releaseId: string;
  featureKey: string;
  enabled: boolean;
  adminOnly: boolean;
  rolloutPercentage: number;
  allowedUserIds?: number[];
}) {
  return callAuthenticatedReleaseRpc("update_draft_feature_configuration", {
    target_release_id: input.releaseId,
    feature_key: input.featureKey,
    feature_enabled: input.enabled,
    feature_admin_only: input.adminOnly,
    feature_rollout_percentage: input.rolloutPercentage,
    feature_allowed_user_ids: input.allowedUserIds ?? [],
    feature_configuration: {},
  });
}
