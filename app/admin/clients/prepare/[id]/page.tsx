import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthenticatedClientReader } from "@/lib/session";
import { canReadClients } from "@/lib/account-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTyashPrefills } from "@/lib/tyash-questionnaire-prefill";
import { prefillQuestions } from "@/lib/questionnaire-admin";
import type { WorkspaceModule } from "@/lib/training-types";
import { getApplicationReleaseState, getContentReleaseSnapshot } from "@/lib/content-releases";
import PrefillForm from "./prefill-form";
import { prepareTyashClientProject } from "./actions";

export default async function PrepareQuestionnairePage({ params }: { params: Promise<{ id: string }> }) {
  const reader = await getAuthenticatedClientReader();
  if (!canReadClients(reader)) notFound();
  const accountId = Number((await params).id);
  if (!Number.isSafeInteger(accountId) || accountId <= 0) notFound();
  const db = createSupabaseServerClient();
  const { data: project, error } = await db.from("brand_projects").select("id,account_id,name").eq("account_id", accountId).maybeSingle();
  if (error) throw new Error("Le projet client est indisponible.");
  if (!project) return <section className="space-y-5"><h1 className="text-3xl">Préparer le questionnaire</h1><p>Vous pouvez préparer le projet avant la première connexion du client, sans créer de compte supplémentaire ni envoyer d’e-mail.</p><form action={prepareTyashClientProject}><input type="hidden" name="accountId" value={accountId} /><button className="bs-button-primary rounded-xl px-5 py-3">Préparer le projet de ce client</button></form><Link href="/admin/clients" className="underline">Retour aux clients</Link></section>;
  const state = await getApplicationReleaseState();
  const snapshot = await getContentReleaseSnapshot(state.current_draft_release_id ?? state.published_release_id);
  const definitions = prefillQuestions((snapshot?.modules ?? []) as WorkspaceModule[]);
  let prefills: Awaited<ReturnType<typeof getTyashPrefills>>;
  try { prefills = await getTyashPrefills(project.id); }
  catch { return <section className="space-y-4"><h1 className="text-3xl">Préparer le questionnaire</h1><p>Appliquer la migration TYASH de préremplissage avant d’utiliser cette fonctionnalité. Les réponses du client restent inchangées.</p><Link href="/admin/clients" className="underline">Retour aux clients</Link></section>; }
  const { data: answers, error: answerError } = await db.from("user_answers").select("question_key,module_key,answer_value").eq("project_id", project.id).eq("user_id", accountId);
  if (answerError) throw new Error("Les réponses du client sont indisponibles.");
  const questions = definitions.map(q => {
    const response = answers?.find(a => a.module_key === q.moduleKey && a.question_key === q.stableKey);
    return { stableKey: q.stableKey, label: q.label, type: q.type, options: q.options, values: prefills.find(p => p.question_key === q.stableKey)?.values ?? [], clientValues: response ? Array.isArray(response.answer_value) ? response.answer_value : [String(response.answer_value ?? "")] : null };
  });
  return <section className="mx-auto max-w-3xl space-y-6"><Link href="/admin/clients" className="underline">← Clients</Link><h1 className="text-3xl font-semibold">Préparer le questionnaire — {project.name}</h1><p>Ces réponses servent de base au client. Ses corrections restent prioritaires, y compris après une nouvelle publication.</p><PrefillForm accountId={accountId} questions={questions} /></section>;
}
