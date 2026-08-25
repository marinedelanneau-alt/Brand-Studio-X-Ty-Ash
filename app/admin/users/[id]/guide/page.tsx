import { notFound } from "next/navigation";
import BrandGuideLayout from "@/app/ui/brand-guide";
import { getAdminUser } from "@/lib/admin-user-insights";
import { getLatestBrandGuideExport } from "@/lib/brand-guide";

export default async function AdminUserGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser(Number((await params).id));
  if (!user?.projectId) notFound();
  const guide = await getLatestBrandGuideExport(user.projectId);
  if (!guide) notFound();
  return <BrandGuideLayout guide={guide.guide_snapshot} latestGeneratedAt={guide.generated_at} readOnly backHref={`/admin/users/${user.id}`} backLabel="Retour à la fiche" />;
}
