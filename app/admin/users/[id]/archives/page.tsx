import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthenticatedClientReader } from "@/lib/session";
import { canReadClients } from "@/lib/account-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getApplicationReleaseState, getContentReleaseSnapshot } from "@/lib/content-releases";
import { validateReleaseModules } from "@/lib/release-content-validation";
import type { WorkspaceModule } from "@/lib/training-types";
import AdminAnswerValue from "@/app/ui/admin-answer-value";

export default async function ArchivedAnswersPage({ params }: { params: Promise<{ id: string }> }) {
  const reader = await getAuthenticatedClientReader();
  if (!canReadClients(reader)) notFound();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const db = createSupabaseServerClient();
  const { data: project, error } = await db.from("brand_projects").select("id").eq("account_id", id).maybeSingle();
  if (error || !project) notFound();
  const snapshot = await getContentReleaseSnapshot((await getApplicationReleaseState()).published_release_id);
  const modules = validateReleaseModules(snapshot?.modules) as unknown as WorkspaceModule[];
  const { data: rows, error: answerError } = await db.from("user_answers").select("module_key,question_key,answer_value").eq("project_id", project.id).eq("user_id", id);
  if (answerError) throw new Error("Les archives sont indisponibles.");
  return <section className="space-y-6"><Link href={`/admin/users/${id}`} className="underline">← Fiche client</Link><h1 className="text-3xl font-semibold">Archives des réponses</h1><p>Les questions retirées ou fusionnées et les justifications historiques restent consultables ici. Aucune réponse n’est supprimée.</p>{modules.map(m => <section key={m.id} className="space-y-4"><h2 className="text-xl font-bold">{m.title}</h2>{m.exercises.filter(e => e.tyashQuestionnaire?.status !== "active" || e.type === "spectrum").map(e => {
    const row = rows?.find(r => r.module_key === m.stableKey && r.question_key === e.stableKey);
    const values = row && Array.isArray(row.answer_value) ? row.answer_value.filter((v): v is string => typeof v === "string") : [];
    return values.length ? <article key={e.id} className="rounded-xl border border-[var(--border)] p-5"><h3 className="mb-3 font-semibold">{e.question}</h3><AdminAnswerValue values={values} type={e.type} showHistoricalJustification /></article> : null;
  })}</section>)}</section>;
}
