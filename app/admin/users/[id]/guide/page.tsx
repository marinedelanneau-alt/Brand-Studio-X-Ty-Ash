import { notFound } from "next/navigation";
import BrandGuideLayout from "@/app/ui/brand-guide";
import AdminGuideDownload from "@/app/ui/admin-guide-download";
import { getAdminUser } from "@/lib/admin-user-insights";
import { getLatestBrandGuideExport } from "@/lib/brand-guide";

export default async function AdminUserGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser(Number((await params).id));
  if (!user?.projectId) notFound();
  const guide = await getLatestBrandGuideExport(user.projectId);
  if (!guide) notFound();
  return <><div className="bs-light-surface rounded-2xl bg-[var(--tyash-subtle)] p-5"><AdminGuideDownload userId={user.id} /><p className="mt-2 text-sm text-[var(--text-primary)]">Le téléchargement utilise les réponses actuelles ; l’aperçu ci-dessous correspond au dernier guide enregistré.</p></div><BrandGuideLayout guide={guide.guide_snapshot} latestGeneratedAt={guide.generated_at} readOnly backHref={`/admin/users/${user.id}`} backLabel="Retour à la fiche" /></>;
}
