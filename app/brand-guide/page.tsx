import { redirect, unstable_rethrow } from "next/navigation";
import BrandGuideLayout from "@/app/ui/brand-guide";
import DatabaseErrorState from "@/app/ui/database-error-state";
import {
  generateGuideFromAnswers,
  getLatestBrandGuideExport,
} from "@/lib/brand-guide";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import { getWorkspaceData } from "@/lib/training";
import ContentPreviewFrame from "@/app/ui/content-preview-frame";

export const dynamic = "force-dynamic";

export default async function BrandGuidePage() {
  let workspace: Awaited<ReturnType<typeof getWorkspaceData>> | null = null;
  let latestGeneratedAt: string | null = null;
  let accountBrandName = "";
  let loadError = "";

  try {
    const account = await getAuthenticatedAccount();
    accountBrandName = account.company_name?.trim() ?? "";
    if (!(await hasActiveAccess(account.id))) {
      redirect("/pricing");
    }
    workspace = await getWorkspaceData(account.id);

    if (workspace.project) {
      const latestExport = await getLatestBrandGuideExport(workspace.project.id);
      latestGeneratedAt = latestExport?.generated_at ?? null;
    }
  } catch (error) {
    unstable_rethrow(error);
    loadError = getUserFacingDataErrorMessage(error);
  }

  if (!workspace?.project) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl">
          <DatabaseErrorState
            title="Ton guide ne peut pas être chargé"
            message={loadError || "Crée d'abord ton projet de marque."}
            backHref="/mon-espace"
            backLabel="Retour à mon espace"
          />
        </section>
      </main>
    );
  }

  const guide = generateGuideFromAnswers({
    project: workspace.project,
    modules: workspace.modules,
    brandName: accountBrandName || workspace.project.name,
  });

  return (
    <ContentPreviewFrame preview={workspace.contentPreview}>
      <BrandGuideLayout guide={guide} latestGeneratedAt={latestGeneratedAt} />
    </ContentPreviewFrame>
  );
}
