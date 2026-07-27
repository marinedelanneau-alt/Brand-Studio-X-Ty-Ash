"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import audioHostVisual from "@/public/visuel-note-vocale.png";

type VoiceNotePlayerProps = {
  src?: string | null;
  eyebrow?: string;
  title?: string;
  subtitles?: string | null;
};

const htmlEntityMap: Record<string, string> = {
  agrave: "\u00e0",
  amp: "&",
  apos: "'",
  ccedil: "\u00e7",
  eacute: "\u00e9",
  egrave: "\u00e8",
  ecirc: "\u00ea",
  hellip: "...",
  icirc: "\u00ee",
  laquo: "\u00ab",
  nbsp: " ",
  ndash: "-",
  ocirc: "\u00f4",
  quot: '"',
  raquo: "\u00bb",
  rsquo: "'",
  ugrave: "\u00f9",
};

function normalizeSubtitles(value?: string | null) {
  if (!value?.trim()) {
    return "";
  }

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&([a-z]+);/gi, (match, entity: string) => htmlEntityMap[entity] ?? match)
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_match, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export default function VoiceNotePlayer({
  src,
  eyebrow = "Note vocale",
  title = "Ecouter l'audio",
  subtitles,
}: VoiceNotePlayerProps) {
  const [showSubtitles, setShowSubtitles] = useState(false);
  const normalizedSubtitles = useMemo(() => normalizeSubtitles(subtitles), [subtitles]);

  if (!src?.trim()) {
    return null;
  }

  const hasSubtitles = normalizedSubtitles.length > 0;

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-[#eadfca] bg-[#fffdf7] shadow-[0_14px_34px_rgba(126,102,78,0.08)]">
      {hasSubtitles ? (
        <button
          type="button"
          onClick={() => setShowSubtitles((current) => !current)}
          className="absolute right-4 top-4 z-10 rounded-full border border-[#eadfca] bg-white/92 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.14em] text-[#6b625a] shadow-[0_8px_20px_rgba(126,102,78,0.1)] transition hover:border-[#d88a2f] hover:text-[#cf7430] focus:outline-none focus:ring-4 focus:ring-[#f0cf55]/25"
          aria-expanded={showSubtitles}
        >
          {showSubtitles ? "Masquer" : "Sous-titres"}
        </button>
      ) : null}
      <div className="grid md:grid-cols-[minmax(15rem,22rem)_1fr]">
        <div className="relative min-h-[20rem] bg-[#f4efe9] md:min-h-[24rem]">
          <Image
            src={audioHostVisual}
            alt="Portrait Brand Studio"
            fill
            sizes="(max-width: 768px) 100vw, 22rem"
            className="object-contain object-bottom p-4"
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-5 bg-[linear-gradient(180deg,#fffdf7,#fff8f1)] px-5 py-16 sm:px-7 md:py-6 md:pr-8">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
            {eyebrow}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-[family:var(--font-cormorant)] text-[2rem] leading-none text-[#4b4550]">
              {title}
            </h3>
            <div
              aria-hidden="true"
              className="flex h-8 items-center gap-1 text-[#2f2c2b]"
            >
              {[12, 22, 14, 28, 18, 34, 15, 26, 12].map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="w-0.5 rounded-full bg-current"
                  style={{ height }}
                />
              ))}
            </div>
          </div>
          <audio controls preload="metadata" className="w-full">
            <source src={src} type="audio/mpeg" />
            Ton navigateur ne peut pas lire cette note vocale.
          </audio>
          {showSubtitles && hasSubtitles ? (
            <div className="max-h-44 overflow-y-auto rounded-[1rem] border border-[#eadfca] bg-white/84 px-4 py-3 text-sm leading-7 text-[#5f544a] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <p className="whitespace-pre-line">{normalizedSubtitles}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
