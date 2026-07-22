"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { CSSProperties } from "react";
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
  const theme = useMemo(() => getGuideTheme(guide), [guide]);
  const themeStyle = {
    "--guide-bg": theme.background,
    "--guide-surface": theme.surface,
    "--guide-card": theme.card,
    "--guide-border": theme.border,
    "--guide-accent": theme.accent,
    "--guide-accent-soft": theme.accentSoft,
    "--guide-text": theme.text,
  } as CSSProperties;

  function saveSnapshot() {
    startTransition(async () => {
      const result = await saveBrandGuideExport(guide);
      setMessage(result.message);
    });
  }

  async function copyGuide() {
    await navigator.clipboard.writeText(guideText);
    setMessage("Le contenu du guide est copié.");
  }

  return (
    <div
      className="min-h-screen bg-[var(--guide-bg)] px-4 py-6 text-[var(--guide-text)] sm:px-6 lg:px-8 print:bg-white print:px-0 print:py-0"
      style={themeStyle}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-[var(--guide-border)] pb-5 print:hidden lg:flex-row lg:items-center lg:justify-between">
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
              Synthèse express
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={copyGuide} className={secondaryButtonClass}>
              Copier le contenu
            </button>
            <Link href="/brand-guide/download" className={primaryButtonClass}>
              Exporter mon Guide de Marque
            </Link>
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
                <GuideCard label="Raison d'être" value={guide.dna.essence} />
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
                <GuideCard label="Vocabulaire à privilégier" value={guide.personality.wordsToUse.join(", ")} />
                <GuideCard label="Vocabulaire à éviter" value={guide.personality.wordsToAvoid.join(", ")} />
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
                <GuideChecklist title="Avant rédaction d'un contenu" items={guide.checklists.editorial} />
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
    <section className="mb-6 rounded-[1.4rem] border border-[var(--guide-border)] bg-[var(--guide-surface)] p-5 shadow-[0_14px_36px_rgba(126,102,78,0.07)] print:hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[var(--guide-accent)]">
            Etat du guide
          </p>
          <p className="mt-2 text-lg font-semibold text-[#4b4550]">{warning}</p>
          <p className="mt-2 text-sm leading-6 text-[#7b7068]">
            {latestGeneratedAt
              ? `Dernière génération sauvegardée : ${formatDate(latestGeneratedAt)}`
              : "Aucun snapshot sauvegarde pour le moment."}
          </p>
        </div>
        <button type="button" onClick={onSave} className={secondaryButtonClass} disabled={isPending}>
          {isPending ? "Génération..." : "Générer mon Guide de Marque"}
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
            {item.label} : {item.status === "ok" ? "OK" : item.status === "optional" ? "optionnel" : "à compléter"}
          </Link>
        ))}
      </div>
      {message ? <p className="mt-3 text-sm font-semibold text-[#5f8d63]">{message}</p> : null}
    </section>
  );
}

export function GuideCover({ guide }: { guide: GeneratedBrandGuide }) {
  const colors = [...guide.visualUniverse.palette.primary, ...guide.visualUniverse.palette.secondary].slice(0, 5);
  const moodboardItems = guide.visualUniverse.moodboard.filter((item) => item.type === "image").slice(0, 2);

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-[var(--guide-border)] bg-[var(--guide-surface)] shadow-[0_24px_60px_rgba(126,102,78,0.09)] print:rounded-none print:shadow-none">
      <div className="grid min-h-[32rem] gap-8 p-8 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:p-14">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-[0.78rem] font-black uppercase tracking-[0.24em] text-[var(--guide-accent)]">
              Brand Studio
            </p>
            <h1 className="mt-7 font-[family:var(--font-cormorant)] text-[3rem] leading-[0.92] text-[var(--guide-text)] sm:text-[4.5rem]">
              {guide.cover.title}
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-[#6f645b]">
              {guide.cover.subtitle}
            </p>
          </div>
          <div className="mt-10">
            <p className="text-base italic leading-8 text-[#5f544a]">{guide.cover.introLine}</p>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-[#7a7087]">
              Généré le {formatDate(guide.generatedAt)}
            </p>
          </div>
        </div>
        <div className="grid min-h-[22rem] grid-cols-2 gap-3">
          {moodboardItems.map((item) =>
            item.imageUrl ? (
              <div key={item.id} className="overflow-hidden rounded-[1rem] border border-white/70 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.label} className="h-full min-h-44 w-full object-cover" />
              </div>
            ) : null,
          )}
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
            <div className="col-span-2 flex items-center justify-center rounded-[1rem] border border-dashed border-[var(--guide-border)] bg-white p-6 text-center text-sm font-semibold text-[#7b7068]">
              Aperçu neutre. Palette à compléter dans le module Palette de couleurs.
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
    <section className="rounded-[1.4rem] border border-[var(--guide-border)] bg-[var(--guide-surface)] p-6 shadow-[0_18px_46px_rgba(210,189,152,0.08)] sm:p-8 print:break-inside-avoid print:shadow-none">
      <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[var(--guide-accent)]">
        {kicker}
      </p>
      <h2 className="mt-3 font-[family:var(--font-cormorant)] text-[2.5rem] leading-[0.98] text-[var(--guide-text)]">
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
    <article className={`${wide ? "mt-4" : ""} rounded-[0.75rem] border border-[var(--guide-border)] bg-[var(--guide-card)] px-5 py-5`}>
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
    return <GuideCard label="Palette" value="Palette ou intention visuelle à compléter dans le module Palette de couleurs." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {colors.map((color) => (
        <article key={color.id} className="overflow-hidden rounded-[0.75rem] border border-[var(--guide-border)] bg-[var(--guide-card)]">
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
    return <GuideCard label="Moodboard" value="Moodboard à compléter pour enrichir l'univers visuel." wide />;
  }

  return (
    <div className="mx-auto mt-5 w-full max-w-3xl rounded-[1rem] border border-[var(--guide-border)] bg-[#f5eee4] p-3 shadow-[0_18px_44px_rgba(78,58,38,0.1)]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[0.8rem] bg-[#fbf7f0]">
        {items.slice().sort((left, right) => left.zIndex - right.zIndex).map((item) => (
          <div
            key={item.id}
            className="absolute overflow-hidden rounded-[0.7rem] border border-white/80 bg-white shadow-[0_10px_24px_rgba(62,48,34,0.12)]"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.width}%`,
              height: `${item.height}%`,
              transform: `rotate(${item.rotation}deg)`,
              zIndex: item.zIndex,
              backgroundColor: item.type === "color" ? item.color : undefined,
            }}
          >
            {item.type === "image" && item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.label} className="h-full w-full object-cover" style={{ objectPosition: `${item.cropX ?? 50}% ${item.cropY ?? 50}%` }} />
            ) : item.type === "color" ? (
              <div className="flex h-full items-end p-3 text-xs font-black uppercase tracking-[0.12em] text-white drop-shadow">{item.label}</div>
            ) : item.type === "icon" ? (
              <div className="flex h-full flex-col items-center justify-center p-3 text-center" style={{ color: item.color ?? "#4b4550" }}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.label} className="h-full w-full object-contain" />
                ) : (
                  <><span className="text-4xl leading-none">{item.description === "circle" ? "○" : item.description === "wave" ? "∿" : item.description === "leaf" ? "◒" : "✦"}</span><span className="mt-2 text-[0.6rem] font-black uppercase tracking-[0.12em]">{item.label}</span></>
                )}
              </div>
            ) : (
              <div className={`flex h-full items-center justify-center p-3 text-center text-[#4b4550] ${item.type === "text" ? "font-[family:var(--font-cormorant)] text-xl italic" : "text-xs font-black uppercase tracking-[0.14em]"}`}>
                {item.label}
              </div>
            )}
          </div>
        ))}
      </div>
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
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--guide-accent)]" />
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
    <section className={`${compact ? "" : "min-h-[70vh]"} rounded-[1.4rem] border border-[var(--guide-border)] bg-[var(--guide-surface)] p-6 shadow-[0_18px_46px_rgba(210,189,152,0.08)] sm:p-8 print:shadow-none`}>
      <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[var(--guide-accent)]">
        Synthèse express
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
        Ton guide attend encore ses premières matières.
      </p>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#6f645b]">
        Complète au moins une réponse dans les modules Brand Studio pour générer un guide personnalisé.
      </p>
      <Link href="/mon-espace" className={`${primaryButtonClass} mt-6`}>
        Modifier mes réponses
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

function getGuideTheme(guide: GeneratedBrandGuide) {
  const colors = [
    ...guide.visualUniverse.palette.primary,
    ...guide.visualUniverse.palette.secondary,
  ];
  const solidHex = colors.map((color) => color.hex).find((hex) => hex.startsWith("#"));

  if (!solidHex) {
    return {
      background: "#FFFFFF",
      surface: "#FFFFFF",
      card: "#FFFFFF",
      border: "#E7E2DA",
      accent: "#4B4550",
      accentSoft: "#F6F4F0",
      text: "#2F2A33",
    };
  }

  const accent = normalizeHex(solidHex) ?? "#4B4550";
  const readableText = getReadableTextColor(accent);

  return {
    background: mixHex(accent, "#FFFFFF", 0.91),
    surface: mixHex(accent, "#FFFFFF", 0.97),
    card: "#FFFFFF",
    border: mixHex(accent, "#FFFFFF", 0.72),
    accent,
    accentSoft: mixHex(accent, "#FFFFFF", 0.88),
    text: readableText === "#FFFFFF" ? "#2F2A33" : readableText,
  };
}

function normalizeHex(value: string) {
  const match = value.trim().match(/^#?([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : null;
}

function hexToRgb(value: string) {
  const normalized = normalizeHex(value);
  if (!normalized) return null;
  return {
    red: Number.parseInt(normalized.slice(1, 3), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    blue: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function mixHex(base: string, target: string, targetRatio: number) {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);
  if (!baseRgb || !targetRgb) return target;

  return rgbToHex(
    baseRgb.red * (1 - targetRatio) + targetRgb.red * targetRatio,
    baseRgb.green * (1 - targetRatio) + targetRgb.green * targetRatio,
    baseRgb.blue * (1 - targetRatio) + targetRgb.blue * targetRatio,
  );
}

function getReadableTextColor(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#2F2A33";
  const luminance = (0.299 * rgb.red + 0.587 * rgb.green + 0.114 * rgb.blue) / 255;
  return luminance > 0.55 ? "#2F2A33" : "#FFFFFF";
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
