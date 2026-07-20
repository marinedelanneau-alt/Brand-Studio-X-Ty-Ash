import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/session";
import { getVersionReview, listEditorialVersions } from "@/lib/editorial-admin";
import { cancelSchedule, createDraftFromVersion, publishVersion, scheduleVersion } from "./actions";

export default async function VersionsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  await getAuthenticatedAdmin(); const params = await searchParams;
  let versions: Awaited<ReturnType<typeof listEditorialVersions>> = []; let error = "";
  try { versions = await listEditorialVersions(); } catch (cause) { unstable_rethrow(cause); error = cause instanceof Error ? cause.message : "Migration éditoriale indisponible"; }
  const selected = params.version ? await getVersionReview(params.version).catch(() => null) : null;
  return <div className="space-y-6">
    <section className="rounded-3xl border border-[#eadfca] bg-white p-6"><p className="text-xs font-black uppercase tracking-[.2em] text-[#cf7430]">Versioning éditorial</p>
      <h1 className="mt-3 text-4xl text-[#4b4550]">Historique des versions</h1><p className="mt-3 text-[#7b7068]">Brouillons, publications programmées et versions archivées. Les réponses utilisateur sont indépendantes de cet historique.</p>
      {params.message ? <p className="mt-4 rounded-xl bg-[#fff6e3] p-3">{params.message}</p> : null}{error ? <p className="mt-4 text-red-700">Applique d’abord la migration Supabase : {error}</p> : null}</section>
    {selected ? <section className="rounded-3xl border border-[#eadfca] bg-white p-6"><h2 className="text-2xl">Validation et comparaison</h2>
      <p className="mt-2">{selected.issues.filter(i=>i.severity==="error").length} erreur(s), {selected.issues.filter(i=>i.severity==="warning").length} avertissement(s), {selected.changes.length} changement(s).</p>
      <ul className="mt-4 space-y-2">{[...selected.issues,...selected.changes].map((item,index)=><li key={index} className="rounded-xl bg-[#fffaf2] p-3">{"message" in item ? item.message : `${item.kind} — ${item.stableKey} — ${item.details}`}</li>)}</ul></section> : null}
    <section className="space-y-3">{versions.map(version => <article key={version.id} className="rounded-2xl border border-[#eadfca] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{version.title} — version {version.version_number}</strong><p className="text-sm text-[#7b7068]">{version.status} · {new Intl.DateTimeFormat("fr-FR", {dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Paris"}).format(new Date(version.updated_at))}</p></div><div className="flex flex-wrap gap-2"><Link className="rounded-xl border px-3 py-2" href={`/admin/versions?version=${version.id}`}>Voir / comparer</Link>
      {version.status === "published" || version.status === "archived" ? <form action={createDraftFromVersion}><input type="hidden" name="versionId" value={version.id}/><button className="rounded-xl border px-3 py-2">Dupliquer en brouillon</button></form>:null}
      {version.status === "draft" ? <><form action={publishVersion}><input type="hidden" name="versionId" value={version.id}/><button className="rounded-xl bg-[#4b4550] px-3 py-2 text-white">Publier maintenant</button></form><form action={scheduleVersion} className="flex gap-2"><input type="hidden" name="versionId" value={version.id}/><input required name="publishAt" type="datetime-local" className="rounded-xl border px-2"/><button className="rounded-xl border px-3 py-2">Programmer</button></form></>:null}
      {version.status === "scheduled" ? <form action={cancelSchedule}><input type="hidden" name="versionId" value={version.id}/><button className="rounded-xl border px-3 py-2">Annuler la programmation</button></form>:null}</div></div></article>)}</section>
  </div>;
}
