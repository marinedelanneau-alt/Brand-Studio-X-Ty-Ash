import { publishAdminDraftToAllUsers } from "@/app/admin/modules/actions";
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
      ? "Brouillon admin enregistre. Tes changements sont visibles dans ton espace Marine Communication uniquement."
      : statusValue === "deployed"
        ? "Brouillon deploye a tous les utilisateurs."
        : statusValue === "deleted"
          ? "Module supprime du brouillon admin."
          : statusValue === "error"
            ? errorMessageValue || "Impossible de traiter cette action."
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
          Tes modifications sont enregistrees dans une copie de travail visible
          uniquement dans ton espace Marine Communication. Les autres utilisateurs
          gardent la version publiee jusqu&apos;au deploiement global.
        </p>
        <form action={publishAdminDraftToAllUsers} className="mt-5">
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-[0.95rem] bg-[#4b4550] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_32px_rgba(75,69,80,0.18)]"
          >
            Deployer a tous les utilisateurs
          </button>
        </form>
        {message ? (
          <p className="mt-5 text-sm leading-6 text-[#6b625a]">{message}</p>
        ) : null}
      </section>

      <AdminModuleEditor modules={modules} />
    </div>
  );
}
