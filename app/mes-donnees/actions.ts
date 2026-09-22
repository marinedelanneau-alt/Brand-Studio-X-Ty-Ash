"use server";
import { isLegalReleaseEnabled } from "@/lib/legal-release";
import { getAuthenticatedAccount } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function requestPrivacyAction(_state: { message: string }, formData: FormData) {
  if (!isLegalReleaseEnabled()) return { message: "Service non activé." };
  const account = await getAuthenticatedAccount();
  const requestType = String(formData.get("requestType") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!["access", "rectification", "erasure", "opposition", "restriction", "portability", "withdrawal"].includes(requestType) || message.length > 4000) return { message: "Vérifiez le type de demande et limitez le texte à 4 000 caractères." };
  if (formData.get("confirmed") !== "on") return { message: "Confirmez l’envoi de votre demande." };
  const db = createSupabaseServerClient();
  const { data: pending, error: lookupError } = await db.from("privacy_requests").select("id").eq("account_id", account.id).eq("request_type", requestType).neq("status", "completed").limit(1);
  if (lookupError) return { message: "Le service de demandes est momentanément indisponible. Réessayez ultérieurement." };
  if (pending?.length) return { message: "Une demande de ce type est déjà en cours de traitement." };
  const { data, error } = await db.from("privacy_requests").insert({ account_id: account.id, request_type: requestType, message }).select("id").single();
  if (error) return { message: "Votre demande n’a pas pu être enregistrée. Réessayez ultérieurement." };
  revalidatePath("/mes-donnees");
  return { message: `Demande enregistrée. Référence : ${data.id}. Elle sera examinée par l’équipe ; aucune suppression ni résiliation n’a encore été effectuée.` };
}
