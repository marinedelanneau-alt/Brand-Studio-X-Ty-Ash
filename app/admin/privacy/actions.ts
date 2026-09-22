"use server";
import { isLegalReleaseEnabled } from "@/lib/legal-release";
import { getAuthenticatedAdmin } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
export async function updatePrivacyRequest(formData: FormData) {
  if (!isLegalReleaseEnabled()) throw new Error("Service non activé.");
  await getAuthenticatedAdmin();
  const status = String(formData.get("status"));
  if (!["received", "processing", "completed"].includes(status)) throw new Error("Statut invalide.");
  const { error } = await createSupabaseServerClient().from("privacy_requests").update({ status, completed_at: status === "completed" ? new Date().toISOString() : null }).eq("id", String(formData.get("id")));
  if (error) throw error;
  revalidatePath("/admin/privacy");
  revalidatePath("/mes-donnees");
}
