"use client";

import Image from "next/image";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { WorkspaceModule } from "@/lib/training-types";
import { isAnswerableExerciseType } from "@/lib/exercise-types";
import VoiceNotePlayer from "./voice-note-player";
import ScentInspirationSection from "./scent-inspiration-section";
import TypographyInspirationSection from "./typography-inspiration-section";
import BaselineInspirationSection from "./baseline-inspiration-section";
import ColorLibrarySection from "./color-library-section";

const COLOR_SYMBOLISM_RESOURCE = {
  href: "/symbolique-couleurs-communication.png",
  title: "La symbolique des couleurs en communication",
  fileName: "symbolique-couleurs-communication.jpg",
};

function normalizeForSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function shouldShowColorSymbolismResource(
  submodule: WorkspaceModule["submodules"][number],
) {
  const haystack = normalizeForSearch(
    `${submodule.title} ${submodule.content_html}`,
  );

  return haystack.includes("palette") && haystack.includes("couleur");
}

function splitScentContent(submodule: WorkspaceModule["submodules"][number]) {
  const normalizedTitle = normalizeForSearch(submodule.title);
  if (!normalizedTitle.includes("marque") || !normalizedTitle.includes("odeur")) return null;

  const paragraphs = Array.from(submodule.content_html.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi));
  const target = paragraphs.find((match) => {
    const text = normalizeForSearch(match[0].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " "));
    return text.includes("objectif") && text.includes("parfum") && text.includes("communication");
  });

  if (!target || target.index === undefined) return { before: submodule.content_html, after: "" };
  const splitAt = target.index + target[0].length;
  return { before: submodule.content_html.slice(0, splitAt), after: submodule.content_html.slice(splitAt) };
}

function isTypographySubmodule(submodule: WorkspaceModule["submodules"][number]) {
  return normalizeForSearch(submodule.title).includes("typograph");
}

function isBaselineSubmodule(submodule: WorkspaceModule["submodules"][number]) {
  return normalizeForSearch(submodule.title).includes("baseline");
}

function isColorPaletteSubmodule(submodule: WorkspaceModule["submodules"][number]) {
  const title = normalizeForSearch(submodule.title);
  return title.includes("palette") && title.includes("couleur");
}

function ColorSymbolismResource() {
  async function downloadAsJpeg() {
    const image = document.createElement("img");
    image.decoding = "async";

    const loadedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Le visuel n'a pas pu etre prepare."));
      image.src = COLOR_SYMBOLISM_RESOURCE.href;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1536;
    canvas.height = 1024;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.94);
    });

    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = COLOR_SYMBOLISM_RESOURCE.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <figure className="mt-8 overflow-hidden rounded-[1.25rem] border border-[#eadfca] bg-[#fffdf8] p-3">
      <div className="group relative">
        <Image
          src={COLOR_SYMBOLISM_RESOURCE.href}
          alt={COLOR_SYMBOLISM_RESOURCE.title}
          width={1536}
          height={1024}
          className="w-full rounded-[0.9rem] border border-[#f0e4d3] bg-white"
        />
        <button
          type="button"
          onClick={() => void downloadAsJpeg()}
          aria-label="Telecharger le visuel au format JPEG"
          title="Telecharger le visuel au format JPEG"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca] bg-white/95 text-[#b5661f] opacity-0 shadow-[0_10px_24px_rgba(91,73,57,0.14)] transition hover:bg-[#fff8f1] focus:opacity-100 group-hover:opacity-100"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
        </button>
      </div>
      <figcaption className="px-1 py-4">
        <p className="text-sm font-semibold leading-6 text-[#5f544a]">
          {COLOR_SYMBOLISM_RESOURCE.title}
        </p>
      </figcaption>
    </figure>
  );
}

export default function ModuleSubmoduleViewer({
  submodules,
  currentIndex,
  onPrevious,
  onNext,
  onStartExercises,
}: {
  submodules: WorkspaceModule["submodules"];
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onStartExercises?: () => void;
}) {
  const currentSubmodule = submodules[currentIndex];
  const answerableExerciseCount = currentSubmodule
    ? currentSubmodule.exercises.filter((exercise) =>
        isAnswerableExerciseType(exercise.type),
      ).length
    : 0;
  const showColorSymbolismResource = currentSubmodule
    ? shouldShowColorSymbolismResource(currentSubmodule)
    : false;
  const scentContent = currentSubmodule ? splitScentContent(currentSubmodule) : null;
  const showTypographyInspiration = currentSubmodule
    ? isTypographySubmodule(currentSubmodule)
    : false;
  const showBaselineInspiration = currentSubmodule
    ? isBaselineSubmodule(currentSubmodule)
    : false;
  const showColorLibrary = currentSubmodule
    ? isColorPaletteSubmodule(currentSubmodule)
    : false;

  if (!currentSubmodule) {
    return (
      <div className="rounded-[1.4rem] border border-dashed border-[#eadfca] bg-white px-5 py-6 text-sm leading-7 text-[#8a8077]">
        Aucun sous-module n&apos;est encore disponible.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[#fdfbf6]/95 p-6 shadow-[0_16px_38px_rgba(21,33,59,0.055)] ring-1 ring-[#e5ded3]/80 backdrop-blur-[2px] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_right,rgba(236,104,28,0.045),transparent_46%)]"
        />
        <div className="relative space-y-6">
          <div className="border-b border-[#f0e4d3] pb-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[0.76rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Sous-module {currentIndex + 1} sur {submodules.length}
              </p>
              <p className="text-sm text-[#8a8077]">
                {answerableExerciseCount} exercice
                {answerableExerciseCount > 1 ? "s" : ""}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1ece5]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#d88a2f,#f0cf55)] transition-[width]"
                style={{
                  width: `${Math.max(((currentIndex + 1) / submodules.length) * 100, 8)}%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.76rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Sous-module {currentSubmodule.position}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-[#4b4550] sm:text-[2rem] sm:leading-[1.02]">
                {currentSubmodule.title}
              </h2>
            </div>
            <p className="rounded-full bg-[#fff6e3] px-4 py-2 text-[0.74rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
              {answerableExerciseCount} exercice
              {answerableExerciseCount > 1 ? "s" : ""}
            </p>
          </div>

          {currentSubmodule.video_url ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-[#f0e4d3] bg-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <div className="aspect-video overflow-hidden rounded-[1rem] bg-[#f4efe9]">
                <iframe
                  src={currentSubmodule.video_url}
                  title={currentSubmodule.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}

          <VoiceNotePlayer
            src={currentSubmodule.audio_url}
            title="Introduction audio"
            subtitles={currentSubmodule.audio_transcript}
          />

          <div className="rounded-[1.5rem] border border-[#f0e4d3] bg-white px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] sm:px-7">
            {showColorLibrary ? (
              <ColorLibrarySection recap={<ColorSymbolismResource />} />
            ) : showBaselineInspiration ? (
              <BaselineInspirationSection />
            ) : showTypographyInspiration ? (
              <TypographyInspirationSection />
            ) : (
              <>
                <div className="module-content max-w-none text-[#5f544a]" dangerouslySetInnerHTML={{ __html: scentContent?.before ?? currentSubmodule.content_html }} />
                {scentContent ? <ScentInspirationSection /> : null}
                {scentContent?.after ? <div className="module-content max-w-none text-[#5f544a]" dangerouslySetInnerHTML={{ __html: scentContent.after }} /> : null}
              </>
            )}
            {showColorSymbolismResource && !showColorLibrary ? <ColorSymbolismResource /> : null}
          </div>
        </div>
      </section>

      {onStartExercises ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onStartExercises}
            className="bs-button-primary flex h-12 items-center justify-center rounded-[0.95rem] px-6 text-sm font-extrabold uppercase tracking-[0.12em]"
          >
            Commencer les exercices
          </button>
        </div>
      ) : null}

      {submodules.length > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="flex h-12 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sous-module précédent
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={currentIndex === submodules.length - 1}
            className="bs-button-primary flex h-12 items-center justify-center rounded-[0.9rem] px-5 text-sm font-extrabold uppercase tracking-[0.12em]"
          >
            Sous-module suivant
          </button>
        </div>
      ) : null}
    </div>
  );
}
