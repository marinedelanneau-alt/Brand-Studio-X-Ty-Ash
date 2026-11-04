import Link from "next/link";
import { getAuthenticatedAdmin } from "@/lib/session";
import { getAdminQuestionnaireArchives } from "@/lib/training";
import { changeQuestionnaireStructure } from "./actions";

export default async function QuestionnaireArchives() {
  const account = await getAuthenticatedAdmin();
  const modules = await getAdminQuestionnaireArchives(account.id);
  const targets = modules.filter(m => !m.archived).flatMap(m => m.submodules.filter(s => !s.archived).map(s => ({ id: s.id, label: `${m.title} / ${s.title}` })));
  return <section className="space-y-6"><Link href="/admin/modules" className="underline">← Éditeur des modules</Link><h1 className="text-3xl">Archives et déplacements</h1><p>Les archives conservent les identifiants et les réponses historiques. Une restauration ou un déplacement modifie uniquement le brouillon. Les éléments restaurés peuvent ensuite être modifiés dans l’éditeur.</p>{modules.map(m => {
    const hidden = <><input type="hidden" name="moduleId" value={m.id} /><input type="hidden" name="revision" value={m.editorRevision ?? m.updated_at ?? "initial"} /></>;
    return <section key={m.id} className="space-y-3 rounded-xl border p-4"><h2 className="text-xl font-semibold">{m.title}</h2>{m.archived && <form action={changeQuestionnaireStructure}>{hidden}<button className="underline">Restaurer le module</button></form>}{m.submodules.map(s => <div key={s.id} className="space-y-2"><h3 className="font-semibold">{s.title}{s.archived ? " — archivé" : ""}</h3>{s.archived && <form action={changeQuestionnaireStructure}>{hidden}<input type="hidden" name="submoduleId" value={s.id} /><button className="underline">Restaurer le sous-module</button></form>}{s.exercises.map(e => <form action={changeQuestionnaireStructure} key={e.id} className="flex flex-wrap items-center gap-3 border-t py-3">{hidden}<input type="hidden" name="questionId" value={e.id} /><p className="min-w-48 flex-1">{e.question}</p>{e.tyashQuestionnaire && e.tyashQuestionnaire.status !== "active" ? <button className="rounded border px-3 py-2">Restaurer la question {e.tyashQuestionnaire.status === "merged" ? "fusionnée" : "archivée"}</button> : <><select name="targetSubmoduleId" defaultValue={s.id} aria-label="Sous-module de destination" className="max-w-full rounded border p-2">{targets.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select><button className="rounded border px-3 py-2">Déplacer</button></>}</form>)}</div>)}</section>;
  })}</section>;
}
