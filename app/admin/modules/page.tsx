import { cancelAdminDraftDeployment, scheduleAdminDraftDeployment } from "@/app/admin/modules/actions";
import AdminDeploymentButton from "@/app/ui/admin-deployment-button";
import AdminModuleEditor from "@/app/ui/admin-module-editor";
import DatabaseErrorState from "@/app/ui/database-error-state";
import { getAuthenticatedAdmin } from "@/lib/session";
import { getAdminWorkingModules } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { unstable_rethrow } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminDraftPreviewEnabled } from "@/lib/content-releases";
import Link from "next/link";

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  let modules: Awaited<ReturnType<typeof getAdminWorkingModules>> = [];
  let loadError = "";
  let activeSchedule: { scheduled_at: string; notes: string | null } | null = null;

  try {
    const account = await getAuthenticatedAdmin();
    modules = await getAdminWorkingModules(account.id);
    const { data } = await createSupabaseServerClient().from("admin_deployment_schedules")
      .select("scheduled_at,notes").eq("account_id", account.id).eq("status", "scheduled")
      .order("scheduled_at", { ascending: false }).limit(1).maybeSingle<{ scheduled_at: string; notes: string | null }>();
    activeSchedule = data;
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
  const controlledReleasesEnabled = isAdminDraftPreviewEnabled();
  const status = resolvedSearchParams?.status;
  const errorMessage = resolvedSearchParams?.message;
  const statusValue = Array.isArray(status) ? status[0] : status;
  const errorMessageValue = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;

  const message =
    statusValue === "saved"
      ? "Brouillon admin enregistre. Tes changements sont visibles dans ton espace Marine Communication uniquement."
      : statusValue === "deployed"
        ? "Brouillon deploye a tous les utilisateurs."
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
        {controlledReleasesEnabled ? (
          <div className="mt-5 rounded-2xl border border-[#d9e6d5] bg-[#f7fbf5] p-5">
            <p className="font-bold text-[#55745a]">
              La publication historique destructive est désactivée.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#637466]">
              Les changements restent dans le brouillon jusqu’à une publication
              volontaire depuis la gestion des releases.
            </p>
            <Link
              href="/admin/releases"
              className="mt-4 inline-flex rounded-xl bg-[#4b4550] px-4 py-2 text-sm font-bold text-white"
            >
              Ouvrir Versions et déploiements
            </Link>
          </div>
        ) : (
          <AdminDeploymentButton />
        )}
        {!controlledReleasesEnabled ? <div className="mt-5 rounded-2xl border border-[#eadfca] bg-white/70 p-5">
          <h2 className="text-lg font-semibold text-[#4b4550]">Programmer le déploiement</h2>
          <p className="mt-1 text-sm text-[#7b7068]">La date et l’heure sont interprétées en heure de Paris.</p>
          {activeSchedule ? <div className="mt-4 rounded-xl bg-[#fff6e3] p-4 text-sm"><strong>Programmé le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(activeSchedule.scheduled_at))}</strong>{activeSchedule.notes ? <p className="mt-1">{activeSchedule.notes}</p> : null}<form action={cancelAdminDraftDeployment} className="mt-3"><button className="rounded-xl border border-[#cf7430] px-4 py-2 text-[#9b5424]">Annuler la programmation</button></form></div> :
          <form action={scheduleAdminDraftDeployment} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-sm"><span className="mb-1 block">Date et heure</span><input required name="scheduledAt" type="datetime-local" className="h-11 rounded-xl border border-[#eadfca] bg-white px-3" /></label>
            <label className="min-w-64 flex-1 text-sm"><span className="mb-1 block">Note facultative</span><input name="notes" className="h-11 w-full rounded-xl border border-[#eadfca] bg-white px-3" placeholder="Contenu de cette publication" /></label>
            <button className="h-11 rounded-xl bg-[#d98632] px-5 font-bold text-white">Programmer</button>
          </form>}
        </div> : null}
        {message ? (
          <p className="mt-5 text-sm leading-6 text-[#6b625a]">{message}</p>
        ) : null}
      </section>

      <AdminModuleEditor modules={modules} />
    </div>
  );
}
