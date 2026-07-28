import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { shouldRequireAcceptance, type EnforcementMode } from "@/lib/legal-policy";
export { BRAND_STUDIO_FIRST_PUBLICATION_YEAR, copyrightText } from "@/lib/legal-policy";

export type LegalSection = { id: string; title: string; body: string };
export type LegalDocument = {
  id: string; document_type: string; version: string; title: string; slug: string;
  content: LegalSection[]; status: "draft"|"ready"|"published"|"archived";
  is_mandatory: boolean; requires_reacceptance: boolean; effective_at: string|null;
  published_at: string|null; updated_at: string; change_summary: string|null;
};

export function isLegalPreviewEnabled() {
  return process.env.VERCEL_ENV === "preview" && process.env.LEGAL_SYSTEM_UI_ENABLED === "true";
}

export async function getPublishedLegalDocument(type: string) {
  const { data } = await createSupabaseServerClient().from("legal_documents").select("*")
    .eq("document_type", type).eq("status", "published").maybeSingle();
  return data as LegalDocument | null;
}

export async function getLegalDocumentsForAdmin() {
  if (!isLegalPreviewEnabled()) return [];
  const { data, error } = await createSupabaseServerClient().from("legal_documents").select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as LegalDocument[];
}

export async function getCurrentTermsRequirement(userId: string, account: { created_at: string; role?: string; is_admin?: boolean }) {
  if (!isLegalPreviewEnabled()) return null;
  const db = createSupabaseServerClient();
  const [{ data: settings }, { data: document }] = await Promise.all([
    db.from("legal_system_settings").select("enforcement_mode,existing_user_cutoff").single(),
    db.from("legal_documents").select("*").eq("document_type","terms_of_use").eq("status","published").eq("is_mandatory",true).maybeSingle(),
  ]);
  if (!settings || !document) return null;
  const { data: acceptance } = await db.from("legal_acceptances").select("id")
    .eq("user_id", userId).eq("legal_document_id", document.id).maybeSingle();
  return shouldRequireAcceptance({
    mode: settings.enforcement_mode as EnforcementMode,
    isAdmin: account.role === "admin" || account.is_admin === true,
    createdAt: account.created_at,
    cutoff: settings.existing_user_cutoff,
    accepted: Boolean(acceptance),
  }) ? document as LegalDocument : null;
}
