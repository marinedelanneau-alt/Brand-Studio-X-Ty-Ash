"use server";
import { revalidatePath } from "next/cache";
import { getAuthenticatedAdmin } from "@/lib/session";
import { isLegalPreviewEnabled } from "@/lib/legal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";
import { legalDrafts, legalRoutes, validateLegalContent, isLegalDocumentReady } from "@/lib/legal-documents";

async function guard() {
  if (!isLegalPreviewEnabled()) throw new Error("Module juridique désactivé.");
  await getAuthenticatedAdmin();
  return createSupabaseServerClient();
}

export async function updateLegalDraft(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id"));
  const content = JSON.parse(String(formData.get("content")));
  if (!validateLegalContent(content)) throw new Error("Chaque section doit avoir un identifiant unique, un titre et un texte.");
  const { error } = await db.from("legal_documents").update({
    title: String(formData.get("title")), version: String(formData.get("version")),
    change_summary: String(formData.get("changeSummary")), content,
    is_mandatory: formData.get("mandatory") === "on",
    requires_reacceptance: formData.get("reacceptance") === "on",
  }).eq("id", id).eq("status", "draft");
  if (error) throw error;
  revalidatePath("/admin/legal");
}

export async function changeLegalStatus(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (status === "published") {
    const { data: draft } = await db.from("legal_documents").select("content").eq("id", id).single();
    if (!isLegalDocumentReady(draft?.content)) throw new Error("Complétez les mentions à compléter ou à valider avant publication.");
    const auth = await createSupabaseAuthServerClient();
    const { error } = await auth.rpc("publish_legal_document", { target_id: id });
    if (error) throw error;
  } else {
    if (!["ready", "archived"].includes(status)) throw new Error("Statut invalide");
    const { error } = await db.from("legal_documents").update({ status }).eq("id", id).neq("status", "published");
    if (error) throw error;
  }
  revalidatePath("/admin/legal");
}

export async function cloneLegalDocument(formData: FormData) {
  await guard();
  const db = await createSupabaseAuthServerClient();
  const { error } = await db.rpc("clone_legal_document", {
    source_id: String(formData.get("id")), new_version: String(formData.get("newVersion")),
  });
  if (error) throw error;
  revalidatePath("/admin/legal");
}

export async function setEnforcement(formData: FormData) {
  await guard();
  const db = await createSupabaseAuthServerClient();
  const { error } = await db.rpc("set_legal_enforcement", {
    target_mode: String(formData.get("mode")), confirmation: String(formData.get("confirmation") ?? ""),
  });
  if (error) throw error;
  revalidatePath("/admin/legal");
}

export async function prepareLegalDrafts() {
  const db = await guard();
  for (const draft of legalDrafts) {
    const { error } = await db.from("legal_documents").upsert({
      stable_key: `brand-studio-${draft.type}`, document_type: draft.type,
      version: "2026-09-preparation", title: draft.title,
      slug: legalRoutes[draft.type].slice(1), status: "draft",
      is_mandatory: draft.type === "terms_of_use", requires_reacceptance: draft.type === "terms_of_use",
      content: draft.sections.map(([title, body], index) => ({ id: `section-${index + 1}`, title, body })),
      change_summary: "Documents adaptés au service, à compléter avant publication.",
    }, { onConflict: "document_type,version", ignoreDuplicates: true });
    if (error) throw error;
  }
  revalidatePath("/admin/legal");
}
