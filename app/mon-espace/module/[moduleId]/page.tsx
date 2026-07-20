import Link from "next/link";
import { notFound, redirect, unstable_rethrow } from "next/navigation";
import DatabaseErrorState from "@/app/ui/database-error-state";
import ModuleCompletionScreen from "@/app/ui/module-completion-screen";
import ModuleLearningSection from "@/app/ui/module-learning-section";
import ModulePreviewTrigger from "@/app/ui/module-preview-trigger";
import { getModuleShareData } from "@/lib/get-module-share-data";
import { buildModuleSummaryCard } from "@/lib/module-summary";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import { getWorkspaceData } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

export const dynamic = "force-dynamic";

export default async function WorkspaceModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams?: Promise<{
    submodule?: string;
    exercise?: string;
    mode?: string;
    summary?: string;
  }>;
}) {
  let account: Awaited<ReturnType<typeof getAuthenticatedAccount>> | null = null;
  let workspace: Awaited<ReturnType<typeof getWorkspaceData>> | null = null;
  let loadError = "";
  const { moduleId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

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

  if (!account || !workspace) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl">
          <DatabaseErrorState
            title="Ce module ne peut pas être chargé"
            message={loadError}
            backHref="/mon-espace"
            backLabel="Retour à mon espace"
          />
        </section>
      </main>
    );
  }

  const numericModuleId = Number(moduleId);

  if (!workspace.project) {
    redirect("/mon-espace");
  }

  if (!Number.isFinite(numericModuleId) || numericModuleId <= 0) {
    notFound();
  }

  const currentModule = workspace.modules.find((item) => item.id === numericModuleId);

  if (!currentModule) {
    notFound();
  }

  const requestedSubmoduleIndex = Number(resolvedSearchParams?.submodule ?? "0");
  const requestedExerciseIndex = Number(resolvedSearchParams?.exercise ?? "0");
  const initialSubmoduleIndex = Number.isFinite(requestedSubmoduleIndex)
    ? Math.min(
        Math.max(requestedSubmoduleIndex, 0),
        Math.max(currentModule.submodules.length - 1, 0),
      )
    : 0;
  const selectedSubmodule = currentModule.submodules[initialSubmoduleIndex];
  const initialExerciseIndex =
    selectedSubmodule && Number.isFinite(requestedExerciseIndex)
      ? Math.min(
          Math.max(requestedExerciseIndex, 0),
          Math.max(selectedSubmodule.exercises.length - 1, 0),
        )
      : 0;
  const startInExercises = resolvedSearchParams?.mode === "exercises";
  const shouldForceSummary = resolvedSearchParams?.summary === "1";

  const showSummary = shouldForceSummary;
  const summaryCard = workspace.project
    ? buildModuleSummaryCard({
        projectName: account.company_name?.trim() || workspace.project.name,
        module: currentModule,
      })
    : null;
  const completionHref = `/mon-espace/module/${currentModule.id}/complete`;
  const pdfHref = `/mon-espace/module/${currentModule.id}/summary-pdf`;
  const brandName = account.company_name?.trim() || workspace.project.name;
  const shareData = summaryCard
    ? {
        ...getModuleShareData({
          brandName,
          module: currentModule,
          summary: summaryCard,
        }),
        progress: 100,
      }
    : null;
  const nextModule = workspace.modules
    .filter((module) => module.position > currentModule.position)
    .sort((left, right) => left.position - right.position)[0];

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/mon-espace"
            className="inline-flex h-11 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
          >
            Retour à mon espace
          </Link>
        </div>

        <article className="border-t border-[#eadfca] pt-6 sm:pt-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start lg:gap-8">
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-[#fff6e3] px-4 py-2 text-[0.74rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
                Module {currentModule.position}
              </span>
              <h1 className="mt-4 text-2xl font-semibold text-[#4b4550] sm:text-3xl">
                {currentModule.title}
              </h1>
            </div>

            <div className="flex min-w-0 items-start gap-4 border-l border-[#eadfca] pl-5 lg:pl-6">
              <ModulePreviewTrigger
                submodules={currentModule.submodules}
                currentIndex={initialSubmoduleIndex}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[0.76rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
                  Avancement du module
                </p>
                <p className="mt-4 text-4xl font-black leading-none text-[#4b4550]">
                  {currentModule.progress.completionPercent}%
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#f1ece5]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#d88a2f,#f0cf55)]"
                    style={{ width: `${currentModule.progress.completionPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {!showSummary ? (
            <ModuleLearningSection
              module={currentModule}
              initialSubmoduleIndex={initialSubmoduleIndex}
              initialExerciseIndex={initialExerciseIndex}
              startInExercises={startInExercises}
            />
          ) : null}

          {showSummary && summaryCard && shareData ? (
            <ModuleCompletionScreen
              summary={summaryCard}
              shareData={shareData}
              editHref={`/mon-espace/module/${currentModule.id}?mode=exercises`}
              completionHref={completionHref}
              pdfHref={pdfHref}
              nextHref={
                nextModule
                  ? `/mon-espace/module/${nextModule.id}`
                  : undefined
              }
              nextLabel={
                nextModule ? "Passer au module suivant" : undefined
              }
              hideAnswerSummaries={currentModule.position === 4}
            />
          ) : null}
        </article>
      </section>
    </main>
  );
}
