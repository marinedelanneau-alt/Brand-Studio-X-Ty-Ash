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
import LogoutButton from "../ui/logout-button";
import { getAuthenticatedAccount } from "@/lib/session";
import { getSubscriptionAccessStatus } from "@/lib/subscriptions";
import { getWorkspaceData } from "@/lib/training";
import type { WorkspaceModule } from "@/lib/training-types";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { getModuleHref } from "@/lib/module-routing";
import {
  getTableCellCount,
  isAnswerableExerciseType,
  parseStoredTableConfig,
} from "@/lib/exercise-types";
import ContentPreviewFrame from "@/app/ui/content-preview-frame";

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
        return `${getModuleHref(activeModule)}?mode=exercises&submodule=${submoduleIndex}&exercise=${exerciseIndex}`;
      }
    }
  }

  return getModuleHref(activeModule);
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

function BrandStudioTyAshLockup({ compact = false }: { compact?: boolean }) {
  const logoHeight = compact ? "h-8 sm:h-10" : "h-10 sm:h-12";

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-3.5">
      {/* Match the artwork heights, excluding each file's transparent margins. */}
      <div className={`relative aspect-[272/166] shrink-0 overflow-hidden ${logoHeight}`}>
        <Image
          src="/logo.png"
          alt="Brand Studio"
          width={280}
          height={280}
          sizes={compact ? "(min-width: 640px) 68px, 54px" : "(min-width: 640px) 81px, 68px"}
          className="absolute left-[-1.1%] top-[-33.74%] h-auto w-[102.95%] max-w-none"
          preload
        />
      </div>

      <span
        aria-hidden="true"
        className="text-[0.9rem] font-medium leading-none text-[var(--text-muted)] opacity-80 sm:text-[1.1rem]"
      >
        ×
      </span>

      <div className={`relative aspect-[1878/523] shrink-0 overflow-hidden ${logoHeight}`}>
        <Image
          src="/tyash-logo-transparent.png"
          alt="Ty Ash Studio"
          width={2122}
          height={741}
          sizes={compact ? "(min-width: 640px) 163px, 130px" : "(min-width: 640px) 195px, 163px"}
          className="tyash-partner-logo absolute left-[-6.02%] top-[-24.67%] h-auto w-[113%] max-w-none"
          preload
        />
      </div>
    </div>
  );
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
          <div className="border-b border-[var(--border)] pb-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <BrandStudioTyAshLockup />
                <h1 className="mt-10 font-[family:var(--font-cormorant)] text-[3.2rem] leading-[0.95] text-[var(--heading-color)] sm:text-[4.1rem]">
                  Ton accès Brand Studio
                </h1>
                <p className="mt-6 text-lg leading-8 text-[var(--text-primary)]">
                  Ton paiement doit être confirmé par Stripe avant de débloquer
                  les modules de formation.
                </p>
              </div>

              <aside className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_18px_46px_rgba(210,189,152,0.1)] lg:w-[24rem]">
                <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Statut
                </p>
                <p className="mt-4 text-2xl font-black text-[var(--heading-color)]">{accessLabel}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                  {accessStatus?.status === "none"
                    ? "Débloque Brand Studio pour accéder aux modules."
                    : "Si tu viens de payer, l'accès apparaîtra dès que le webhook Stripe aura confirmé le paiement."}
                </p>
                <div className="mt-6 space-y-3">
                  <Link
                    href="/pricing"
                    className="flex h-12 items-center justify-center rounded-[0.95rem] bs-button-primary px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white"
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
  const firstModuleHref = workspace.modules[0]
    ? getModuleHref(workspace.modules[0])
    : "/mon-espace";
  const continueHref = getResumeHref(workspace.modules);
  const ctaHref = hasStartedModules ? continueHref : firstModuleHref;
  const workspaceTitle =
    workspace.project?.name.trim() || account.company_name?.trim() || "Mon projet";

  return (
    <ContentPreviewFrame preview={workspace.contentPreview}>
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div
          className={`border-b border-[var(--border)] pb-8 sm:pb-10 ${
            workspace.project
              ? "lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-x-8"
              : ""
          }`}
        >
          <div
            className={`flex flex-col gap-8 ${
              workspace.project
                ? "lg:contents"
                : "lg:flex-row lg:items-start lg:justify-between"
            }`}
          >
            <div
              className={`min-w-0 flex-1 ${
                workspace.project ? "lg:col-start-1 lg:row-start-1" : ""
              }`}
            >
              <div className="flex w-full flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 shrink-0">
                  {workspace.project?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={workspace.project.logo_url}
                      alt={`Logo de ${workspaceTitle}`}
                      className="h-16 w-16 rounded-[1rem] border border-[var(--border)] bg-[var(--card)] object-contain p-2"
                    />
                  ) : (
                    <BrandStudioTyAshLockup />
                  )}
                </div>

                <span className="inline-flex shrink-0 rounded-full border border-[var(--tyash-border)] bg-[var(--tyash-soft)] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">
                  Espace de travail
                </span>
              </div>
              <div className="mt-10 max-w-3xl pl-6 sm:pl-8">
                <p className="font-more-sugar text-[3rem] leading-[0.96] tracking-[-0.01em] text-[var(--heading-color)] sm:text-[4rem]">
                  {workspaceTitle}
                </p>
                <p className="mt-7 text-[0.8rem] font-black uppercase tracking-[0.24em] text-[var(--tyash-primary-dark)]">
                  En route vers ta nouvelle identité de marque
                </p>
              </div>
            </div>

            <div
              className={`grid gap-5 sm:grid-cols-2 lg:w-[21rem] lg:grid-cols-1 ${
                workspace.project
                  ? "lg:col-start-2 lg:row-span-2 lg:row-start-1"
                  : ""
              }`}
            >
              <div className="relative h-full overflow-hidden rounded-[1.7rem] border border-[var(--surface-highlight)]/80 bg-[var(--surface)]/95 p-4 shadow-[0_16px_38px_rgba(21,33,59,0.055)] ring-1 ring-[var(--border)]/80 backdrop-blur-[2px] sm:col-span-2 lg:col-span-1">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top_right,rgb(var(--tyash-glow-rgb)/0.08),transparent_48%)]"
                />
                <LogoutButton
                  iconOnly
                  className="group absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--tyash-border)] bg-[var(--card)] text-[var(--text-muted)] shadow-[0_8px_20px_rgba(92,78,63,0.1)] transition hover:border-[var(--tyash-primary)] hover:bg-[var(--tyash-soft)] hover:text-[var(--tyash-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tyash-focus-ring)]"
                />
                <div className="relative flex h-full flex-col gap-4">
                  {workspace.project && workspace.modules.length > 0 ? (
                    <nav className="border-b border-[var(--border)] pb-3">
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-[var(--tyash-primary-dark)]">
                        Navigation
                      </p>
                      <h3 className="mt-1 font-[family:var(--font-cormorant)] text-[1.75rem] leading-none text-[var(--heading-color)]">
                        Tes modules
                      </h3>
                      <div className="mt-2.5 flex flex-col gap-1.5">
                        {workspace.modules.map((module) => (
                          <Link
                            key={module.id}
                            href={getModuleHref(module)}
                            className={`w-full rounded-full border px-3 py-1.5 text-center text-[0.68rem] font-black uppercase tracking-[0.1em] transition ${
                              module.progress.isCompleted
                                ? "border-[#d6e8d8] bs-status-light bg-[#eef6eb] text-[var(--status-success-text)]"
                                : "border-[var(--tyash-border)] bg-[var(--tyash-subtle)] text-[var(--text-primary)] hover:border-[var(--tyash-primary)] hover:text-[var(--tyash-primary-dark)]"
                            }`}
                          >
                            {module.title}
                          </Link>
                        ))}
                        <Link
                          href="/mon-espace/plan-action-communication"
                          className="w-full rounded-full border border-[var(--tyash-primary)] bg-[var(--tyash-soft)] px-3 py-1.5 text-center text-[0.68rem] font-black uppercase tracking-[0.1em] text-[var(--tyash-primary-dark)] transition hover:bg-[var(--tyash-primary)] hover:text-[var(--tyash-text-on-primary)]"
                        >
                          Plan d&apos;action communication
                        </Link>
                      </div>
                    </nav>
                  ) : null}

                  <div className="border-b border-[var(--border)] pb-3">
                    <CompanyNameForm currentCompanyName={workspaceTitle} />
                    {workspace.project ? (
                      <WorkspaceLogoForm
                        currentLogoUrl={workspace.project.logo_url}
                        projectName={workspaceTitle}
                      />
                    ) : null}
                  </div>

                    <div className="rounded-[1rem] border border-[var(--tyash-border)] bg-[var(--tyash-subtle)] p-2.5 shadow-[0_8px_18px_rgba(21,33,59,0.045)]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.65rem] bg-[var(--card)] text-[var(--tyash-primary)] ring-1 ring-[var(--tyash-border)]">
                        <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-[var(--tyash-primary-dark)]">
                          Fin de parcours
                        </p>
                        <p className="mt-0.5 text-sm font-extrabold text-[var(--heading-color)]">
                          Faisons le point ensemble
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-[0.68rem] font-bold text-[var(--text-primary)]">
                      <ClockIcon className="h-3.5 w-3.5 text-[var(--tyash-primary)]" aria-hidden="true" />
                      45 minutes en visioconférence
                    </p>
                    <a
                      href={END_OF_TRAINING_CALL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bs-button-primary mt-3 flex h-9 w-full items-center justify-center rounded-[0.7rem] px-3 text-[0.65rem] font-extrabold uppercase tracking-[0.09em] shadow-[0_8px_16px_rgba(21,33,59,0.14)]"
                    >
                      Réserver mon rendez-vous
                    </a>
                  </div>

                  {workspace.project ? (
                    <div>
                      <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-primary-dark)]">
                        Ton Guide de Marque
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link
                          href="/brand-guide"
                          className="bs-button-primary inline-flex h-9 items-center justify-center rounded-[0.75rem] px-3 text-[0.65rem] font-extrabold uppercase tracking-[0.1em]"
                        >
                          Generer
                        </Link>
                        <Link
                          href="/brand-guide"
                          className="bs-button-secondary inline-flex h-9 items-center justify-center rounded-[0.75rem] border px-3 text-[0.65rem] font-extrabold uppercase tracking-[0.1em]"
                        >
                          Voir
                        </Link>
                        <Link
                          href="/brand-guide"
                          className="bs-button-secondary inline-flex h-9 items-center justify-center rounded-[0.75rem] border px-3 text-[0.65rem] font-extrabold uppercase tracking-[0.1em]"
                        >
                          Regenerer
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {account.is_admin ? (
                <div className="sm:col-span-2 lg:col-span-1">
                  <Link
                    href="/admin/modules"
                    className="flex h-12 items-center justify-center rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--text-primary)]"
                  >
                    Gérer les modules
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
          <div
            className={`relative mt-8 w-full overflow-hidden rounded-[2rem] border border-[var(--surface-highlight)]/80 bg-[var(--surface)]/95 p-5 shadow-[0_16px_38px_rgba(21,33,59,0.055)] ring-1 ring-[var(--border)]/80 backdrop-blur-[2px] sm:p-6 ${
              workspace.project ? "lg:col-start-1 lg:row-start-2" : ""
            }`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_right,rgb(var(--tyash-glow-rgb)/0.045),transparent_46%)]"
            />
            <div className="relative">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.24em] text-[var(--tyash-label-text)]">
                Introduction
              </p>
              <div className="space-y-4 pt-4 text-[var(--text-primary)]">
                <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Bienvenue dans le Brand Studio
                </p>
                <p className="rounded-[1.35rem] border border-[var(--border)] bg-[var(--background)] px-5 py-3 text-[1.05rem] leading-7 italic text-[var(--text-primary)] shadow-[inset_0_1px_0_rgb(var(--tyash-highlight-rgb)/0.85)]">
                  Hello, ça y est, c&apos;est le grand moment ! Je te remercie
                  encore d&apos;avoir choisi ce pack pour t&apos;accompagner dans la
                  belle mission de structurer ton identité de marque. Es-tu prêt
                  à entrer dans la peau d&apos;un Directeur Artistique ?
                </p>
                <div
                  className={`grid gap-3 text-base leading-7 text-[var(--text-primary)] ${
                    workspace.project ? "" : "lg:grid-cols-3 lg:gap-6"
                  }`}
                >
                  <p className={`pb-3 ${workspace.project ? "" : "lg:pb-0 lg:pr-6"}`}>
                    Ce guide est le document de référence de ton identité,{" "}
                    <span className="font-semibold italic text-[var(--text-primary)]">
                      un kit clé en main pour poser les bases d&apos;une marque forte.
                    </span>
                  </p>
                  <p
                    className={`border-t border-[var(--border)] py-3 ${
                      workspace.project
                        ? ""
                        : "lg:border-l lg:border-t-0 lg:px-6 lg:py-0"
                    }`}
                  >
                    Il rassemble les fondations stratégiques et visuelles de ta
                    marque afin de garantir une communication{" "}
                    <strong className="font-extrabold text-[var(--heading-color)]">
                      cohérente, professionnelle et durable
                    </strong>
                    .
                  </p>
                  <p
                    className={`border-t border-[var(--border)] pt-3 ${
                      workspace.project
                        ? ""
                        : "lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
                    }`}
                  >
                    <span className="font-black text-[var(--tyash-label-text)]">Cadre de travail :</span>{" "}
                    utilise-le comme un repère pour créer, décliner et faire
                    évoluer ta marque en toute autonomie.
                  </p>
                </div>
                {workspace.modules.length > 0 ? (
                  <div className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-end sm:justify-between">
                    <Link
                      href={ctaHref}
                      className="bs-button-primary inline-flex h-12 items-center justify-center rounded-[0.95rem] px-6 text-sm font-extrabold uppercase tracking-[0.12em] shadow-[0_12px_26px_rgba(21,33,59,0.17)] hover:shadow-[0_14px_28px_rgba(21,33,59,0.2)]"
                    >
                      {hasStartedModules ? "Reprendre" : "Commencer"}
                    </Link>
                    <div className="w-full max-w-[13rem] sm:text-right">
                      <div className="flex items-end justify-between gap-3 sm:justify-end">
                        <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Progression
                        </p>
                        <p className="text-lg font-black leading-none text-[var(--heading-color)]">
                          {workspace.progressPercent}%
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                        <div
                          className="h-full rounded-full bg-[image:var(--tyash-progress-gradient)]"
                          style={{ width: `${workspace.progressPercent}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[0.65rem] text-[var(--text-muted)]">
                        {workspace.completedModulesCount}/{workspace.totalModulesCount} modules terminés
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-[var(--border)] pb-8 pt-1 sm:pb-10">
          <p className="font-more-sugar mx-auto max-w-4xl text-center text-[2.35rem] leading-[1.02] text-[var(--text-primary)] sm:text-[2.9rem] lg:text-[3.35rem]">
            Ton histoire commence ici, écrivons-la ensemble !
          </p>
        </div>

        {!workspace.project ? (
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_18px_46px_rgba(210,189,152,0.1)] sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="inline-flex rounded-full bs-status-light bg-[#f2eef7] px-4 py-2 text-[0.76rem] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Création
                </p>
                <h2 className="mt-5 font-[family:var(--font-cormorant)] text-[2.4rem] leading-[0.98] text-[var(--heading-color)] sm:text-[3rem]">
                  Lance ton projet
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-[var(--text-muted)]">
                  Le projet commence simplement avec le nom de ton entreprise et
                  ton logo (si tu en as déjà un). Tu pourras ensuite suivre
                  l&apos;ensemble des modules et des exercices.
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface)] p-6">
                <ProjectNameForm />
              </div>
            </div>
          </section>
        ) : null}

        {workspace.project ? (
          <section className="grid gap-6">
            {workspace.modules.length === 0 ? (
              <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] p-6 text-base leading-8 text-[var(--text-muted)] shadow-[0_18px_46px_rgba(210,189,152,0.1)]">
                Aucun module n&apos;est encore publie. Un administrateur peut les
                ajouter depuis l&apos;espace de gestion.
              </div>
            ) : workspace.modules.length > 0 ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <RevealOnScroll>
                  <BrandStudioTyAshLockup compact />
                </RevealOnScroll>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
      </main>
    </ContentPreviewFrame>
  );
}
