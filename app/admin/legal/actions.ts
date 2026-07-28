"use server";
import { revalidatePath } from "next/cache";
import { getAuthenticatedAdmin } from "@/lib/session";
import { isLegalPreviewEnabled } from "@/lib/legal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function guard() {
  if (!isLegalPreviewEnabled()) throw new Error("Fonction disponible uniquement en Preview.");
  await getAuthenticatedAdmin();
  return createSupabaseServerClient();
}

export async function updateLegalDraft(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id"));
  const content = JSON.parse(String(formData.get("content")));
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
    const { error } = await db.rpc("publish_legal_document", { target_id: id });
    if (error) throw error;
  } else {
    if (!["ready", "archived"].includes(status)) throw new Error("Statut invalide");
    const { error } = await db.from("legal_documents").update({ status }).eq("id", id).neq("status", "published");
    if (error) throw error;
  }
  revalidatePath("/admin/legal");
}

export async function cloneLegalDocument(formData: FormData) {
  const db = await guard();
  const { error } = await db.rpc("clone_legal_document", {
    source_id: String(formData.get("id")), new_version: String(formData.get("newVersion")),
  });
  if (error) throw error;
  revalidatePath("/admin/legal");
}

export async function setEnforcement(formData: FormData) {
  const db = await guard();
  const { error } = await db.rpc("set_legal_enforcement", {
    target_mode: String(formData.get("mode")), confirmation: String(formData.get("confirmation") ?? ""),
  });
  if (error) throw error;
  revalidatePath("/admin/legal");
}
