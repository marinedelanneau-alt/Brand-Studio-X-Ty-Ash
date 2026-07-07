"use client";

import { forwardRef } from "react";
import type { ModuleShareData } from "@/lib/get-module-share-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type ShareStoryCardProps = {
  data: ModuleShareData;
  showBrandName: boolean;
};

const ShareStoryCard = forwardRef<HTMLElement, ShareStoryCardProps>(
  function ShareStoryCard({ data, showBrandName }, ref) {
    const title = showBrandName ? data.brandName : "Une marque en construction";
    const keywordLine = data.keywords.slice(0, 3).join(" / ");
    const progress = Math.max(0, Math.min(data.progress, 100));

    return (
      <article
        ref={ref}
        aria-label="Apercu story Brand Studio"
        className="relative flex aspect-[9/16] w-full max-w-[22rem] flex-col overflow-hidden rounded-[1.35rem] border border-[#eadfca] p-6 text-[#332d35] shadow-[0_26px_60px_rgba(89,70,54,0.14)]"
        style={{
          background: `linear-gradient(180deg, ${data.themeColors.surface} 0%, #fff9ef 58%, ${data.themeColors.background} 100%)`,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.32]"
          style={{
            backgroundImage:
              "linear-gradient(#eadfca 1px, transparent 1px), linear-gradient(90deg, #eadfca 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -right-20 top-20 h-44 w-44 rounded-full bg-[#f1cc56]/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -left-16 bottom-24 h-40 w-40 rounded-full bg-[#cf7430]/10 blur-3xl"
        />

        <div className="relative flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/80 bg-white/75 px-3.5 py-2 text-[0.54rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
            Brand Studio
          </span>
          <span className="shrink-0 text-[0.56rem] font-black uppercase tracking-[0.14em] text-[#6f645b]">
            {formatDate(data.completedAt)}
          </span>
        </div>

        <div className="relative mt-12 min-w-0">
          <p className="text-[0.58rem] font-black uppercase leading-4 tracking-[0.18em] text-[#cf7430]">
            {data.moduleTitle} terminé
          </p>
          <h2 className="mt-4 max-w-full whitespace-normal break-words font-[family:var(--font-cormorant)] text-[2.05rem] leading-[0.98] text-[#2f2a33]">
            {title}
          </h2>
          <p className="mt-5 max-w-[15.5rem] text-[0.86rem] font-semibold leading-6 text-[#5f544a]">
            {data.shareSentence}
          </p>
        </div>

        <div className="relative mt-auto space-y-5">
          <div>
            <p className="text-[0.54rem] font-black uppercase tracking-[0.16em] text-[#7a7087]">
              Points abordés
            </p>
            <p className="mt-2 text-[0.78rem] font-black uppercase leading-5 tracking-[0.08em] text-[#332d35]">
              {keywordLine}
            </p>
          </div>

          <div>
            <div className="flex items-end justify-between">
              <p className="text-[0.54rem] font-black uppercase tracking-[0.16em] text-[#7a7087]">
                Progression
              </p>
              <p className="text-[1.85rem] font-black leading-none text-[#332d35]">
                {progress}%
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full bg-[#cf7430]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="border-t border-[#eadfca]/80 pt-4 text-center text-[0.56rem] font-black uppercase leading-5 tracking-[0.16em] text-[#6f645b]">
            Créé avec Brand Studio
          </p>
        </div>
      </article>
    );
  },
);

export default ShareStoryCard;
