import { unstable_rethrow } from "next/navigation";
import BrandGuideLayout from "@/app/ui/brand-guide";
import DatabaseErrorState from "@/app/ui/database-error-state";
import {
  generateGuideFromAnswers,
  getLatestBrandGuideExport,
} from "@/lib/brand-guide";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { getAuthenticatedAccount } from "@/lib/session";
import { getWorkspaceData } from "@/lib/training";

export default async function BrandGuidePage() {
  let workspace: Awaited<ReturnType<typeof getWorkspaceData>> | null = null;
  let latestGeneratedAt: string | null = null;
  let loadError = "";

  try {
    const account = await getAuthenticatedAccount();
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
            title="Votre guide ne peut pas etre charge"
            message={loadError || "Creez d'abord votre projet de marque."}
            backHref="/mon-espace"
            backLabel="Retour a mon espace"
          />
        </section>
      </main>
    );
  }

  const guide = generateGuideFromAnswers({
    project: workspace.project,
    modules: workspace.modules,
  });

  return <BrandGuideLayout guide={guide} latestGeneratedAt={latestGeneratedAt} />;
}
