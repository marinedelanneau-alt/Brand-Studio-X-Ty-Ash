import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminUser } from "@/lib/admin-user-insights";
import { getLatestBrandGuideExport } from "@/lib/brand-guide";

function label(value: string) {
  return value.replaceAll(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
}

function SnapshotValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) return <div className="grid gap-3">{value.map((item, index) => <div key={index} className="rounded-xl bg-[#fff8f1] p-4"><SnapshotValue value={item} /></div>)}</div>;
  if (typeof value === "object") return <dl className="grid gap-5 md:grid-cols-2">{Object.entries(value).map(([key, item]) => item === null || item === "" ? null : <div key={key}><dt className="text-xs font-black uppercase tracking-[0.12em] text-[#7a736d]">{label(key)}</dt><dd className="mt-2 text-[#4f4944]"><SnapshotValue value={item} /></dd></div>)}</dl>;
  return <span className="whitespace-pre-wrap leading-7">{String(value)}</span>;
}

export default async function AdminUserGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser(Number((await params).id));
  if (!user?.projectId) notFound();
  const guide = await getLatestBrandGuideExport(user.projectId);
  if (!guide) notFound();
  return <div className="space-y-6"><Link href={`/admin/users/${user.id}`} className="text-sm font-bold text-[#cf7430]">← Retour à la fiche</Link><section className="bs-light-surface rounded-[1.6rem] border border-[#eadfca] bg-[linear-gradient(135deg,#fffdfa,#fff6e8)] p-7"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#cf7430]">Guide existant · lecture seule</p><h1 className="mt-4 font-[family:var(--font-cormorant)] text-5xl text-[#17213b]">Guide de marque — {user.company}</h1><p className="mt-3 text-sm text-[#7a736d]">Généré le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(guide.generated_at))}. Cette consultation ne régénère pas le guide.</p></section><section className="bs-light-surface rounded-[1.4rem] border border-[#eadfca] bg-white p-7"><SnapshotValue value={guide.guide_snapshot} /></section></div>;
}
