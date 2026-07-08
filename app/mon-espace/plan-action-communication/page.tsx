import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import CommunicationActionPlan from "@/app/ui/communication-action-plan";
import DatabaseErrorState from "@/app/ui/database-error-state";
import {
  getCommunicationActions,
  getSuggestedCommunicationActions,
} from "@/lib/communication-actions";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import { getWorkspaceData } from "@/lib/training";

export const dynamic = "force-dynamic";

export default async function CommunicationActionPlanPage() {
  let account: Awaited<ReturnType<typeof getAuthenticatedAccount>> | null = null;
  let workspace: Awaited<ReturnType<typeof getWorkspaceData>> | null = null;
  let loadError = "";

  try {
    account = await getAuthenticatedAccount();
    if (!(await hasActiveAccess(account.id))) {
      redirect("/pricing");
    }
    workspace = await getWorkspaceData(account.id);
  } catch (error) {
    unstable_rethrow(error);
    loadError = getUserFacingDataErrorMessage(error);
  }

  if (!account || !workspace?.project) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl">
          <DatabaseErrorState
            title="Ta feuille de route ne peut pas être chargée"
            message={loadError || "Crée d'abord ton projet de marque."}
            backHref="/mon-espace"
            backLabel="Retour à mon espace"
          />
        </section>
      </main>
    );
  }

  const [actions, suggestions] = await Promise.all([
    getCommunicationActions(workspace.project.id),
    Promise.resolve(
      getSuggestedCommunicationActions({
        project: workspace.project,
        modules: workspace.modules,
      }),
    ),
  ]);
  const brandName = account.company_name?.trim() || workspace.project.name;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/mon-espace"
          className="inline-flex h-11 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
        >
          Retour à mon espace
        </Link>
        <CommunicationActionPlan
          initialActions={actions}
          suggestions={suggestions}
          brandName={brandName}
          pdfHref="/mon-espace/plan-action-communication/pdf"
        />
      </section>
    </main>
  );
}
