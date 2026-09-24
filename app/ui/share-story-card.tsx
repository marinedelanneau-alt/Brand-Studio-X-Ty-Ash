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
    const keywordLine = data.keywords.slice(0, 4).join(" / ");
    const titleClassName =
      title.length > 42
        ? "text-[1.05rem] leading-[1.08]"
        : title.length > 30
          ? "text-[1.2rem] leading-[1.07]"
          : title.length > 18
            ? "text-[1.42rem] leading-[1.05]"
            : "text-[1.9rem] leading-[1]";
    const keywordClassName =
      keywordLine.length > 34
        ? "text-[0.62rem] leading-4 tracking-[0.04em]"
        : keywordLine.length > 24
          ? "text-[0.7rem] leading-[1.15rem] tracking-[0.06em]"
          : "text-[0.78rem] leading-5 tracking-[0.08em]";

    return (
      <article
        ref={ref}
        aria-label="Apercu story Brand Studio"
        className="bs-export-surface relative flex aspect-[9/16] w-full max-w-[22rem] flex-col overflow-hidden rounded-[1.35rem] border border-[var(--border)] p-6 text-[var(--heading-color)] shadow-[0_26px_60px_rgba(89,70,54,0.14)]"
        style={{
          background: `linear-gradient(180deg, ${data.themeColors.surface} 0%, var(--tyash-subtle) 58%, ${data.themeColors.background} 100%)`,
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
          className="absolute -right-20 top-20 h-44 w-44 rounded-full bg-[var(--tyash-medium)]/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -left-16 bottom-24 h-40 w-40 rounded-full bg-[var(--tyash-primary)]/10 blur-3xl"
        />

        <div className="relative flex items-center justify-between gap-3">
          <span className="rounded-full border border-[var(--surface-highlight)]/80 bg-[var(--card)]/75 px-3.5 py-2 text-[0.54rem] font-black uppercase tracking-[0.18em] text-[var(--tyash-label-text)]">
            Brand Studio
          </span>
          <span className="shrink-0 text-[0.56rem] font-black uppercase tracking-[0.14em] text-[var(--text-primary)]">
            {formatDate(data.completedAt)}
          </span>
        </div>

        <div className="relative mt-12 min-w-0">
          <p className="text-[0.58rem] font-black uppercase leading-4 tracking-[0.18em] text-[var(--tyash-label-text)]">
            {data.moduleTitle} terminé
          </p>
          <h2
            className={`mt-4 max-w-full whitespace-normal break-words font-[family:var(--font-cormorant)] text-[var(--heading-color)] [overflow-wrap:break-word] ${titleClassName}`}
          >
            {title}
          </h2>
          <p className="mt-5 max-w-[15.5rem] text-[0.86rem] font-semibold leading-6 text-[var(--text-primary)]">
            {data.shareSentence}
          </p>
        </div>

        <div className="relative mt-auto space-y-5">
          <div>
            <p className="text-[0.54rem] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Points abordés
            </p>
            <p className={`mt-2 max-w-full whitespace-normal break-normal font-black uppercase text-[var(--heading-color)] [overflow-wrap:normal] ${keywordClassName}`}>
              {keywordLine}
            </p>
          </div>

          <p className="border-t border-[var(--border)]/80 pt-4 text-center text-[0.56rem] font-black uppercase leading-5 tracking-[0.16em] text-[var(--text-primary)]">
            Créé avec Brand Studio
          </p>
        </div>
      </article>
    );
  },
);

export default ShareStoryCard;
