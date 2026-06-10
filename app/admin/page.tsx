import Link from "next/link";
import DatabaseErrorState from "@/app/ui/database-error-state";
import {
  ChartBarIcon,
  CheckBadgeIcon,
  PlayCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { getAdminAccounts, getAdminOverview, getModulesWithExercises } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { unstable_rethrow } from "next/navigation";

const statCards = [
  {
    key: "accountCount",
    label: "Comptes",
    icon: UserGroupIcon,
  },
  {
    key: "projectCount",
    label: "Projets",
    icon: ChartBarIcon,
  },
  {
    key: "moduleCount",
    label: "Modules",
    icon: PlayCircleIcon,
  },
  {
    key: "adminCount",
    label: "Admins",
    icon: CheckBadgeIcon,
  },
] as const;

export default async function AdminDashboardPage() {
  let overview: Awaited<ReturnType<typeof getAdminOverview>> | null = null;
  let modules: Awaited<ReturnType<typeof getModulesWithExercises>> = [];
  let accounts: Awaited<ReturnType<typeof getAdminAccounts>> = [];
  let loadError = "";

  try {
    [overview, modules, accounts] = await Promise.all([
      getAdminOverview(),
      getModulesWithExercises({ includeUnpublished: true }),
      getAdminAccounts(),
    ]);
  } catch (error) {
    unstable_rethrow(error);
    loadError = getUserFacingDataErrorMessage(error);
  }

  if (!overview) {
    return (
      <DatabaseErrorState
        title="Le tableau de bord ne peut pas être chargé"
        message={loadError}
        backHref="/admin"
        backLabel="Actualiser plus tard"
      />
    );
  }

  const recentAccounts = accounts.slice(0, 5);
  const latestModules = modules.slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="rounded-[1.4rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff8f1)] p-6 shadow-[0_16px_40px_rgba(210,189,152,0.1)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-[#fff6e3] px-4 py-2 text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
              Dashboard
            </p>
            <h1 className="mt-5 font-[family:var(--font-cormorant)] text-[2.6rem] leading-[0.96] text-[#4b4550] sm:text-[3.2rem]">
              Vue d&apos;ensemble de l&apos;administration
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#7b7068]">
              Une lecture rapide des comptes, projets, modules et activite de
              la plateforme.
            </p>
          </div>

          <Link
            href="/admin/modules"
            className="flex h-12 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white"
          >
            Gérer les modules
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = overview[card.key];

          return (
            <article
              key={card.key}
              className="rounded-[1.2rem] border border-[#eadfca] bg-white p-5 shadow-[0_14px_32px_rgba(210,189,152,0.08)]"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-[0.76rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
                  {card.label}
                </p>
                <span className="flex size-10 items-center justify-center rounded-[0.8rem] bg-[#fff6e3] text-[#cf7430]">
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-5 text-[2.2rem] font-black leading-none text-[#4b4550]">
                {value}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.2rem] border border-[#eadfca] bg-white p-6 shadow-[0_14px_32px_rgba(210,189,152,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.76rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Activite clients
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#4b4550]">
                Derniers comptes
              </h2>
            </div>
            <Link
              href="/admin/clients"
              className="text-sm font-semibold text-[#cf7430]"
            >
              Voir tout
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {recentAccounts.length === 0 ? (
              <p className="text-sm leading-7 text-[#7b7068]">
                Aucun compte disponible.
              </p>
            ) : (
              recentAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col gap-3 rounded-[1rem] border border-[#eadfca] bg-[#fffdf7] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-semibold text-[#4b4550]">
                    {account.company_name ?? account.project_name ?? "Compte client"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#f2eef7] px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#7a7087]">
                      {account.project_name ? "Projet actif" : "Sans projet"}
                    </span>
                    {account.is_admin ? (
                      <span className="rounded-full bg-[#eef6eb] px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#5f8d63]">
                        Admin
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[1.2rem] border border-[#eadfca] bg-white p-6 shadow-[0_14px_32px_rgba(210,189,152,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.76rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Modules
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#4b4550]">
                Catalogue
              </h2>
            </div>
            <span className="rounded-full bg-[#fff6e3] px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#cf7430]">
              {overview.publishedModuleCount} publiés
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {latestModules.length === 0 ? (
              <p className="text-sm leading-7 text-[#7b7068]">
                Aucun module configure pour le moment.
              </p>
            ) : (
              latestModules.map((moduleItem) => (
                <div
                  key={moduleItem.id}
                  className="rounded-[1rem] border border-[#eadfca] bg-[#fffdf7] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#4b4550]">
                        {moduleItem.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#7b7068]">
                        Module {moduleItem.position} Â· {moduleItem.exercises.length} exercice
                        {moduleItem.exercises.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] ${
                        moduleItem.is_published
                          ? "bg-[#eef6eb] text-[#5f8d63]"
                          : "bg-[#f2eef7] text-[#7a7087]"
                      }`}
                    >
                      {moduleItem.is_published ? "Publie" : "Brouillon"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
