"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type {
  GeneratedBrandGuide,
  GuideColor,
  GuideCompletionItem,
  GuideMoodboardItem,
} from "@/lib/brand-guide";
import { saveBrandGuideExport } from "@/app/brand-guide/actions";

type BrandGuideProps = {
  guide: GeneratedBrandGuide;
  latestGeneratedAt: string | null;
};

export default function BrandGuideLayout({
  guide,
  latestGeneratedAt,
}: BrandGuideProps) {
  const [mode, setMode] = useState<"complete" | "express">("complete");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const guideText = useMemo(() => buildCopyText(guide), [guide]);

  function saveSnapshot() {
    startTransition(async () => {
      const result = await saveBrandGuideExport(guide);
      setMessage(result.message);
    });
  }

  async function copyGuide() {
    await navigator.clipboard.writeText(guideText);
    setMessage("Le contenu du guide est copie.");
  }

  function exportPlaceholder() {
    saveSnapshot();
    setMessage("Export PDF prepare. Le snapshot est sauvegarde et l'integration PDF pourra s'appuyer sur cette version figee.");
  }

  return (
    <div className="min-h-screen bg-[#fbf6ed] px-4 py-6 text-[#4b4550] sm:px-6 lg:px-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-[#eadfca] pb-5 print:hidden lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/mon-espace"
              className="inline-flex h-11 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
            >
              Retour au dashboard
            </Link>
            <button
              type="button"
              onClick={() => setMode("complete")}
              className={tabClass(mode === "complete")}
            >
              Guide complet
            </button>
            <button
              type="button"
              onClick={() => setMode("express")}
              className={tabClass(mode === "express")}
            >
              Synthese express
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={copyGuide} className={secondaryButtonClass}>
              Copier le contenu
            </button>
            <button type="button" onClick={exportPlaceholder} className={primaryButtonClass}>
              Exporter mon Guide de Marque
            </button>
          </div>
        </header>

        <CompletionBanner
          items={guide.completion.items}
          warning={guide.completion.warning}
          latestGeneratedAt={latestGeneratedAt}
          isPending={isPending}
          onSave={saveSnapshot}
          message={message}
        />

        {!guide.completion.hasAnyData ? (
          <EmptyGuideState />
        ) : mode === "express" ? (
          <GuideSummary guide={guide} />
        ) : (
          <article id="brand-guide-document" className="space-y-8 print:space-y-6">
            <GuideCover guide={guide} />
            <GuideSection kicker="Introduction" title="Comment utiliser ce guide">
              <p className="max-w-3xl text-lg leading-9 text-[#625850]">
                {guide.introduction}
              </p>
            </GuideSection>
            <GuideSection kicker="01" title="ADN de marque">
              <div className="grid gap-4 md:grid-cols-2">
                <GuideCard label="Activite" value={guide.dna.activity} />
                <GuideCard label="Raison d'etre" value={guide.dna.essence} />
                <GuideCard label="Mission" value={guide.dna.mission} />
                <GuideCard label="Vision" value={guide.dna.vision} />
                <GuideCard label="Promesse" value={guide.dna.promise} />
                <GuideCard label="Valeurs" value={guide.dna.values.join(", ")} />
              </div>
            </GuideSection>
            <GuideSection kicker="02" title="Positionnement">
              <div className="grid gap-4 md:grid-cols-2">
                <GuideCard label="Cible principale" value={guide.positioning.target} />
                <GuideCard label="Contexte client" value={guide.positioning.context} />
                <GuideCard label="Probleme resolu" value={guide.positioning.problem} />
                <GuideCard label="Differenciation" value={guide.positioning.differentiation} />
                <GuideCard label="Concurrents" value={guide.positioning.competitors} />
                <GuideCard label="Positionnement final" value={guide.positioning.finalPositioning} />
              </div>
              <GuideCard label="Phrase de pitch" value={guide.positioning.pitch} wide />
            </GuideSection>
            <GuideSection kicker="03" title="Personnalite de marque">
              <div className="grid gap-4 md:grid-cols-2">
                <GuideCard label="Persona incarne" value={guide.personality.persona} />
                <GuideCard label="Traits dominants" value={guide.personality.traits.join(", ")} />
                <GuideCard label="Posture relationnelle" value={guide.personality.relationship} />
                <GuideCard label="Ton de voix" value={guide.personality.tone} />
                <GuideCard label="Vocabulaire a privilegier" value={guide.personality.wordsToUse.join(", ")} />
                <GuideCard label="Vocabulaire a eviter" value={guide.personality.wordsToAvoid.join(", ")} />
              </div>
            </GuideSection>
            <GuideSection kicker="04" title="Baseline">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <GuideCard label="Baseline finale" value={guide.baselineSection.final} />
                <GuideChecklist title="Usages recommandes" items={guide.baselineSection.recommendedUses} />
              </div>
              {guide.baselineSection.variants.length > 0 ? (
                <GuideCard label="Variantes" value={guide.baselineSection.variants.join(", ")} wide />
              ) : null}
            </GuideSection>
            <GuideSection kicker="05" title="Univers visuel">
              <GuideColorPalette
                primary={guide.visualUniverse.palette.primary}
                secondary={guide.visualUniverse.palette.secondary}
              />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <GuideCard label="Ambiance generale" value={guide.visualUniverse.ambiance} />
                <GuideCard label="Elements graphiques" value={guide.visualUniverse.graphicElements} />
              </div>
              <GuideMoodboard items={guide.visualUniverse.moodboard} />
            </GuideSection>
            <GuideSection kicker="06" title="Regles d'application">
              <div className="grid gap-4 md:grid-cols-2">
                <GuideChecklist title="Reseaux sociaux" items={guide.applicationRules.social} />
                <GuideChecklist title="Site web" items={guide.applicationRules.website} />
                <GuideChecklist title="Presentations" items={guide.applicationRules.presentations} />
                <GuideChecklist title="Documents commerciaux" items={guide.applicationRules.salesDocs} />
              </div>
            </GuideSection>
            <GuideSection kicker="07" title="Checklists">
              <div className="grid gap-4 md:grid-cols-2">
                <GuideChecklist title="Avant publication d'un visuel" items={guide.checklists.visual} />
                <GuideChecklist title="Avant redaction d'un contenu" items={guide.checklists.editorial} />
                <GuideChecklist title="Avant creation d'un support" items={guide.checklists.support} />
                <GuideChecklist title="Avant evolution de la marque" items={guide.checklists.evolution} />
              </div>
            </GuideSection>
            <GuideSummary guide={guide} compact />
          </article>
        )}
      </div>
    </div>
  );
}

function CompletionBanner({
  items,
  warning,
  latestGeneratedAt,
  isPending,
  onSave,
  message,
}: {
  items: GuideCompletionItem[];
  warning: string;
  latestGeneratedAt: string | null;
  isPending: boolean;
  onSave: () => void;
  message: string;
}) {
  return (
    <section className="mb-6 rounded-[1.4rem] border border-[#eadfca] bg-white/90 p-5 shadow-[0_14px_36px_rgba(126,102,78,0.07)] print:hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
            Etat du guide
          </p>
          <p className="mt-2 text-lg font-semibold text-[#4b4550]">{warning}</p>
          <p className="mt-2 text-sm leading-6 text-[#7b7068]">
            {latestGeneratedAt
              ? `Derniere generation sauvegardee : ${formatDate(latestGeneratedAt)}`
              : "Aucun snapshot sauvegarde pour le moment."}
          </p>
        </div>
        <button type="button" onClick={onSave} className={secondaryButtonClass} disabled={isPending}>
          {isPending ? "Generation..." : "Generer mon Guide de Marque"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.moduleHref ?? "/brand-guide"}
            className={`rounded-full border px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] ${
              item.status === "ok"
                ? "border-[#d6e8d8] bg-[#eef6eb] text-[#5f8d63]"
                : item.status === "optional"
                  ? "border-[#eadfca] bg-[#fff8f1] text-[#7b7068]"
                  : "border-[#efd7b8] bg-[#fff6e3] text-[#cf7430]"
            }`}
          >
            {item.label} : {item.status === "ok" ? "OK" : item.status === "optional" ? "optionnel" : "a completer"}
          </Link>
        ))}
      </div>
      {message ? <p className="mt-3 text-sm font-semibold text-[#5f8d63]">{message}</p> : null}
    </section>
  );
}

export function GuideCover({ guide }: { guide: GeneratedBrandGuide }) {
  const colors = [...guide.visualUniverse.palette.primary, ...guide.visualUniverse.palette.secondary].slice(0, 5);

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-[#eadfca] bg-[#fffdf9] shadow-[0_24px_60px_rgba(126,102,78,0.09)] print:rounded-none print:shadow-none">
      <div className="grid min-h-[32rem] gap-8 p-8 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:p-14">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-[0.78rem] font-black uppercase tracking-[0.24em] text-[#cf7430]">
              Brand Studio
            </p>
            <h1 className="mt-7 font-[family:var(--font-cormorant)] text-[3rem] leading-[0.92] text-[#332d35] sm:text-[4.5rem]">
              {guide.cover.title}
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-[#6f645b]">
              {guide.cover.subtitle}
            </p>
          </div>
          <div className="mt-10">
            <p className="text-base italic leading-8 text-[#5f544a]">{guide.cover.introLine}</p>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-[#7a7087]">
              Genere le {formatDate(guide.generatedAt)}
            </p>
          </div>
        </div>
        <div className="grid min-h-[22rem] grid-cols-2 gap-3">
          {colors.length > 0 ? (
            colors.map((color) => (
              <div
                key={color.id}
                className="rounded-[1rem] border border-white/70 p-4 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
                style={{ background: color.css }}
              >
                <p className="text-sm font-black drop-shadow">{color.name}</p>
                <p className="mt-1 text-xs font-semibold drop-shadow">{color.hex}</p>
              </div>
            ))
          ) : (
            <div className="col-span-2 flex items-center justify-center rounded-[1rem] border border-dashed border-[#eadfca] bg-[#fff8f1] p-6 text-center text-sm font-semibold text-[#7b7068]">
              Apercu palette a completer dans le module Palette de couleurs.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function GuideSection({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.4rem] border border-[#eadfca] bg-[#fffdf9] p-6 shadow-[0_18px_46px_rgba(210,189,152,0.08)] sm:p-8 print:break-inside-avoid print:shadow-none">
      <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
        {kicker}
      </p>
      <h2 className="mt-3 font-[family:var(--font-cormorant)] text-[2.5rem] leading-[0.98] text-[#3f3945]">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function GuideCard({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <article className={`${wide ? "mt-4" : ""} rounded-[0.75rem] border border-[#eadfca] bg-white px-5 py-5`}>
      <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
        {label}
      </p>
      <p className="mt-3 whitespace-pre-line text-[0.98rem] leading-7 text-[#5f544a]">
        {value}
      </p>
    </article>
  );
}

export function GuideColorPalette({
  primary,
  secondary,
}: {
  primary: GuideColor[];
  secondary: GuideColor[];
}) {
  const colors = [...primary, ...secondary];

  if (colors.length === 0) {
    return <GuideCard label="Palette" value="Palette ou intention visuelle a completer dans le module Palette de couleurs." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {colors.map((color) => (
        <article key={color.id} className="overflow-hidden rounded-[0.75rem] border border-[#eadfca] bg-white">
          <div className="h-24" style={{ background: color.css }} />
          <div className="p-4">
            <p className="text-sm font-black text-[#4b4550]">{color.name}</p>
            <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[#cf7430]">
              {color.hex}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6f645b]">{color.usage}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function GuideMoodboard({ items }: { items: GuideMoodboardItem[] }) {
  if (items.length === 0) {
    return <GuideCard label="Moodboard" value="Moodboard a completer pour enrichir l'univers visuel." wide />;
  }

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article key={item.id} className="min-h-40 overflow-hidden rounded-[0.75rem] border border-[#eadfca] bg-white">
          {item.type === "image" && item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.label} className="h-36 w-full object-cover" />
          ) : (
            <div
              className="flex h-36 items-center justify-center p-4 text-center text-sm font-black uppercase tracking-[0.14em] text-[#4b4550]"
              style={{ background: item.color ?? "#fff8f1" }}
            >
              {item.label}
            </div>
          )}
          <div className="p-4">
            <p className="text-sm font-black text-[#4b4550]">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-[#7b7068]">{item.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function GuideChecklist({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-[0.75rem] border border-[#eadfca] bg-white px-5 py-5">
      <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
        {title}
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-[#5f544a]">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#cf7430]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function GuideSummary({
  guide,
  compact = false,
}: {
  guide: GeneratedBrandGuide;
  compact?: boolean;
}) {
  return (
    <section className={`${compact ? "" : "min-h-[70vh]"} rounded-[1.4rem] border border-[#eadfca] bg-white p-6 shadow-[0_18px_46px_rgba(210,189,152,0.08)] sm:p-8 print:shadow-none`}>
      <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
        Synthese express
      </p>
      <h2 className="mt-3 font-[family:var(--font-cormorant)] text-[2.7rem] leading-[0.98] text-[#3f3945]">
        {guide.brandName} en une page
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <GuideCard label="Mission en 1 phrase" value={guide.expressSummary.mission} />
        <GuideCard label="Positionnement en 1 phrase" value={guide.expressSummary.positioning} />
        <GuideCard label="Ton en 3 mots" value={guide.expressSummary.tone.join(", ")} />
        <GuideCard label="Palette principale" value={guide.expressSummary.palette.join(", ")} />
        <GuideCard label="Promesse" value={guide.expressSummary.promise} />
        <GuideCard label="Baseline" value={guide.expressSummary.baseline} />
      </div>
    </section>
  );
}

export function EmptyGuideState() {
  return (
    <section className="rounded-[1.4rem] border border-[#eadfca] bg-white p-8 text-center shadow-[0_18px_46px_rgba(210,189,152,0.08)]">
      <p className="font-[family:var(--font-cormorant)] text-[2.5rem] leading-tight text-[#3f3945]">
        Ton guide attend encore ses premieres matieres.
      </p>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#6f645b]">
        Complete au moins une reponse dans les modules Brand Studio pour generer un guide personnalise.
      </p>
      <Link href="/mon-espace" className={`${primaryButtonClass} mt-6`}>
        Modifier mes reponses
      </Link>
    </section>
  );
}

function buildCopyText(guide: GeneratedBrandGuide) {
  return [
    guide.cover.title,
    guide.baseline,
    "",
    "Introduction",
    guide.introduction,
    "",
    "ADN de marque",
    `Activite: ${guide.dna.activity}`,
    `Mission: ${guide.dna.mission}`,
    `Vision: ${guide.dna.vision}`,
    `Valeurs: ${guide.dna.values.join(", ")}`,
    `Promesse: ${guide.dna.promise}`,
    "",
    "Positionnement",
    guide.positioning.finalPositioning,
    guide.positioning.pitch,
    "",
    "Personnalite",
    `Ton: ${guide.personality.tone}`,
    `Traits: ${guide.personality.traits.join(", ")}`,
  ].join("\n");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function tabClass(active: boolean) {
  return `inline-flex h-11 items-center justify-center rounded-[0.9rem] border px-5 text-xs font-extrabold uppercase tracking-[0.12em] ${
    active
      ? "border-[#cf7430] bg-[#fff6e3] text-[#cf7430]"
      : "border-[#eadfca] bg-white text-[#6b625a]"
  }`;
}

const primaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_12px_26px_rgba(223,155,57,0.18)]";

const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a] disabled:opacity-60";
