"use server";
import { getApplicationReleaseState, getContentReleaseSnapshot } from "@/lib/content-releases";
import { getAuthenticatedClientReader } from "@/lib/session";
import { canReadClients } from "@/lib/account-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prefillQuestions } from "@/lib/questionnaire-admin";
import type { WorkspaceModule } from "@/lib/training-types";
import { revalidatePath } from "next/cache";
import { createProjectForAccount } from "@/lib/training";

export async function prepareTyashClientProject(form: FormData) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://cplzwnlstcpqqzqeawgs.supabase.co") throw new Error("Action réservée au projet TYASH.");
  const reader = await getAuthenticatedClientReader();
  if (!canReadClients(reader)) throw new Error("Accès refusé.");
  const accountId = Number(form.get("accountId"));
  if (!Number.isSafeInteger(accountId) || accountId <= 0) throw new Error("Compte invalide.");
  const { data: client, error } = await createSupabaseServerClient().from("client_access_codes").select("id,company_name,client_name").eq("id", accountId).single();
  if (error || !client) throw new Error("Compte client introuvable.");
  await createProjectForAccount(client.id, client.company_name || client.client_name || "Projet vidéo TYASH");
  revalidatePath(`/admin/clients/prepare/${accountId}`);
}

export async function saveTyashQuestionnairePrefill(_state: { message: string }, form: FormData) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://cplzwnlstcpqqzqeawgs.supabase.co") throw new Error("Action réservée au projet TYASH.");
  const reader = await getAuthenticatedClientReader();
  if (!canReadClients(reader)) throw new Error("Accès refusé.");
  const accountId = Number(form.get("accountId"));
  if (!Number.isSafeInteger(accountId) || accountId <= 0) return { message: "Compte invalide." };
  const db = createSupabaseServerClient();
  const { data: project, error } = await db.from("brand_projects").select("id,account_id").eq("account_id", accountId).maybeSingle();
  if (error || !project || project.account_id !== accountId) return { message: "Le client doit disposer d’un projet avant la préparation du questionnaire." };
  const state = await getApplicationReleaseState();
  const snapshot = await getContentReleaseSnapshot(state.current_draft_release_id ?? state.published_release_id);
  const questions = prefillQuestions((snapshot?.modules ?? []) as WorkspaceModule[]);
  if (!questions.length) return { message: "Aucune question configurable pour ce brouillon." };
  if (questions.some(q => !form.has(`present:${q.stableKey}`))) return { message: "Le brouillon a change. Rechargez la preparation avant de sauvegarder." };
  const rows = questions.map(q => ({ project_id: project.id, module_key: q.moduleKey, question_key: q.stableKey, values: form.getAll(q.stableKey).filter((v): v is string => typeof v === "string").map(v => v.trim()).filter(Boolean), updated_by: reader.id, updated_at: new Date().toISOString() }));
  if (rows.some(row => row.values.some(v => v.length > 20000))) return { message: "Une réponse dépasse la limite de 20 000 caractères." };
  const { error: saveError } = await db.from("tyash_questionnaire_prefills").upsert(rows, { onConflict: "project_id,question_key" });
  if (saveError) return { message: "Préremplissage indisponible. La migration TYASH dédiée doit être appliquée avant cette utilisation." };
  revalidatePath(`/admin/clients/prepare/${accountId}`);
  return { message: "Préremplissage enregistré. Les corrections du client et ses réponses existantes sont conservées." };
}
