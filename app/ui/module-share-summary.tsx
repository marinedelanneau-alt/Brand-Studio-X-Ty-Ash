"use client";

import Link from "next/link";
import SummaryAnswerTable from "@/app/ui/summary-answer-table";
import { useEffect, useState } from "react";
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
  const [isCompleting, setIsCompleting] = useState(false);

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

  return (
    <section
      id="resume-module"
      className="mt-10 overflow-hidden rounded-[2rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdf9_0%,#fff8f0_100%)] shadow-[0_22px_50px_rgba(210,189,152,0.12)]"
    >
      <div className="border-b border-[#efe1cf] px-6 py-8 sm:px-8 sm:py-10">
        <div className="max-w-3xl">
          <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
            Résumé du module
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
            ni mise en page décorative qui nuit à la lecture.
          </p>
        </div>
      </div>

      <div className="px-6 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-4">
          {(summary.submoduleRecaps.length > 0
            ? summary.submoduleRecaps
            : [{
                id: 0,
                position: 1,
                title: summary.title,
                summary: summary.insight,
                highlights: summary.highlights,
              }]
          ).map((submodule) => (
            <article
              key={`${submodule.id}-${submodule.position}`}
              className="overflow-hidden rounded-[1.35rem] border border-[#eadfca] bg-white shadow-[0_12px_30px_rgba(91,73,57,0.05)]"
            >
              <div className="border-b border-[#f0e4d3] bg-[#fffaf2] px-5 py-4">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
                  Sous-module {submodule.position}
                </p>
                <h3 className="mt-1 text-lg font-extrabold leading-6 text-[#4b4550]">
                  {submodule.title}
                </h3>
              </div>
              <div className="space-y-4 px-5 py-5">
                <p className="text-[0.98rem] leading-7 text-[#564c45]">
                  {submodule.summary}
                </p>
                {submodule.highlights.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {submodule.highlights.map((item, index) => (
                      <div
                        key={`${item.label}-${index}`}
                        className={`${item.table ? "sm:col-span-2 " : ""}rounded-[1rem] border border-[#f0e4d3] bg-[#fffdf8] px-4 py-3`}
                      >
                        <p className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-[#7a7087]">
                          {item.label}
                        </p>
                        {item.table ? <SummaryAnswerTable table={item.table} /> : <p className="mt-2 text-sm font-semibold leading-6 text-[#4f463f]">
                          {item.value}
                        </p>}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[1.35rem] border border-[#eadfca] bg-white px-5 py-5">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Lecture rapide
          </p>
          <p className="mt-3 text-sm leading-7 text-[#6f645b]">
            Ce résumé apparaît uniquement à la fin du module. Tu peux t&apos;en servir
            comme recap de travail, puis revenir ensuite sur le module si tu veux
            compléter ou ajuster certaines réponses.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={editHref}
              className="inline-flex h-11 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
            >
              Revenir aux questions
            </Link>
            {nextHref ? (
              <button
                type="button"
                disabled={isCompleting}
                onClick={() => void completeAndNavigate(nextHref)}
                className="inline-flex h-11 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-white disabled:cursor-wait disabled:opacity-70"
              >
                {isCompleting ? "Ouverture..." : (nextLabel ?? "Passer au module suivant")}
              </button>
            ) : null}
            {!nextHref ? (
              <Link
                href="/brand-guide"
                className="inline-flex h-11 items-center justify-center rounded-[0.9rem] border border-[#efd7b8] bg-[#fff6e3] px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#cf7430]"
              >
                Générer mon Guide de Marque
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
