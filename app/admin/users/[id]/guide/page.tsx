import { adminDocumentTitle, projectDocumentTitle } from "@/lib/project-document-copy";
import { notFound } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/session";
import BrandGuideLayout from "@/app/ui/brand-guide";
import AdminGuideDownload from "@/app/ui/admin-guide-download";
import { getAdminUser } from "@/lib/admin-user-insights";
import { generateGuideFromAnswers, getLatestBrandGuideExport } from "@/lib/brand-guide";
import { getWorkspaceData } from "@/lib/training";
import { isTyAshContent } from "@/lib/tyash-answer-identity";

export default async function AdminUserGuidePage({ params }: { params: Promise<{ id: string }> }) {
  await getAuthenticatedAdmin();
  const user = await getAdminUser(Number((await params).id));
  if (!user?.projectId) notFound();
  const saved = await getLatestBrandGuideExport(user.projectId);
  const workspace = projectDocumentTitle === "Carnet de projet" || saved?.guide_snapshot.projectNotebook ? await getWorkspaceData(user.id) : null;
  const current = workspace?.project && (projectDocumentTitle === "Carnet de projet" || workspace.modules.some(isTyAshContent))
    ? generateGuideFromAnswers({ project: workspace.project, modules: workspace.modules, brandName: user.company || workspace.project.name }) : null;
  const guide = current ?? saved?.guide_snapshot;
  if (!guide) notFound();
  return <><div className="bs-light-surface rounded-2xl bg-[var(--tyash-subtle)] p-5"><AdminGuideDownload userId={user.id} /><p className="mt-2 text-sm text-[var(--text-primary)]">{current ? "L’aperçu et le téléchargement utilisent les réponses actuelles du projet." : <>L’aperçu correspond au dernier {adminDocumentTitle} enregistré.</>}</p></div><BrandGuideLayout guide={guide} latestGeneratedAt={saved?.generated_at ?? null} readOnly backHref={`/admin/users/${user.id}`} backLabel="Retour à la fiche" /></>;
}
