import AdminModuleEditor from "@/app/ui/admin-module-editor";
import DatabaseErrorState from "@/app/ui/database-error-state";
import { getModulesWithExercises } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { unstable_rethrow } from "next/navigation";

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  let modules: Awaited<ReturnType<typeof getModulesWithExercises>> = [];
  let loadError = "";

  try {
    modules = await getModulesWithExercises({
      includeUnpublished: true,
      includeInactiveBrandPersona: true,
    });
  } catch (error) {
    unstable_rethrow(error);
    loadError = getUserFacingDataErrorMessage(error);
  }

  if (loadError) {
    return (
      <DatabaseErrorState
        title="Les modules ne peuvent pas être chargés"
        message={loadError}
        backHref="/admin"
        backLabel="Retour au dashboard"
      />
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const status = resolvedSearchParams?.status;
  const statusValue = Array.isArray(status) ? status[0] : status;

  const message =
    statusValue === "saved"
      ? "Module enregistre."
      : statusValue === "deleted"
        ? "Module supprime."
        : statusValue === "error"
          ? "Impossible de traiter cette action."
          : "";

  return (
    <div className="space-y-6">
      <section className="rounded-[1.4rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff8f1)] p-6 shadow-[0_16px_40px_rgba(210,189,152,0.1)]">
        <p className="inline-flex rounded-full bg-[#fff6e3] px-4 py-2 text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
          Modules
        </p>
        <h1 className="mt-5 font-[family:var(--font-cormorant)] text-[2.6rem] leading-[0.96] text-[#4b4550] sm:text-[3.2rem]">
          Gestion des modules
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[#7b7068]">
          Créez, publiez et mettez à jour les modules du parcours. Chaque
          module compte de facon egale dans la progression totale.
        </p>
        {message ? (
          <p className="mt-5 text-sm leading-6 text-[#6b625a]">{message}</p>
        ) : null}
      </section>

      <AdminModuleEditor modules={modules} />
    </div>
  );
}
