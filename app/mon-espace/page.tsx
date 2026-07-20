import Image from "next/image";
import Link from "next/link";
import { CalendarDaysIcon, ClockIcon } from "@heroicons/react/24/outline";
import { unstable_rethrow } from "next/navigation";
import DatabaseErrorState from "@/app/ui/database-error-state";
import BillingPortalButton from "@/app/ui/billing-portal-button";
import CompanyNameForm from "@/app/ui/company-name-form";
import ProjectNameForm from "@/app/ui/project-name-form";
import RevealOnScroll from "@/app/ui/reveal-on-scroll";
import WorkspaceLogoForm from "@/app/ui/workspace-logo-form";
import ResetAnswersButton from "@/app/ui/reset-answers-button";
import LogoutButton from "../ui/logout-button";
import { getAuthenticatedAccount } from "@/lib/session";
import { getSubscriptionAccessStatus } from "@/lib/subscriptions";
import { getWorkspaceData } from "@/lib/training";
import type { WorkspaceModule } from "@/lib/training-types";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import {
  getTableCellCount,
  isAnswerableExerciseType,
  parseStoredTableConfig,
} from "@/lib/exercise-types";

export const dynamic = "force-dynamic";

const END_OF_TRAINING_CALL_URL = "https://calendly.com/marine-delanneau/30min";

function isExerciseAnswered(
  exercise: WorkspaceModule["exercises"][number],
  answers: WorkspaceModule["answers"],
) {
  if (!isAnswerableExerciseType(exercise.type)) {
    return true;
  }

  const values = answers[exercise.id] ?? [];

  if (exercise.type === "fill_blank") {
    const blankCount = (exercise.question.match(/_{3,}/g) ?? []).length;
    return values.length === blankCount && values.every((value) => value.trim().length > 0);
  }

  if (exercise.type === "group_open") {
    return (
      values.length === exercise.options.length &&
      values.every((value) => value.trim().length > 0)
    );
  }

  if (exercise.type === "table") {
    const expectedCount = getTableCellCount(parseStoredTableConfig(exercise.options));
    return values.length === expectedCount && values.every((value) => value.trim().length > 0);
  }

  return values.some((value) => value.trim().length > 0);
}

function getResumeHref(modules: WorkspaceModule[]) {
  const activeModule =
    modules.find(
      (module) =>
        module.progress.answeredCount > 0 &&
        !module.progress.isCompleted,
    ) ??
    modules.find((module) => !module.progress.isCompleted) ??
    modules[0];

  if (!activeModule) {
    return "/mon-espace";
  }

  for (let submoduleIndex = 0; submoduleIndex < activeModule.submodules.length; submoduleIndex += 1) {
    const submodule = activeModule.submodules[submoduleIndex];

    for (let exerciseIndex = 0; exerciseIndex < submodule.exercises.length; exerciseIndex += 1) {
      const exercise = submodule.exercises[exerciseIndex];

      if (isAnswerableExerciseType(exercise.type) && !isExerciseAnswered(exercise, activeModule.answers)) {
        return `/mon-espace/module/${activeModule.id}?mode=exercises&submodule=${submoduleIndex}&exercise=${exerciseIndex}`;
      }
    }
  }

  return `/mon-espace/module/${activeModule.id}`;
}

function getAccessLabel(status: string) {
  if (["active", "paid", "trialing"].includes(status)) {
    return "Accès actif";
  }

  if (["past_due", "unpaid", "canceled", "incomplete_expired"].includes(status)) {
    return "Abonnement expire";
  }

  return "Paiement en attente";
}

export default async function MonEspacePage() {
  let account: Awaited<ReturnType<typeof getAuthenticatedAccount>> | null = null;
  let workspace: Awaited<ReturnType<typeof getWorkspaceData>> | null = null;
  let accessStatus: Awaited<ReturnType<typeof getSubscriptionAccessStatus>> | null = null;
  let loadError = "";

  try {
    account = await getAuthenticatedAccount();
    accessStatus = account.is_admin
      ? {
          status: "active",
          accessGranted: true,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
        }
      : await getSubscriptionAccessStatus(account.id);

    if (!accessStatus.accessGranted) {
      workspace = null;
    } else {
      workspace = await getWorkspaceData(account.id);
    }
  } catch (error) {
    unstable_rethrow(error);
    loadError = getUserFacingDataErrorMessage(error);
  }

  if (!account) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl">
          <DatabaseErrorState
            title="Ton espace ne peut pas être chargé"
            message={loadError}
          />
        </section>
      </main>
    );
  }

  if (!accessStatus?.accessGranted) {
    const accessLabel = getAccessLabel(accessStatus?.status ?? "none");

    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl space-y-6">
          <div className="border-b border-[#eadfca] pb-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <Image
                  src="/logo.png"
                  alt="Brand Studio"
                  width={154}
                  height={86}
                  className="h-auto w-[8rem]"
                  priority
                />
                <h1 className="mt-10 font-[family:var(--font-cormorant)] text-[3.2rem] leading-[0.95] text-[#4b4550] sm:text-[4.1rem]">
                  Ton accès Brand Studio
                </h1>
                <p className="mt-6 text-lg leading-8 text-[#6f645b]">
                  Ton paiement doit être confirmé par Stripe avant de débloquer
                  les modules de formation.
                </p>
              </div>

              <aside className="rounded-[1.6rem] border border-[#eadfca] bg-white p-6 shadow-[0_18px_46px_rgba(210,189,152,0.1)] lg:w-[24rem]">
                <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#7a7087]">
                  Statut
                </p>
                <p className="mt-4 text-2xl font-black text-[#4b4550]">{accessLabel}</p>
                <p className="mt-3 text-sm leading-7 text-[#7b7068]">
                  {accessStatus?.status === "none"
                    ? "Débloque Brand Studio pour accéder aux modules."
                    : "Si tu viens de payer, l'accès apparaîtra dès que le webhook Stripe aura confirmé le paiement."}
                </p>
                <div className="mt-6 space-y-3">
                  <Link
                    href="/pricing"
                    className="flex h-12 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white"
                  >
                    Debloquer Brand Studio
                  </Link>
                  {accessStatus?.stripeCustomerId ? <BillingPortalButton /> : null}
                  <LogoutButton />
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl">
          <DatabaseErrorState
            title="Ton espace ne peut pas être chargé"
            message={loadError}
          />
        </section>
      </main>
    );
  }

  const hasStartedModules = workspace.modules.some(
    (module) => module.progress.answeredCount > 0 || module.progress.isCompleted,
  );
  const firstModuleHref =
    workspace.modules[0]?.id
      ? `/mon-espace/module/${workspace.modules[0].id}`
      : "/mon-espace";
  const continueHref = getResumeHref(workspace.modules);
  const ctaHref = hasStartedModules ? continueHref : firstModuleHref;
  const workspaceTitle =
    account.company_name?.trim() || workspace.project?.name || "Mon projet";

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="border-b border-[#eadfca] pb-8 sm:pb-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4">
                {workspace.project?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={workspace.project.logo_url}
                    alt={`Logo de ${workspaceTitle}`}
                    className="h-16 w-16 rounded-[1rem] border border-[#eadfca] bg-white object-contain p-2"
                  />
                ) : (
                  <Image
                    src="/logo.png"
                    alt="Brand Studio"
                    width={154}
                    height={86}
                    className="h-auto w-[7.4rem]"
                    priority
                  />
                )}
                <span className="inline-flex rounded-full border border-[#efd7b8] bg-[#fff6e3] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
                  Espace de travail
                </span>
              </div>
              <div className="mt-10 max-w-3xl pl-6 sm:pl-8">
                <p className="font-more-sugar text-[3rem] leading-[0.96] tracking-[-0.01em] text-[#2f2a33] sm:text-[4rem]">
                  {workspaceTitle}
                </p>
                <p className="mt-7 text-[0.8rem] font-black uppercase tracking-[0.24em] text-[#cf7430]">
                  En route vers ta nouvelle identité de marque
                </p>
              </div>
              <div className="relative mt-12 max-w-2xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 p-6 shadow-[0_16px_38px_rgba(126,102,78,0.08),0_2px_10px_rgba(207,116,48,0.06)] ring-1 ring-[#f3e5d2]/80 backdrop-blur-[2px] sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,rgba(243,198,35,0.12),transparent_52%),radial-gradient(circle_at_top_right,rgba(207,116,48,0.08),transparent_44%)]"
                />
                <div className="relative">
                  <div>
                    <p className="text-[0.72rem] font-black uppercase tracking-[0.24em] text-[#cf7430]">
                      Introduction
                    </p>
                  </div>
                  <div className="space-y-5 pt-5 text-[#6b625a]">
                    <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#7a7087]">
                      Bienvenue dans le Brand Studio
                    </p>
                    <p className="rounded-[1.35rem] border border-[#f2e4d2] bg-[#fff9f2] px-5 py-4 text-[1.05rem] leading-8 italic text-[#5f544a] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                      Hello, ça y est, c&apos;est le grand moment ! Je te remercie
                      encore d&apos;avoir choisi ce pack pour t&apos;accompagner dans la
                      belle mission de structurer ton identité de marque. Es-tu prêt
                      à entrer dans la peau d&apos;un Directeur Artistique ?
                    </p>
                    <div className="space-y-4 text-base leading-8 text-[#6f645b]">
                      <p>
                        Ce guide est le document de référence de ton identité,{" "}
                        <span className="font-semibold italic text-[#5f544a]">
                          un kit clé en main pour poser les bases d&apos;une marque forte.
                        </span>
                      </p>
                      <p>
                        Il rassemble les fondations stratégiques et visuelles de ta
                        marque afin de garantir une communication{" "}
                        <strong className="font-extrabold text-[#4b4550]">
                          cohérente, professionnelle et durable
                        </strong>
                        .
                      </p>
                      <p className="text-[#6f645b]">
                        <span className="font-black text-[#cf7430]">Cadre de travail :</span>{" "}
                        utilise-le comme un repère pour créer, décliner et faire
                        évoluer ta marque en toute autonomie.
                      </p>
                    </div>
                    {workspace.modules.length > 0 ? (
                      <div className="flex flex-col gap-5 pt-4 sm:flex-row sm:items-end sm:justify-between">
                        <Link
                          href={ctaHref}
                          className="inline-flex h-12 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_12px_26px_rgba(223,155,57,0.18)] transition hover:brightness-[1.02]"
                        >
                          {hasStartedModules ? "Reprendre" : "Commencer"}
                        </Link>
                        <div className="w-full max-w-[13rem] sm:text-right">
                          <div className="flex items-end justify-between gap-3 sm:justify-end">
                            <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#7a7087]">
                              Progression
                            </p>
                            <p className="text-lg font-black leading-none text-[#4b4550]">
                              {workspace.progressPercent}%
                            </p>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1ece5]">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#d88a2f,#f0cf55)]"
                              style={{ width: `${workspace.progressPercent}%` }}
                            />
                          </div>
                          <p className="mt-1.5 text-[0.65rem] text-[#8a8077]">
                            {workspace.completedModulesCount}/{workspace.totalModulesCount} modules terminés
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:w-[24rem] lg:grid-cols-1">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 p-6 shadow-[0_16px_38px_rgba(126,102,78,0.08),0_2px_10px_rgba(207,116,48,0.06)] ring-1 ring-[#f3e5d2]/80 backdrop-blur-[2px] sm:col-span-2 lg:col-span-1">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top_left,rgba(243,198,35,0.12),transparent_52%),radial-gradient(circle_at_top_right,rgba(207,116,48,0.08),transparent_44%)]"
                />
                <LogoutButton
                  iconOnly
                  className="group absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#7a7087] shadow-[0_8px_20px_rgba(92,78,63,0.1)] transition hover:border-[#cf7430] hover:bg-[#fff6e3] hover:text-[#cf7430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0cf55]"
                />
                <div className="relative space-y-6">
                  {workspace.project && workspace.modules.length > 0 ? (
                    <nav className="border-b border-[#f0e4d3] pb-6">
                      <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
                        Navigation
                      </p>
                      <h3 className="mt-2 font-[family:var(--font-cormorant)] text-[2rem] leading-[0.95] text-[#4b4550]">
                        Tes modules
                      </h3>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {workspace.modules.map((module) => (
                          <Link
                            key={module.id}
                            href={`/mon-espace/module/${module.id}`}
                            className={`rounded-full border px-4 py-2 text-sm font-black uppercase tracking-[0.12em] transition ${
                              module.progress.isCompleted
                                ? "border-[#d6e8d8] bg-[#eef6eb] text-[#5f8d63]"
                                : "border-[#eadfca] bg-[#fff8f1] text-[#6b625a] hover:border-[#cf7430] hover:text-[#cf7430]"
                            }`}
                          >
                            {module.title}
                          </Link>
                        ))}
                        <Link
                          href="/mon-espace/plan-action-communication"
                          className="rounded-full border border-[#cf7430] bg-[#fff1d5] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#cf7430] transition hover:bg-[#cf7430] hover:text-white"
                        >
                          Plan d&apos;action communication
                        </Link>
                      </div>
                    </nav>
                  ) : null}

                  <div className="border-b border-[#f0e4d3] pb-6">
                    <CompanyNameForm currentCompanyName={account.company_name} />
                    {workspace.project ? (
                      <WorkspaceLogoForm
                        currentLogoUrl={workspace.project.logo_url}
                        projectName={workspaceTitle}
                      />
                    ) : null}
                  </div>

                  <div className="rounded-[1rem] border border-[#efd7b8] bg-[linear-gradient(135deg,#fffaf1,#fff1d5)] p-3 shadow-[0_8px_18px_rgba(207,116,48,0.07)]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.65rem] bg-white text-[#cf7430] ring-1 ring-[#efd7b8]">
                        <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-[#cf7430]">
                          Fin de parcours
                        </p>
                        <p className="mt-0.5 text-sm font-extrabold text-[#4b4550]">
                          Faisons le point ensemble
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-[0.68rem] font-bold text-[#5f544a]">
                      <ClockIcon className="h-3.5 w-3.5 text-[#cf7430]" aria-hidden="true" />
                      45 minutes en visioconférence
                    </p>
                    <a
                      href={END_OF_TRAINING_CALL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex h-9 w-full items-center justify-center rounded-[0.7rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-3 text-[0.65rem] font-extrabold uppercase tracking-[0.09em] text-white shadow-[0_8px_16px_rgba(223,155,57,0.16)] transition hover:-translate-y-0.5"
                    >
                      Réserver mon rendez-vous
                    </a>
                  </div>

                  {workspace.project ? (
                    <div>
                      <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
                        Ton Guide de Marque
                      </p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          href="/brand-guide"
                          className="inline-flex h-11 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-white"
                        >
                          Generer
                        </Link>
                        <Link
                          href="/brand-guide"
                          className="inline-flex h-11 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
                        >
                          Voir
                        </Link>
                        <Link
                          href="/brand-guide"
                          className="inline-flex h-11 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
                        >
                          Regenerer
                        </Link>
                      </div>
                    </div>
                  ) : null}
                  {workspace.project ? <ResetAnswersButton /> : null}
                </div>
              </div>

              {account.is_admin ? (
                <div className="sm:col-span-2 lg:col-span-1">
                  <Link
                    href="/admin/modules"
                    className="flex h-12 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
                  >
                    Gérer les modules
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-8 border-t border-[#eadfca] pt-7">
            <p className="font-more-sugar mx-auto max-w-4xl text-center text-[2.35rem] leading-[1.02] text-[#5d5259] sm:text-[2.9rem] lg:text-[3.35rem]">
              Ton histoire commence ici, écrivons-la ensemble !
            </p>
          </div>
        </div>

        {!workspace.project ? (
          <section className="rounded-[2rem] border border-[#eadfca] bg-white p-6 shadow-[0_18px_46px_rgba(210,189,152,0.1)] sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="inline-flex rounded-full bg-[#f2eef7] px-4 py-2 text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#7a7087]">
                  Création
                </p>
                <h2 className="mt-5 font-[family:var(--font-cormorant)] text-[2.4rem] leading-[0.98] text-[#4b4550] sm:text-[3rem]">
                  Crée ton unique projet de marque
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-[#7b7068]">
                  Le projet commence simplement avec un nom. Tu pourras ensuite
                  suivre les modules, les vidéos, le contenu et les exercices
                  dans le bon ordre.
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-[#eadfca] bg-[#fffdf7] p-6">
                <ProjectNameForm />
              </div>
            </div>
          </section>
        ) : null}

        {workspace.project ? (
          <section className="grid gap-6">
            {workspace.modules.length === 0 ? (
              <div className="rounded-[1.6rem] border border-[#eadfca] bg-white p-6 text-base leading-8 text-[#7b7068] shadow-[0_18px_46px_rgba(210,189,152,0.1)]">
                Aucun module n&apos;est encore publie. Un administrateur peut les
                ajouter depuis l&apos;espace de gestion.
              </div>
            ) : workspace.modules.length > 0 ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <RevealOnScroll>
                  <Image
                    src="/logo.png"
                    alt="Brand Studio"
                    width={220}
                    height={124}
                    className="h-auto w-[10rem] drop-shadow-[0_14px_24px_rgba(92,78,63,0.14)] transition-transform duration-300 hover:-translate-y-1 hover:drop-shadow-[0_20px_34px_rgba(92,78,63,0.18)] sm:w-[12rem]"
                  />
                </RevealOnScroll>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
