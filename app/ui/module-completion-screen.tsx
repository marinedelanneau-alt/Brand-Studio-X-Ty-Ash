"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  DocumentArrowDownIcon,
  PencilSquareIcon,
  ShareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type {
  ModuleKeyTakeaway,
  ModuleSummaryCard,
  ModuleSummaryColor,
} from "@/lib/module-summary";
import type { ModuleShareData } from "@/lib/get-module-share-data";
import type { WorkspaceModule } from "@/lib/training-types";
import { slugifyFilePart } from "@/lib/get-module-share-data";
import {
  dataUrlToFile,
  downloadDataUrl,
  exportStoryAsPng,
} from "@/lib/export-story-as-png";
import ShareStoryCard from "./share-story-card";
import ModuleAnswerForm from "./module-answer-form";

function formatSummaryForClipboard(summary: ModuleSummaryCard) {
  return [
    `${summary.title} - ${summary.subtitle}`,
    "",
    "Ce que tu as construit",
    ...summary.submoduleRecaps.flatMap((submodule) => [
      "",
      submodule.title,
      ...submodule.highlights.map((item) => `- ${item.label}: ${item.value}`),
    ]),
  ].join("\n");
}

function CompletionHero({
  summary,
  shareData,
}: {
  summary: ModuleSummaryCard;
  shareData: ModuleShareData;
}) {
  const progress = Math.max(0, Math.min(shareData.progress, 100));

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[#e5ded3] bg-[linear-gradient(135deg,#fdfbf6_0%,#fbf8f1_68%,#f7f1e6_100%)] px-6 py-7 shadow-[0_18px_44px_rgba(21,33,59,0.06)] sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute right-6 top-6 hidden h-28 w-28 rounded-full border border-white/70 bg-white/35 sm:block" />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
        <div>
          <span className="inline-flex rounded-full border border-white/70 bg-white/75 px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#cf7430]">
            Module termine
          </span>
          <h1 className="mt-5 max-w-3xl font-[family:var(--font-cormorant)] text-[2.6rem] leading-[0.95] text-[#332d35] sm:text-[3.35rem]">
            Bravo, tu viens de terminer {summary.title}.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#5f544a]">
            Tu as posé une nouvelle base pour ta marque. Voici les éléments essentiels à garder, partager ou reprendre pour avancer.
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-white/75 bg-white/70 px-5 py-5">
          <div className="flex items-end justify-between">
            <p className="text-sm font-bold text-[#6f645b]">Progression du module</p>
            <p className="text-4xl font-black text-[#332d35]">{progress}%</p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#df9b39,#f1cc56)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-[#6f645b]">
            Une étape terminée, une vision plus nette.
          </p>
        </div>
      </div>
    </section>
  );
}

function PaletteSummary({ colors }: { colors: ModuleSummaryColor[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {colors.map((color, index) => (
        <div
          key={`${color.name}-${color.value}-${index}`}
          className="flex min-w-[8.5rem] items-center gap-2 rounded-full border border-[#eadfca] bg-[#fffdf8] py-1.5 pl-1.5 pr-3"
        >
          <span
            aria-hidden="true"
            className="h-8 w-8 shrink-0 rounded-full border border-black/10 shadow-inner"
            style={{ background: color.background }}
          />
          <span className="min-w-0">
            <span className="block truncate text-xs font-extrabold text-[#4f463f]">
              {color.name}
            </span>
            <span className="block text-[0.68rem] font-semibold text-[#7a7087]">
              {color.value}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function KeyTakeawayCard({ item }: { item: ModuleKeyTakeaway }) {
  return (
    <article className="rounded-[1.1rem] border border-[#eadfca] bg-white px-5 py-5 shadow-[0_12px_28px_rgba(91,73,57,0.05)]">
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#7a7087]">
        {item.label}
      </h3>
      {item.colors && item.colors.length > 0 ? (
        <PaletteSummary colors={item.colors} />
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-base font-semibold leading-7 text-[#6f645b]">
          {item.value}
        </p>
      )}
    </article>
  );
}

const positioningModuleVisibleLabels = new Set([
  "le moment ou ta marque intervient",
  "ta difference",
  "ton positionnement formule",
]);

function normalizeSummaryLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

function ModuleKeyTakeaways({
  summary,
  modulePosition,
}: {
  summary: ModuleSummaryCard;
  modulePosition: number;
}) {
  const takeaways =
    modulePosition === 2
      ? summary.keyTakeaways.filter((item) =>
          positioningModuleVisibleLabels.has(normalizeSummaryLabel(item.label)),
        )
      : summary.keyTakeaways;

  if (takeaways.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#cf7430]">
          Synthese express
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-[#332d35]">
          Voici les éléments essentiels que tu viens de construire.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {takeaways.map((item) => (
          <KeyTakeawayCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function StorySharePreview({
  storyRef,
  shareData,
  showBrandName,
  isExportingStory,
  onShareStory,
  onShowBrandNameChange,
}: {
  storyRef: React.RefObject<HTMLElement | null>;
  shareData: ModuleShareData;
  showBrandName: boolean;
  isExportingStory: boolean;
  onShareStory: () => void;
  onShowBrandNameChange: (show: boolean) => void;
}) {
  return (
    <section className="grid gap-7 rounded-[1.5rem] border border-[#eadfca] bg-white px-5 py-6 shadow-[0_16px_36px_rgba(91,73,57,0.06)] lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#cf7430]">
            Partager mon avancée
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-[#332d35]">
            Une story pour célébrer cette belle avancée 🎉
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f645b]">
            Partage ton avancée pour commencer à communiquer sur ta marque :)
          </p>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 text-sm font-bold text-[#5f544a]">
            <input
              type="checkbox"
              checked={showBrandName}
              onChange={(event) => onShowBrandNameChange(event.target.checked)}
              className="h-5 w-5 accent-[#cf7430]"
            />
            Afficher le nom de ma marque
          </label>
          <button
            type="button"
            onClick={onShareStory}
            disabled={isExportingStory}
            className="bs-button-primary inline-flex h-12 items-center justify-center gap-2 rounded-[0.95rem] px-5 text-sm font-extrabold shadow-[0_14px_28px_rgba(21,33,59,0.16)]"
          >
            <ShareIcon className="h-4 w-4" />
            {isExportingStory ? "Préparation..." : "Partager en story Instagram"}
          </button>
          <p className="max-w-md text-sm leading-6 text-[#7b7068]">
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            Sur mobile, choisis Instagram dans le partage, puis ajoute l'image en story. Si l'option n'apparaît pas, la story sera téléchargée en PNG.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[16rem]">
        <ShareStoryCard
          ref={storyRef}
          data={shareData}
          showBrandName={showBrandName}
        />
      </div>
    </section>
  );
}

function ModuleDetailAccordion({
  summary,
  onAdjustAnswer,
}: {
  summary: ModuleSummaryCard;
  onAdjustAnswer: (exerciseId: number) => void;
}) {
  const recaps = summary.submoduleRecaps.filter(
    (submodule) => submodule.highlights.length > 0,
  );
  const [openIds, setOpenIds] = useState<Set<number>>(() =>
    new Set(recaps[0] ? [recaps[0].id] : []),
  );

  if (recaps.length === 0) {
    return null;
  }

  function toggle(id: number) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section className="rounded-[1.5rem] border border-[#eadfca] bg-white px-5 py-6 shadow-[0_16px_36px_rgba(91,73,57,0.06)]">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#cf7430]">
          Ce que tu as construit
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-[#332d35]">
          Le détail par sous-module
        </h2>
      </div>

      <div className="mt-5 divide-y divide-[#f0e4d3]">
        {recaps.map((submodule) => {
          const isOpen = openIds.has(submodule.id);

          return (
            <article key={submodule.id} className="py-4 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => toggle(submodule.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff6e3] text-sm font-black text-[#cf7430]">
                    {submodule.position}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-extrabold leading-6 text-[#332d35]">
                      {submodule.title}
                    </span>
                    <span className="mt-1 block text-sm text-[#7a7087]">
                      {submodule.highlights.length} réponse{submodule.highlights.length > 1 ? "s" : ""}
                    </span>
                  </span>
                </span>
                <ChevronDownIcon
                  className={`h-5 w-5 shrink-0 text-[#cf7430] transition ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {submodule.highlights.length > 0 ? (
                    submodule.highlights.map((item, index) => (
                      <div
                        key={`${item.label}-${index}`}
                        className="rounded-[1rem] border border-[#f0e4d3] bg-[#fffdf8] px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7a7087]">
                            {item.label}
                          </p>
                          {item.exerciseId !== undefined ? (
                            <button
                              type="button"
                              onClick={() => onAdjustAnswer(item.exerciseId!)}
                              aria-label="Ajuster ma réponse"
                              title="Ajuster ma réponse"
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#eadfca]/80 bg-transparent text-[#a97955] opacity-70 transition hover:border-[#dfb98d] hover:bg-white hover:text-[#cf7430] hover:opacity-100"
                            >
                              <PencilSquareIcon className="h-3 w-3" />
                            </button>
                          ) : null}
                        </div>
                        {item.colors && item.colors.length > 0 ? (
                          <PaletteSummary colors={item.colors} />
                        ) : (
                          <p className="mt-2 text-sm font-semibold leading-6 text-[#4f463f]">
                            {item.value}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-[1rem] border border-[#f0e4d3] bg-[#fffdf8] px-4 py-3 text-sm text-[#6f645b]">
                      Aucune réponse à afficher pour ce sous-module.
                    </p>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CompletionActions({
  pdfHref,
  editHref,
  nextHref,
  nextLabel,
  isCompleting,
  isExportingStory,
  onNext,
  onDownloadStory,
  onCopySummary,
}: {
  pdfHref: string;
  editHref: string;
  nextHref?: string;
  nextLabel?: string;
  isCompleting: boolean;
  isExportingStory: boolean;
  onNext: (href: string) => void;
  onDownloadStory: () => void;
  onCopySummary: () => void;
}) {
  const primaryClass = "bs-button-primary flex h-12 w-full items-center justify-center gap-2 rounded-[0.95rem] px-5 text-sm font-extrabold sm:w-auto";
  const secondaryClass = "flex h-12 w-full items-center justify-center gap-2 rounded-[0.95rem] border border-[#eadfca] bg-white px-5 text-sm font-extrabold text-[#5f544a] disabled:cursor-wait disabled:opacity-70 sm:w-auto";
  const softClass = "flex h-12 w-full items-center justify-center gap-2 rounded-[0.95rem] border border-[#efd7b8] bg-[#fff6e3] px-5 text-sm font-extrabold text-[#cf7430] disabled:cursor-wait disabled:opacity-70 sm:w-auto";

  return (
    <section className="rounded-[1.5rem] border border-[#eadfca] bg-[#fffdf8] px-5 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {nextHref ? (
          <button
            type="button"
            disabled={isCompleting}
            onClick={() => onNext(nextHref)}
            className={primaryClass}
          >
            {isCompleting ? "Ouverture..." : (nextLabel ?? "Passer au module suivant")}
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        ) : (
          <Link href="/brand-guide" className={primaryClass}>
            Générer mon Guide de Marque
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        )}

        <Link href={pdfHref} className={secondaryClass}>
          <DocumentArrowDownIcon className="h-4 w-4" />
          Télécharger le PDF
        </Link>
        <button
          type="button"
          onClick={onDownloadStory}
          disabled={isExportingStory}
          className={softClass}
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Télécharger la story
        </button>
        <button type="button" onClick={onCopySummary} className={secondaryClass}>
          <ClipboardDocumentIcon className="h-4 w-4" />
          Copier mon résumé
        </button>
        <Link href={editHref} className={secondaryClass}>
          Revenir aux questions
        </Link>
      </div>
    </section>
  );
}

export default function ModuleCompletionScreen({
  summary,
  shareData,
  module,
  userId,
  projectId,
  modulePosition,
  editHref,
  completionHref,
  pdfHref,
  nextHref,
  nextLabel,
  hideAnswerSummaries = false,
}: {
  summary: ModuleSummaryCard;
  shareData: ModuleShareData;
  module: WorkspaceModule;
  userId: number;
  projectId: number;
  modulePosition: number;
  editHref: string;
  completionHref: string;
  pdfHref: string;
  nextHref?: string;
  nextLabel?: string;
  hideAnswerSummaries?: boolean;
}) {
  const router = useRouter();
  const storyRef = useRef<HTMLElement | null>(null);
  const [showBrandName, setShowBrandName] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isExportingStory, setIsExportingStory] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isValidatingAdjustment, setIsValidatingAdjustment] = useState(false);
  const [adjustedExerciseId, setAdjustedExerciseId] = useState<number | null>(null);
  const adjustedExercise = module.exercises.find(
    (exercise) => exercise.id === adjustedExerciseId,
  );
  const adjustedSubmoduleIndex = adjustedExercise
    ? module.submodules.findIndex(
        (submodule) => submodule.id === adjustedExercise.submodule_id,
      )
    : -1;
  const adjustedSubmodule = module.submodules[adjustedSubmoduleIndex];
  const adjustedExerciseIndex = adjustedSubmodule && adjustedExercise
    ? adjustedSubmodule.exercises.findIndex(
        (exercise) => exercise.id === adjustedExercise.id,
      )
    : 0;
  const isActivationModule =
    hideAnswerSummaries ||
    shareData.moduleKey.includes("activation") ||
    summary.submoduleRecaps.some((submodule) =>
      submodule.title.toLocaleLowerCase("fr").includes("activation"),
    );

  const storyFilename = useMemo(
    () =>
      `brand-studio-story-${shareData.moduleKey}-${slugifyFilePart(
        shareData.brandName,
      )}.png`,
    [shareData.brandName, shareData.moduleKey],
  );

  useEffect(() => {
    void fetch(completionHref, {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => undefined);
  }, [completionHref]);

  async function completeAndNavigate(nextUrl: string) {
    setIsCompleting(true);

    try {
      await fetch(completionHref, {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      window.location.assign(nextUrl);
    }
  }

  async function exportStory() {
    if (!storyRef.current) {
      return null;
    }

    setIsExportingStory(true);
    setStatusMessage("");

    try {
      const dataUrl = await exportStoryAsPng(storyRef.current);
      return dataUrl;
    } finally {
      setIsExportingStory(false);
    }
  }

  async function downloadStory() {
    const dataUrl = await exportStory();

    if (!dataUrl) {
      return;
    }

    downloadDataUrl(dataUrl, storyFilename);
    setStatusMessage("Story téléchargée en PNG.");
  }

  async function shareStory() {
    const dataUrl = await exportStory();

    if (!dataUrl) {
      return;
    }

    const file = await dataUrlToFile(dataUrl, storyFilename);
    const sharePayload = {
      files: [file],
      title: `Story Brand Studio - ${shareData.moduleTitle}`,
      text: `${shareData.shareSentence} Je construis ma marque avec Brand Studio.`,
    };
    const canShareFile =
      "canShare" in navigator && typeof navigator.canShare === "function"
        ? navigator.canShare({ files: [file] })
        : true;

    if ("share" in navigator && canShareFile) {
      try {
        setStatusMessage("La story est prête. Choisis Instagram, puis Story.");
        await navigator.share(sharePayload);
        setStatusMessage("Choisis Instagram dans le partage, puis ajoute l'image en story.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setStatusMessage("Partage annulé. Tu peux réessayer ou télécharger la story.");
          return;
        }

        downloadDataUrl(dataUrl, storyFilename);
        setStatusMessage("Partage annulé. Tu peux télécharger la story et l'ajouter sur Instagram.");
        return;
      }
    }

    downloadDataUrl(dataUrl, storyFilename);
    setStatusMessage("Story téléchargée. Ouvre Instagram, crée une story et sélectionne cette image.");
  }

  async function copySummary() {
    await navigator.clipboard.writeText(formatSummaryForClipboard(summary));
    setStatusMessage("Résumé copié dans le presse-papiers.");
  }

  return (
    <section id="resume-module" className="mt-10 space-y-7">
      <CompletionHero summary={summary} shareData={shareData} />
      {!isActivationModule ? (
        <ModuleKeyTakeaways summary={summary} modulePosition={modulePosition} />
      ) : null}
      <StorySharePreview
        storyRef={storyRef}
        shareData={shareData}
        showBrandName={showBrandName}
        isExportingStory={isExportingStory}
        onShareStory={() => void shareStory()}
        onShowBrandNameChange={setShowBrandName}
      />
      <ModuleDetailAccordion
        summary={summary}
        onAdjustAnswer={setAdjustedExerciseId}
      />
      <CompletionActions
        pdfHref={pdfHref}
        editHref={editHref}
        nextHref={nextHref}
        nextLabel={nextLabel}
        isCompleting={isCompleting}
        isExportingStory={isExportingStory}
        onNext={(href) => void completeAndNavigate(href)}
        onDownloadStory={() => void downloadStory()}
        onCopySummary={() => void copySummary()}
      />

      {statusMessage ? (
        <p className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-3 text-sm font-bold text-[#5f544a]">
          {statusMessage}
        </p>
      ) : null}

      {adjustedExercise && adjustedSubmodule ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[#2f2418]/45 px-4 py-6 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Ajuster ma réponse"
        >
          <div className="mx-auto max-w-4xl rounded-[1.6rem] border border-[#eadfca] bg-[#fffdf8] p-5 shadow-[0_24px_70px_rgba(47,36,24,0.2)] sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#cf7430]">
                  Ajuster ma réponse
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-[#332d35]">
                  {adjustedSubmodule.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAdjustedExerciseId(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#6b625a]"
                aria-label="Fermer"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <ModuleAnswerForm
              key={adjustedExercise.id}
              module={module}
              persistenceScope={{ userId, projectId, moduleId: module.id }}
              activeSubmoduleId={adjustedSubmodule.id}
              initialExerciseIndex={Math.max(adjustedExerciseIndex, 0)}
              currentSubmoduleIndex={adjustedSubmoduleIndex}
              totalSubmodules={module.submodules.length}
            />

            <div className="mt-5 flex justify-end border-t border-[#eadfca] pt-5">
              <button
                type="button"
                disabled={isValidatingAdjustment}
                onClick={async () => {
                  setIsValidatingAdjustment(true);
                  await new Promise((resolve) => window.setTimeout(resolve, 1400));
                  setAdjustedExerciseId(null);
                  setStatusMessage("Ta réponse a été mise à jour.");
                  router.refresh();
                  setIsValidatingAdjustment(false);
                }}
                className="bs-button-primary inline-flex h-11 items-center justify-center rounded-[0.9rem] px-5 text-sm font-extrabold"
              >
                {isValidatingAdjustment ? "Enregistrement..." : "Valider la modification"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
