"use client";

import { forwardRef } from "react";
import type { ModuleShareData, StoryTemplate } from "@/lib/get-module-share-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type ShareStoryCardProps = {
  data: ModuleShareData;
  template: StoryTemplate;
  showBrandName: boolean;
};

const ShareStoryCard = forwardRef<HTMLElement, ShareStoryCardProps>(function ShareStoryCard(
  {
    data,
    template,
    showBrandName,
  },
  ref,
) {
  const title = showBrandName ? data.brandName : "Une marque en construction";
  const keywordLine = data.keywords.slice(0, 3).join(" · ");
  const isColor = template === "color";
  const isMoodboard = template === "moodboard";

  return (
    <article
      ref={ref}
      aria-label="Apercu story Brand Studio"
      className="relative flex aspect-[9/16] w-full max-w-[22rem] flex-col overflow-hidden rounded-[1.25rem] border border-[#eadfca] p-7 text-[#332d35] shadow-[0_26px_60px_rgba(89,70,54,0.14)]"
      style={{
        background: isColor
          ? `linear-gradient(145deg, ${data.themeColors.accent} 0%, ${data.themeColors.accentSoft} 48%, #fff7ea 100%)`
          : isMoodboard
            ? "linear-gradient(160deg,#fff8ef 0%,#f4e6d7 54%,#e7d8c4 100%)"
            : `linear-gradient(180deg, ${data.themeColors.surface} 0%, ${data.themeColors.background} 100%)`,
      }}
    >
      {isMoodboard ? (
        <div aria-hidden="true" className="absolute inset-0 opacity-35">
          <div className="absolute left-[-18%] top-[9%] h-48 w-48 rotate-[-12deg] bg-[#d8a56d]" />
          <div className="absolute right-[-10%] top-[22%] h-56 w-40 rotate-[11deg] bg-[#f5d9a6]" />
          <div className="absolute bottom-[16%] left-[8%] h-40 w-52 rotate-[7deg] bg-[#7a7087]" />
        </div>
      ) : null}

      <div className="relative flex items-center justify-between">
        <span className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
          Brand Studio
        </span>
        <span className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-[#6f645b]">
          {formatDate(data.completedAt)}
        </span>
      </div>

      <div className="relative mt-16">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
          {data.moduleTitle} termine
        </p>
        <h2 className="mt-5 font-[family:var(--font-cormorant)] text-[3.15rem] leading-[0.88] text-[#332d35]">
          {title}
        </h2>
        <p className="mt-7 max-w-[17rem] text-[1.28rem] leading-8 text-[#5f544a]">
          {data.shareSentence}
        </p>
      </div>

      <div className="relative mt-auto space-y-7">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Points abordes
          </p>
          <p className="mt-3 text-[1.05rem] font-black text-[#332d35]">
            {keywordLine}
          </p>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
              Progression
            </p>
            <p className="text-4xl font-black text-[#332d35]">{data.progress}%</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-[#cf7430]"
              style={{ width: `${Math.max(0, Math.min(data.progress, 100))}%` }}
            />
          </div>
        </div>

        <p className="border-t border-[#eadfca]/80 pt-5 text-center text-[0.74rem] font-black uppercase tracking-[0.16em] text-[#6f645b]">
          Je construis ma marque avec Brand Studio
        </p>
      </div>
    </article>
  );
});

export default ShareStoryCard;
