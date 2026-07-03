"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  DocumentArrowDownIcon,
  PaintBrushIcon,
  PencilSquareIcon,
  PhotoIcon,
  ShareIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import type { ModuleSummaryCard } from "@/lib/module-summary";
import type { ModuleShareData, StoryTemplate } from "@/lib/get-module-share-data";
import { slugifyFilePart } from "@/lib/get-module-share-data";
import {
  dataUrlToFile,
  downloadDataUrl,
  exportStoryAsPng,
} from "@/lib/export-story-as-png";
import ShareStoryCard from "./share-story-card";
import StoryTemplateSelector from "./story-template-selector";

type TakeawayIcon = "persona" | "odor" | "baseline" | "palette" | "moodboard" | "spark";

type KeyTakeaway = {
  id: string;
  label: string;
  value: string;
  context: string;
  icon: TakeawayIcon;
};

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

function normalizeForSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripLabelPrefix(value: string) {
  return compactText(value).replace(/^[^:]{1,80}:\s*/, "");
}

function cleanSummaryValue(value: string) {
  return value
    .split(" | ")
    .map(stripLabelPrefix)
    .filter(Boolean)
    .join(" · ");
}

function isUsableValue(value: string) {
  const normalized = normalizeForSearch(value);
  return Boolean(value.trim()) && !normalized.includes("a completer") && normalized !== "undefined";
}

function TakeawayIconMark({ icon }: { icon: TakeawayIcon }) {
  if (icon === "persona") return <UserCircleIcon className="h-5 w-5" />;
  if (icon === "odor") return <SparklesIcon className="h-5 w-5" />;
  if (icon === "baseline") return <PencilSquareIcon className="h-5 w-5" />;
  if (icon === "palette") return <PaintBrushIcon className="h-5 w-5" />;
  if (icon === "moodboard") return <PhotoIcon className="h-5 w-5" />;
  return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
}

function getModuleKeyTakeaways(summary: ModuleSummaryCard) {
  const sourceItems = summary.submoduleRecaps.flatMap((submodule) =>
    submodule.highlights.map((highlight) => ({
      submoduleTitle: submodule.title,
      highlight,
      haystack: normalizeForSearch(`${submodule.title} ${highlight.label} ${highlight.value}`),
    })),
  );

  const definitions: Array<{
    id: string;
    label: string;
    icon: TakeawayIcon;
    keywords: string[];
    context: string;
  }> = [
    {
      id: "persona",
      label: "Persona",
      icon: "persona",
      keywords: ["persona", "personnalite", "incarnee", "prenom", "profession"],
      context: "Le visage et l'attitude qui incarnent ta marque.",
    },
    {
      id: "odor",
      label: "Odeur",
      icon: "odor",
      keywords: ["odeur", "sentir", "senteur"],
      context: "Une sensation immediate pour rendre l'univers plus vivant.",
    },
    {
      id: "baseline",
      label: "Baseline",
      icon: "baseline",
      keywords: ["baseline", "slogan", "signature", "resume en une phrase"],
      context: "Une formule courte pour clarifier ton message.",
    },
    {
      id: "palette",
      label: "Palette",
      icon: "palette",
      keywords: ["palette", "couleur", "couleurs"],
      context: "Les indices visuels qui posent l'ambiance.",
    },
    {
      id: "moodboard",
      label: "Moodboard",
      icon: "moodboard",
      keywords: ["moodboard", "ambiance", "univers visuel", "direction artistique"],
      context: "Une direction visuelle pour guider les prochains choix.",
    },
  ];

  const takeaways = definitions.flatMap((definition) => {
    const match = sourceItems.find((item) =>
      definition.keywords.some((keyword) => item.haystack.includes(normalizeForSearch(keyword))),
    );
    const value = match ? cleanSummaryValue(match.highlight.value) : "";

    return isUsableValue(value)
      ? [{
          id: definition.id,
          label: definition.label,
          value,
          context: definition.context,
          icon: definition.icon,
        } satisfies KeyTakeaway]
      : [];
  });

  if (takeaways.length >= 3) {
    return takeaways.slice(0, 5);
  }

  const fallback = sourceItems
    .filter((item) => !takeaways.some((takeaway) => normalizeForSearch(takeaway.value) === normalizeForSearch(cleanSummaryValue(item.highlight.value))))
    .map((item, index) => ({
      id: `extra-${item.highlight.label}-${index}`,
      label: item.highlight.label,
      value: cleanSummaryValue(item.highlight.value),
      context: item.submoduleTitle,
      icon: "spark" as const,
    }))
    .filter((item) => isUsableValue(item.value));

  return [...takeaways, ...fallback].slice(0, 5);
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
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[#eadfca] bg-[linear-gradient(135deg,#fffdf8_0%,#fff3df_62%,#f8dfac_100%)] px-6 py-7 shadow-[0_18px_44px_rgba(91,73,57,0.08)] sm:px-8 sm:py-9">
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

function KeyTakeawayCard({ item }: { item: KeyTakeaway }) {
  const isLong = item.value.length > 112;

  return (
    <article className="rounded-[1.2rem] border border-[#eadfca] bg-white px-5 py-5 shadow-[0_12px_28px_rgba(91,73,57,0.05)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff6e3] text-[#cf7430]">
          <TakeawayIconMark icon={item.icon} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#7a7087]">
            {item.label}
          </h3>
          <p className={`mt-2 text-base font-extrabold leading-6 text-[#332d35] ${isLong ? "line-clamp-2" : ""}`}>
            {item.value}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#6f645b]">{item.context}</p>
      {isLong ? (
        <details className="mt-3 text-sm leading-6 text-[#5f544a]">
          <summary className="cursor-pointer font-bold text-[#cf7430]">Voir plus</summary>
          <p className="mt-2">{item.value}</p>
        </details>
      ) : null}
    </article>
  );
}

function ModuleKeyTakeaways({ summary }: { summary: ModuleSummaryCard }) {
  const takeaways = getModuleKeyTakeaways(summary);

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
  template,
  showBrandName,
  onTemplateChange,
  onShowBrandNameChange,
}: {
  storyRef: React.RefObject<HTMLElement | null>;
  shareData: ModuleShareData;
  template: StoryTemplate;
  showBrandName: boolean;
  onTemplateChange: (template: StoryTemplate) => void;
  onShowBrandNameChange: (show: boolean) => void;
}) {
  return (
    <section className="grid gap-7 rounded-[1.5rem] border border-[#eadfca] bg-white px-5 py-6 shadow-[0_16px_36px_rgba(91,73,57,0.06)] lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#cf7430]">
            Partager mon avancee
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-[#332d35]">
            Une story simple pour célébrer ton module.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f645b]">
            Crée une story simple et jolie pour partager ton avancée sans dévoiler tes réponses.
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
          <StoryTemplateSelector value={template} onChange={onTemplateChange} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[16rem]">
        <ShareStoryCard
          ref={storyRef}
          data={shareData}
          template={template}
          showBrandName={showBrandName}
        />
      </div>
    </section>
  );
}

function ModuleDetailAccordion({ summary }: { summary: ModuleSummaryCard }) {
  const recaps = summary.submoduleRecaps;
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
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7a7087]">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#4f463f]">
                          {item.value}
                        </p>
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
  onShareStory,
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
  onShareStory: () => void;
  onCopySummary: () => void;
}) {
  const primaryClass = "flex h-12 w-full items-center justify-center gap-2 rounded-[0.95rem] bg-[#4b4550] px-5 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-70 sm:w-auto";
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
        <button
          type="button"
          onClick={onShareStory}
          disabled={isExportingStory}
          className={secondaryClass}
        >
          <ShareIcon className="h-4 w-4" />
          Partager
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
  editHref,
  completionHref,
  pdfHref,
  nextHref,
  nextLabel,
}: {
  summary: ModuleSummaryCard;
  shareData: ModuleShareData;
  editHref: string;
  completionHref: string;
  pdfHref: string;
  nextHref?: string;
  nextLabel?: string;
}) {
  const storyRef = useRef<HTMLElement | null>(null);
  const [template, setTemplate] = useState<StoryTemplate>("minimal");
  const [showBrandName, setShowBrandName] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isExportingStory, setIsExportingStory] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

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

    if ("share" in navigator && (!("canShare" in navigator) || navigator.canShare(sharePayload))) {
      try {
        await navigator.share(sharePayload);
        setStatusMessage("Choisis Instagram dans le partage, puis ajoute l'image en story.");
        return;
      } catch {
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
      <ModuleKeyTakeaways summary={summary} />
      <StorySharePreview
        storyRef={storyRef}
        shareData={shareData}
        template={template}
        showBrandName={showBrandName}
        onTemplateChange={setTemplate}
        onShowBrandNameChange={setShowBrandName}
      />
      <ModuleDetailAccordion summary={summary} />
      <CompletionActions
        pdfHref={pdfHref}
        editHref={editHref}
        nextHref={nextHref}
        nextLabel={nextLabel}
        isCompleting={isCompleting}
        isExportingStory={isExportingStory}
        onNext={(href) => void completeAndNavigate(href)}
        onDownloadStory={() => void downloadStory()}
        onShareStory={() => void shareStory()}
        onCopySummary={() => void copySummary()}
      />

      {statusMessage ? (
        <p className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-3 text-sm font-bold text-[#5f544a]">
          {statusMessage}
        </p>
      ) : null}
    </section>
  );
}
