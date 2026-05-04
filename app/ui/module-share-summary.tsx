"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ModuleSummaryCard } from "@/lib/module-summary";

export default function ModuleShareSummary({
  summary,
  editHref,
  completionHref,
  nextHref,
  nextLabel,
}: {
  summary: ModuleSummaryCard;
  editHref: string;
  completionHref: string;
  nextHref?: string;
  nextLabel?: string;
}) {
  useEffect(() => {
    void fetch(completionHref, {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => undefined);
  }, [completionHref]);

  return (
    <section
      id="resume-module"
      className="mt-10 overflow-hidden rounded-[2rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdf9_0%,#fff8f0_100%)] shadow-[0_22px_50px_rgba(210,189,152,0.12)]"
    >
      <div className="border-b border-[#efe1cf] px-6 py-8 sm:px-8 sm:py-10">
        <div className="max-w-3xl">
          <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
            Resume du module
          </p>
          <h2 className="mt-4 font-[family:var(--font-cormorant)] text-[2.3rem] leading-[0.95] text-[#4b4550] sm:text-[2.9rem]">
            {summary.title}
          </h2>
          <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-[#7a7087]">
            {summary.subtitle}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#6f645b]">
            Voici la synthese des elements rediges dans ce module. L&apos;objectif est
            de te permettre de relire rapidement l&apos;essentiel, sans effet de card
            ni mise en page decorative qui nuit a la lecture.
          </p>
        </div>
      </div>

      <div className="px-6 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-4 lg:grid-cols-2">
          {summary.quickRecap.map((item, index) => (
            <article
              key={`${item.label}-${index}`}
              className="rounded-[1.35rem] border border-[#eadfca] bg-white px-5 py-5 shadow-[0_12px_30px_rgba(91,73,57,0.05)]"
            >
              <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
                {item.label}
              </p>
              <p className="mt-3 whitespace-pre-line text-[0.98rem] leading-7 text-[#564c45]">
                {formatSummaryValue(item.value)}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[1.35rem] border border-[#eadfca] bg-white px-5 py-5">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Lecture rapide
          </p>
          <p className="mt-3 text-sm leading-7 text-[#6f645b]">
            Ce resume apparait uniquement a la fin du module. Tu peux t&apos;en servir
            comme recap de travail, puis revenir ensuite sur le module si tu veux
            completer ou ajuster certaines reponses.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={editHref}
              className="inline-flex h-11 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
            >
              Revenir aux questions
            </Link>
            {nextHref ? (
              <Link
                href={nextHref}
                className="inline-flex h-11 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-white"
              >
                {nextLabel ?? "Passer au module suivant"}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatSummaryValue(value: string) {
  return value.replaceAll(" | ", "\n");
}
