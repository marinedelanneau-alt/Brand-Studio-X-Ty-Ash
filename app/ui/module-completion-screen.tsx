"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

function formatSummaryForClipboard(summary: ModuleSummaryCard) {
  return [
    `${summary.title} - ${summary.subtitle}`,
    "",
    summary.insight,
    "",
    ...summary.submoduleRecaps.flatMap((submodule) => [
      `${submodule.title}`,
      submodule.summary,
      ...submodule.highlights.map((item) => `- ${item.label}: ${item.value}`),
      "",
    ]),
  ].join("\n");
}

function SubmoduleRecapGrid({ summary }: { summary: ModuleSummaryCard }) {
  const recaps =
    summary.submoduleRecaps.length > 0
      ? summary.submoduleRecaps
      : [
          {
            id: 0,
            position: 1,
            title: summary.title,
            summary: summary.insight,
            highlights: summary.highlights,
          },
        ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
          Resume par sous-module
        </p>
        <p className="mt-2 text-sm leading-6 text-[#6f645b]">
          Une lecture rapide de ce que tu as formulé, organisée par étape du module.
        </p>
      </div>
      <div className="grid gap-4">
        {recaps.map((submodule) => (
          <article
            key={`${submodule.id}-${submodule.position}`}
            className="overflow-hidden rounded-[1.25rem] border border-[#eadfca] bg-white shadow-[0_12px_30px_rgba(91,73,57,0.05)]"
          >
            <div className="flex flex-col gap-4 border-b border-[#f0e4d3] bg-[#fffaf2] px-5 py-4 sm:flex-row sm:items-start">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#df9b39,#f1cc56)] text-sm font-black text-white">
                {submodule.position}
              </span>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
                  Sous-module
                </p>
                <h3 className="mt-1 text-lg font-extrabold leading-6 text-[#4b4550]">
                  {submodule.title}
                </h3>
              </div>
            </div>
            <div className="space-y-4 px-5 py-5">
              <p className="text-sm leading-7 text-[#5f544a]">{submodule.summary}</p>
              {submodule.highlights.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {submodule.highlights.map((item, index) => (
                    <div
                      key={`${item.label}-${index}`}
                      className="rounded-[1rem] border border-[#f0e4d3] bg-[#fffdf8] px-4 py-3"
                    >
                      <p className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-[#7a7087]">
                        {item.label}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-[#4f463f]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
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
    setStatusMessage("Story telechargee en PNG.");
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
        setStatusMessage("Partage annule. Tu peux telecharger la story et l'ajouter sur Instagram.");
        return;
      }
    }

    downloadDataUrl(dataUrl, storyFilename);
    setStatusMessage("Story telechargee. Ouvre Instagram, cree une story et selectionne cette image.");
  }

  async function copySummary() {
    await navigator.clipboard.writeText(formatSummaryForClipboard(summary));
    setStatusMessage("Resume copie dans le presse-papiers.");
  }

  return (
    <section
      id="resume-module"
      className="mt-10 overflow-hidden rounded-[2rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdf9_0%,#fff8f0_100%)] shadow-[0_22px_50px_rgba(210,189,152,0.12)]"
    >
      <div className="grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="space-y-7">
          <div>
            <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
              Module termine
            </p>
            <h2 className="mt-4 font-[family:var(--font-cormorant)] text-[2.45rem] leading-[0.95] text-[#4b4550] sm:text-[3.1rem]">
              Bravo, tu viens de terminer le module {summary.title}.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#6f645b]">
              Tu peux garder une trace de ton travail, telecharger ton resume ou
              partager ton avancee en story sans exposer tes reponses detaillees.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-[#eadfca] bg-white px-5 py-5">
            <SubmoduleRecapGrid summary={summary} />
          </div>

          <div className="space-y-4 rounded-[1.25rem] border border-[#eadfca] bg-white px-5 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
                  Story a partager
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6f645b]">
                  Choisis un rendu, puis partage l&apos;image directement depuis ton mobile.
                </p>
              </div>
              <label className="flex items-center gap-3 text-sm font-bold text-[#5f544a]">
                <input
                  type="checkbox"
                  checked={showBrandName}
                  onChange={(event) => setShowBrandName(event.target.checked)}
                  className="h-5 w-5 accent-[#cf7430]"
                />
                Afficher le nom de ma marque
              </label>
            </div>
            <StoryTemplateSelector value={template} onChange={setTemplate} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={pdfHref}
              className="inline-flex h-12 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-white"
            >
              Telecharger mon resume PDF
            </Link>
            <button
              type="button"
              onClick={() => void shareStory()}
              disabled={isExportingStory}
              className="inline-flex h-12 items-center justify-center rounded-[0.95rem] border border-[#efd7b8] bg-[#fff6e3] px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#cf7430] disabled:cursor-wait disabled:opacity-70"
            >
              {isExportingStory ? "Generation..." : "Partager en story Instagram"}
            </button>
            <button
              type="button"
              onClick={() => void downloadStory()}
              disabled={isExportingStory}
              className="inline-flex h-12 items-center justify-center rounded-[0.95rem] border border-[#eadfca] bg-white px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-wait disabled:opacity-70"
            >
              Telecharger la story
            </button>
            <button
              type="button"
              onClick={() => void copySummary()}
              className="inline-flex h-12 items-center justify-center rounded-[0.95rem] border border-[#eadfca] bg-white px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
            >
              Copier mon resume
            </button>
            <Link
              href={editHref}
              className="inline-flex h-12 items-center justify-center rounded-[0.95rem] border border-[#eadfca] bg-white px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
            >
              Revenir aux questions
            </Link>
            {nextHref ? (
              <button
                type="button"
                disabled={isCompleting}
                onClick={() => void completeAndNavigate(nextHref)}
                className="inline-flex h-12 items-center justify-center rounded-[0.95rem] bg-[#4b4550] px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-white disabled:cursor-wait disabled:opacity-70"
              >
                {isCompleting ? "Ouverture..." : (nextLabel ?? "Continuer")}
              </button>
            ) : (
              <Link
                href="/brand-guide"
                className="inline-flex h-12 items-center justify-center rounded-[0.95rem] bg-[#4b4550] px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-white"
              >
                Generer mon Guide de Marque
              </Link>
            )}
          </div>

          {statusMessage ? (
            <p className="text-sm font-bold text-[#5f544a]">{statusMessage}</p>
          ) : (
            <div className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4 text-sm leading-6 text-[#7b7068]">
              <p className="font-bold text-[#5f544a]">Pour Instagram Story</p>
              <p className="mt-1">
                Sur mobile, touche &quot;Partager en story Instagram&quot;, choisis Instagram
                dans la feuille de partage, puis publie en story. Si Instagram
                n&apos;apparait pas, telecharge l&apos;image et ajoute-la depuis ta galerie.
              </p>
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-[22rem] lg:sticky lg:top-6">
          <ShareStoryCard
            ref={storyRef}
            data={shareData}
            template={template}
            showBrandName={showBrandName}
          />
        </div>
      </div>
    </section>
  );
}
