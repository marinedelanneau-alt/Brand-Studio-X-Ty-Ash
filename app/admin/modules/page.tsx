import AdminDeploymentButton from "@/app/ui/admin-deployment-button";
import AdminModuleEditor from "@/app/ui/admin-module-editor";
import DatabaseErrorState from "@/app/ui/database-error-state";
import { getAuthenticatedAdmin } from "@/lib/session";
import { getAdminWorkingModules } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { unstable_rethrow } from "next/navigation";

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  let modules: Awaited<ReturnType<typeof getAdminWorkingModules>> = [];
  let loadError = "";

  try {
    const account = await getAuthenticatedAdmin();
    modules = await getAdminWorkingModules(account.id);
  } catch (error) {
    unstable_rethrow(error);
    loadError = getUserFacingDataErrorMessage(error);
  }

  if (loadError) {
    return (
      <DatabaseErrorState
        title="Les modules ne peuvent pas etre charges"
        message={loadError}
        backHref="/admin"
        backLabel="Retour au dashboard"
      />
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const status = resolvedSearchParams?.status;
  const errorMessage = resolvedSearchParams?.message;
  const statusValue = Array.isArray(status) ? status[0] : status;
  const errorMessageValue = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;

  const message =
    statusValue === "saved"
      ? "Brouillon enregistré. La version publiée reste inchangée."
      : statusValue === "published"
        ? "La nouvelle version officielle est publiée pour tous les utilisateurs. Les prochaines modifications créeront un nouveau brouillon privé."
        : statusValue === "scheduled"
          ? "Déploiement programmé."
          : statusValue === "cancelled"
            ? "Programmation annulée."
        : statusValue === "deleted"
          ? "Module supprime du brouillon admin."
          : statusValue === "error"
            ? errorMessageValue || "Impossible de traiter cette action."
            : "";

  return (
    <div className="space-y-6">
      <section className="rounded-[1.4rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-6 shadow-[0_16px_40px_rgba(210,189,152,0.1)]">
        <p className="inline-flex rounded-full bg-[var(--tyash-soft)] px-4 py-2 text-[0.76rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">
          Modules
        </p>
        <h1 className="mt-5 font-[family:var(--font-cormorant)] text-[2.6rem] leading-[0.96] text-[var(--heading-color)] sm:text-[3.2rem]">
          Gestion des modules
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
          Tes modifications sont enregistrées automatiquement dans le brouillon privé.
          Publie volontairement la version enregistrée pour la rendre visible aux utilisateurs.
        </p>
        <AdminDeploymentButton />
        <a href="/admin/releases" className="mt-4 inline-block text-sm underline">
          Versions, aperçu et déploiements programmés
        </a>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Attends la confirmation de sauvegarde avant de publier. Les déplacements,
          suppressions et changements de type des éléments publiés sont protégés
          pour conserver les réponses existantes.
        </p>
        {message ? (
          <p className="mt-5 text-sm leading-6 text-[var(--text-primary)]">{message}</p>
        ) : null}
      </section>

      <AdminModuleEditor modules={modules} />
    </div>
  );
}
