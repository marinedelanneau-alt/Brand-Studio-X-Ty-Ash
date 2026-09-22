import Link from "next/link";
import { getLegalDocumentsForAdmin, isLegalPreviewEnabled } from "@/lib/legal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { changeLegalStatus, cloneLegalDocument, setEnforcement, updateLegalDraft, prepareLegalDrafts } from "./actions";

const labels = { draft: "Brouillon", ready: "Prête à publier", published: "En ligne", archived: "Archivée" };
export const dynamic = "force-dynamic";

export default async function LegalAdminPage() {
  if (!isLegalPreviewEnabled()) return <div className="rounded-2xl border bg-white p-6">Ce module est désactivé hors environnement Preview.</div>;
  const documents = await getLegalDocumentsForAdmin();
  const db = createSupabaseServerClient();
  const [{ data: settings }, { data: acceptances }] = await Promise.all([
    db.from("legal_system_settings").select("*").single(),
    db.from("legal_acceptances").select("id,user_id,document_type,document_version,accepted_at,source").order("accepted_at",{ascending:false}).limit(100),
  ]);
  return <div className="mx-auto max-w-6xl space-y-6">
    <form action={prepareLegalDrafts}><button className="rounded-xl border bg-white px-4 py-3">Préparer les brouillons CGU, CGV, confidentialité et mentions légales</button></form>
    <Link href="/admin/privacy" className="inline-block underline">Traiter les demandes relatives aux données personnelles</Link>
    <header><p className="text-xs font-black uppercase tracking-widest text-[#cf7430]">Administration</p><h1 className="mt-2 text-3xl font-semibold">Documents juridiques</h1></header>
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">La publication de nouvelles CGU peut nécessiter une nouvelle acceptation des utilisateurs. Le contenu fourni ici est un canevas technique à faire valider juridiquement.</div>
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="text-xl font-semibold">Activation</h2><p className="mt-2 text-sm">Mode actuel : <b>{settings?.enforcement_mode ?? "disabled"}</b>. Publier un document et activer son application sont deux actions distinctes.</p>
      <form action={setEnforcement} className="mt-4 flex flex-wrap gap-3">
        <select name="mode" defaultValue={settings?.enforcement_mode} className="rounded-xl border px-3 py-2"><option value="disabled">Désactivé</option><option value="admin_only">Admin uniquement</option><option value="new_users_only">Nouveaux utilisateurs</option><option value="all_users">Tous les utilisateurs</option></select>
        <input name="confirmation" className="min-w-72 rounded-xl border px-3" placeholder="Confirmation requise pour tous" />
        <button className="rounded-xl bg-[#4b4550] px-4 py-2 text-white">Enregistrer</button>
      </form>
    </section>
    {documents.map((doc) => <section key={doc.id} className="rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="rounded-full bg-[#f5f1e8] px-3 py-1 text-xs font-bold">{labels[doc.status]}</span><h2 className="mt-3 text-xl font-semibold">{doc.title} · {doc.version}</h2></div><Link className="underline" target="_blank" href={`/${doc.slug}?preview=${doc.id}`}>Prévisualiser</Link></div>
      {doc.status === "draft" ? <form action={updateLegalDraft} className="mt-5 grid gap-3"><input type="hidden" name="id" value={doc.id}/><input name="title" defaultValue={doc.title} className="rounded-xl border p-3"/><input name="version" defaultValue={doc.version} className="rounded-xl border p-3"/><input name="changeSummary" defaultValue={doc.change_summary ?? ""} placeholder="Résumé des changements" className="rounded-xl border p-3"/><textarea name="content" defaultValue={JSON.stringify(doc.content,null,2)} rows={16} className="rounded-xl border p-3 font-mono text-xs"/><label><input type="checkbox" name="mandatory" defaultChecked={doc.is_mandatory}/> Version obligatoire</label><label><input type="checkbox" name="reacceptance" defaultChecked={doc.requires_reacceptance}/> Nouvelle acceptation nécessaire</label><button className="rounded-xl bg-[#4b4550] px-4 py-3 text-white">Enregistrer le brouillon</button></form> : null}
      <div className="mt-4 flex flex-wrap gap-2">{doc.status === "draft" ? <form action={changeLegalStatus}><input type="hidden" name="id" value={doc.id}/><input type="hidden" name="status" value="ready"/><button className="rounded-xl border px-3 py-2">Marquer prête</button></form>:null}{doc.status === "ready" ? <form action={changeLegalStatus}><input type="hidden" name="id" value={doc.id}/><input type="hidden" name="status" value="published"/><button className="rounded-xl bg-[#cf7430] px-3 py-2 text-white">Publier cette version</button></form>:null}<form action={cloneLegalDocument}><input type="hidden" name="id" value={doc.id}/><input name="newVersion" required placeholder="Nouvelle version" className="rounded-l-xl border p-2"/><button className="rounded-r-xl border p-2">Dupliquer / restaurer</button></form></div>
    </section>)}
    <section className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-semibold">Acceptations récentes</h2><div className="mt-3 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th>Utilisateur</th><th>Document</th><th>Version</th><th>Date</th><th>Source</th></tr></thead><tbody>{acceptances?.map(a=><tr key={a.id} className="border-t"><td className="py-2">{a.user_id}</td><td>{a.document_type}</td><td>{a.document_version}</td><td>{new Date(a.accepted_at).toLocaleString("fr-FR")}</td><td>{a.source}</td></tr>)}</tbody></table></div></section>
  </div>;
}
