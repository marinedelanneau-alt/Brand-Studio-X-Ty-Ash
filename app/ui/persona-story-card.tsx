"use client";

import { forwardRef } from "react";

export type PersonaStorySummary = {
  firstName: string;
  profile: string;
  traits: string;
  tone: string;
  values: string;
  interactions: string;
  quote: string;
};

const PersonaStoryCard = forwardRef<HTMLElement, { summary: PersonaStorySummary }>(
  function PersonaStoryCard({ summary }, ref) {
    const items = [
      ["Profil", summary.profile],
      ["Personnalité", [summary.traits, summary.tone].filter(Boolean).join(" • ")],
      ["Valeurs fortes", summary.values],
    ].filter(([, value]) => value.trim());

    return (
      <article
        ref={ref}
        aria-label="Fiche persona au format story"
        className="relative flex aspect-[9/16] w-full max-w-[22rem] flex-col overflow-hidden rounded-[1.5rem] border border-[#eadfca] bg-[linear-gradient(160deg,#fffdf9_0%,#fff3df_58%,#f4d782_100%)] p-4 text-[#403845] shadow-[0_24px_60px_rgba(89,70,54,0.16)] sm:p-5"
      >
        <div aria-hidden="true" className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(#eadfca 1px,transparent 1px),linear-gradient(90deg,#eadfca 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
        <div aria-hidden="true" className="absolute -right-16 top-20 size-44 rounded-full bg-[#f0cf55]/35 blur-3xl" />
        <header className="relative flex items-center justify-between">
          <span className="rounded-full bg-white/80 px-3 py-2 text-[0.55rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">Brand Studio</span>
          <span className="text-[0.56rem] font-black uppercase tracking-[0.16em] text-[#756a70]">Persona de marque</span>
        </header>
        <div className="relative mt-4">
          <p className="text-[0.52rem] font-black uppercase leading-3 tracking-[0.18em] text-[#cf7430]">Voici la personnalité de ma marque</p>
          <h2 className="mt-2 break-words font-[family:var(--font-cormorant)] text-[1.75rem] leading-none">{summary.firstName || "Mon persona"}</h2>
        </div>
        <div className="relative mt-4 grid gap-2">
          {items.slice(0, 3).map(([label, value]) => (
            <section key={label} className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5">
              <p className="text-[0.46rem] font-black uppercase tracking-[0.15em] text-[#8a7080]">{label}</p>
              <p className="mt-1 line-clamp-3 text-[0.61rem] font-semibold leading-[0.9rem] text-[#514750]">{value}</p>
            </section>
          ))}
        </div>
        {summary.quote ? <blockquote className="relative mt-3 shrink-0 border-l-2 border-[#cf7430] pl-2.5 text-[0.62rem] font-semibold italic leading-[0.9rem]">« {summary.quote} »</blockquote> : null}
        <footer className="relative mt-auto shrink-0 border-t border-[#cfae75]/50 pt-2.5 text-center text-[0.48rem] font-black uppercase tracking-[0.15em] text-[#6f645b]">Créé avec Brand Studio</footer>
      </article>
    );
  },
);

export default PersonaStoryCard;
