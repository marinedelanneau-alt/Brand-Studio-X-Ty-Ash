import type { BrandGuideData } from "./brand-guide-pdf-data";
import type { BrandArtDirection, BrandVisualIdentity } from "./brand-visual-identity";

export type EditorialPageKind =
  | "cover"
  | "contents"
  | "foundations"
  | "manifesto"
  | "values"
  | "positioning"
  | "personality"
  | "messages"
  | "visual-system"
  | "moodboard"
  | "applications"
  | "summary";

export type EditorialPagePlan = {
  id: string;
  kind: EditorialPageKind;
  chapter: string;
  number?: string;
  page: number;
  variant: string;
  density: number;
};

export type EditorialComposition = {
  pages: EditorialPagePlan[];
  contents: Array<{ number: string; title: string; page: number; description: string }>;
};

function contentScore(values: string[]) {
  const characters = values.reduce((sum, value) => sum + value.length, 0);
  return Math.min(1, 0.18 + characters / 1_900);
}

function coverVariant(direction: BrandArtDirection, identity: BrandVisualIdentity) {
  if (identity.moodboard.images.length >= 3 && direction === "creative-studio") return "collage";
  if (identity.moodboard.images.length > 0 && ["bold", "graphic", "contemporary"].includes(direction)) return "image";
  if (["luxury", "premium-editorial"].includes(direction)) return "minimal-premium";
  if (identity.colors.length >= 3) return "chromatic";
  return "typographic";
}

const descriptions: Record<string, string> = {
  foundations: "La raison d’être, la mission et la vision qui donnent sa direction à la marque.",
  values: "Les principes incarnés dans les décisions, les gestes et la communication.",
  positioning: "La place choisie, la différence défendue et la transformation promise.",
  personality: "Le caractère, l’attitude et le langage qui rendent la marque reconnaissable.",
  messages: "La promesse et les formulations centrales à préserver.",
  visual: "Le logo, le système chromatique et les principes d’expression visuelle.",
  moodboard: "La direction artistique exprimée par les images, signes, couleurs et mots.",
  applications: "Des compositions simples pour mettre le système de marque en mouvement.",
  summary: "Une affiche stratégique qui rassemble l’essentiel de la marque.",
};

export function composeEditorialPages(input: {
  data: BrandGuideData;
  identity: BrandVisualIdentity;
  direction: BrandArtDirection;
}): EditorialComposition {
  const { data, identity, direction } = input;
  const chapters: Array<Omit<EditorialPagePlan, "page" | "number"> & { tocId: string }> = [];
  const foundationValues = data.foundations.map((item) => item.value);
  if (foundationValues.length) {
    chapters.push({
      id: "foundations",
      tocId: "foundations",
      kind: "foundations",
      chapter: "Fondations",
      variant: foundationValues.join("").length > 900 ? "narrative-dense" : "statement-led",
      density: contentScore(foundationValues),
    });
    const mission = data.foundations.find((item) => item.label === "Mission")?.value;
    if (mission && mission.length < 280 && direction !== "contemporary") {
      chapters.push({
        id: "mission-opening",
        tocId: "foundations",
        kind: "manifesto",
        chapter: "Mission",
        variant: "single-statement",
        density: 0.66,
      });
    }
  }
  if (data.values.length) {
    const batches = data.values.length > 4
      ? [data.values.slice(0, 3), data.values.slice(3)]
      : [data.values];
    batches.forEach((batch, index) => chapters.push({
      id: `values-${index + 1}`,
      tocId: "values",
      kind: "values",
      chapter: "Valeurs",
      variant: index % 2 === 0 ? "editorial-sequences" : "numbered-stories",
      density: contentScore(batch.flatMap((value) => [value.name, value.meaning || "", value.concreteApplication || "", value.communicationExpression || ""])),
    }));
  }
  if (data.positioning.length) chapters.push({
    id: "positioning",
    tocId: "positioning",
    kind: "positioning",
    chapter: "Positionnement",
    variant: direction === "bold" || direction === "graphic" ? "contrast-path" : "editorial-path",
    density: contentScore(data.positioning.map((item) => item.value)),
  });
  if (data.personality.length || data.language.use.length || data.language.avoid.length) chapters.push({
    id: "personality",
    tocId: "personality",
    kind: "personality",
    chapter: "Personnalité",
    variant: identity.moodboard.images.length ? "magazine-portrait" : "typographic-portrait",
    density: contentScore([...data.personality.map((item) => item.value), ...data.language.use, ...data.language.avoid]),
  });
  if (data.messages.length) chapters.push({
    id: "messages",
    tocId: "messages",
    kind: "messages",
    chapter: "Messages",
    variant: "message-architecture",
    density: contentScore(data.messages.map((item) => item.value)),
  });
  if (data.palette.length || data.logoUrl || data.ambiance) chapters.push({
    id: "visual-system",
    tocId: "visual",
    kind: "visual-system",
    chapter: "Univers visuel",
    variant: data.palette.length > 5 ? "chromatic-spectrum" : "chromatic-proportions",
    density: Math.min(0.9, 0.45 + data.palette.length * 0.07),
  });
  if (data.moodboard.length) chapters.push({
    id: "moodboard",
    tocId: "moodboard",
    kind: "moodboard",
    chapter: "Moodboard",
    variant: direction === "creative-studio" ? "free-collage" : direction === "premium-editorial" || direction === "luxury" ? "minimal-gallery" : identity.moodboard.images.length >= 2 ? "asymmetrical-story" : "editorial-grid",
    density: 0.82,
  });
  if (data.messages.length || data.language.use.length) chapters.push({
    id: "applications",
    tocId: "applications",
    kind: "applications",
    chapter: "Applications",
    variant: "graphic-specimens",
    density: 0.72,
  });
  if (data.summary.length) chapters.push({
    id: "summary",
    tocId: "summary",
    kind: "summary",
    chapter: "Synthèse",
    variant: "strategy-poster",
    density: 0.8,
  });

  let nextChapter = 1;
  const chapterNumbers = new Map<string, string>();
  for (const chapter of chapters) {
    if (!chapterNumbers.has(chapter.tocId)) {
      chapterNumbers.set(chapter.tocId, String(nextChapter).padStart(2, "0"));
      nextChapter += 1;
    }
  }
  const planned = chapters.map((chapter, index) => ({
    ...chapter,
    page: index + 3,
    number: chapterNumbers.get(chapter.tocId),
  }));
  const firstPages = new Map<string, EditorialPagePlan>();
  planned.forEach((page) => {
    const tocId = chapters.find((chapter) => chapter.id === page.id)?.tocId;
    if (tocId && !firstPages.has(tocId)) firstPages.set(tocId, page);
  });
  const contents = [...firstPages.entries()].map(([id, page]) => ({
    number: page.number || "",
    title: page.chapter,
    page: page.page,
    description: descriptions[id] || "",
  }));

  return {
    pages: [
      { id: "cover", kind: "cover", chapter: "Couverture", page: 1, variant: coverVariant(direction, identity), density: 0.76 },
      { id: "contents", kind: "contents", chapter: "Sommaire", page: 2, variant: "editorial-index", density: Math.min(0.88, 0.35 + contents.length * 0.06) },
      ...planned,
    ],
    contents,
  };
}
