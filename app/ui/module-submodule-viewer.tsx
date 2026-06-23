"use client";

import type { WorkspaceModule } from "@/lib/training-types";
import { isAnswerableExerciseType } from "@/lib/exercise-types";
import VoiceNotePlayer from "./voice-note-player";

export default function ModuleSubmoduleViewer({
  submodules,
  currentIndex,
  onPrevious,
  onNext,
}: {
  submodules: WorkspaceModule["submodules"];
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const currentSubmodule = submodules[currentIndex];
  const answerableExerciseCount = currentSubmodule
    ? currentSubmodule.exercises.filter((exercise) =>
        isAnswerableExerciseType(exercise.type),
      ).length
    : 0;

  if (!currentSubmodule) {
    return (
      <div className="rounded-[1.4rem] border border-dashed border-[#eadfca] bg-white px-5 py-6 text-sm leading-7 text-[#8a8077]">
        Aucun sous-module n&apos;est encore disponible.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 p-6 shadow-[0_16px_38px_rgba(126,102,78,0.08),0_2px_10px_rgba(207,116,48,0.06)] ring-1 ring-[#f3e5d2]/80 backdrop-blur-[2px] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,rgba(243,198,35,0.12),transparent_52%),radial-gradient(circle_at_top_right,rgba(207,116,48,0.08),transparent_44%)]"
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
            subtitles={currentSubmodule.content_html}
          />

          <div className="rounded-[1.5rem] border border-[#f0e4d3] bg-white px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] sm:px-7">
            <div
              className="module-content max-w-none text-[#5f544a]"
              dangerouslySetInnerHTML={{ __html: currentSubmodule.content_html }}
            />
          </div>
        </div>
      </section>

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
            className="flex h-12 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sous-module suivant
          </button>
        </div>
      ) : null}
    </div>
  );
}
