import type { BrandGuideData } from "./brand-guide-pdf-data";
import { getPositioningLayout, mergeOrphanContentIntoPreviousPage, shouldRenderMissionSpread, visibleFields } from "./brand-guide-layout";
import type { BrandArtDirection, BrandVisualIdentity } from "./brand-visual-identity";

export type EditorialPageKind =
  | "cover" | "contents" | "foundations" | "manifesto" | "values" | "positioning"
  | "personality" | "messages" | "visual-system" | "moodboard" | "applications" | "summary";

export type EditorialPagePlan = {
  id: string;
  chapterId: string;
  kind: EditorialPageKind;
  chapter: string;
  number?: string;
  page: number;
  pageNumber: number;
  variant: string;
  density: number;
  contentScore: number;
  visibleContentCount: number;
};

export type GuideNavigationEntry = {
  id: string;
  chapterNumber: string;
  label: string;
  firstPage: number;
};

export type EditorialComposition = {
  pages: EditorialPagePlan[];
  contents: Array<{ number: string; title: string; page: number; description: string }>;
  tableOfContents: GuideNavigationEntry[];
  guideNavigationModel: GuideNavigationEntry[];
  totalPages: number;
};

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

function score(values: string[]) {
  return Math.min(1, 0.18 + values.reduce((sum, value) => sum + value.length, 0) / 1_900);
}

function coverVariant(direction: BrandArtDirection, identity: BrandVisualIdentity) {
  if (identity.moodboard.images.length >= 3 && direction === "creative-studio") return "collage";
  if (identity.moodboard.images.length && ["bold", "graphic", "contemporary"].includes(direction)) return "image";
  if (["luxury", "premium-editorial"].includes(direction)) return "minimal-premium";
  if (identity.colors.length >= 3) return "chromatic";
  return "typographic";
}

export function composeEditorialPages({ data, identity, direction }: {
  data: BrandGuideData;
  identity: BrandVisualIdentity;
  direction: BrandArtDirection;
}): EditorialComposition {
  type Draft = Omit<EditorialPagePlan, "page" | "pageNumber" | "number">;
  const drafts: Draft[] = [];
  const add = (draft: Omit<Draft, "contentScore" | "visibleContentCount">, values: string[], count = values.filter(Boolean).length) => {
    const contentScore = score(values);
    drafts.push({ ...draft, density: contentScore, contentScore, visibleContentCount: count });
  };

  const foundationValues = visibleFields(data.foundations).map((item) => item.value);
  const foundationsVariant = foundationValues.join("").length > 900 ? "narrative-dense" : "statement-led";
  if (foundationValues.length) {
    add({ id: "foundations", chapterId: "foundations", kind: "foundations", chapter: "Fondations", variant: foundationsVariant, density: 0 }, foundationValues);
    if (shouldRenderMissionSpread(data, foundationsVariant)) {
      add({ id: "mission", chapterId: "foundations", kind: "manifesto", chapter: "Mission", variant: "single-statement", density: 0 }, [data.foundations.find((item) => item.label === "Mission")?.value || ""]);
    }
  }

  if (data.values.length) {
    const longValues = data.values.some((value) => [value.meaning, value.concreteApplication, value.communicationExpression].join("").length > 280);
    const batchSize = longValues ? 1 : 3;
    for (let offset = 0; offset < data.values.length; offset += batchSize) {
      const batch = data.values.slice(offset, offset + batchSize);
      add({ id: `values-${offset / batchSize + 1}`, chapterId: "values", kind: "values", chapter: "Valeurs", variant: longValues ? "vertical-stories" : "editorial-sequences", density: 0 },
        batch.flatMap((value) => [value.name, value.meaning || "", value.concreteApplication || "", value.communicationExpression || ""]), batch.length);
    }
  }

  if (data.positioning.length) {
    const statement = data.positioning.find((item) => /final/i.test(item.label))?.value || data.positioning.at(-1)?.value || "";
    const context = data.positioning.find((item) => !/final/i.test(item.label))?.value || "";
    const layout = getPositioningLayout(statement, context);
    add({ id: "positioning", chapterId: "positioning", kind: "positioning", chapter: "Positionnement", variant: layout.variant, density: 0 }, [statement, context], 2);
  }
  if (data.personality.length || data.language.use.length || data.language.avoid.length) {
    add({ id: "personality", chapterId: "personality", kind: "personality", chapter: "Personnalité", variant: identity.moodboard.images.length ? "magazine-portrait" : "typographic-portrait", density: 0 },
      [...data.personality.map((item) => item.value), ...data.language.use, ...data.language.avoid]);
  }
  if (data.messages.length) add({ id: "messages", chapterId: "messages", kind: "messages", chapter: "Messages", variant: "message-architecture", density: 0 }, data.messages.map((item) => item.value));
  if (data.palette.length || data.logoUrl || data.ambiance) add({ id: "visual-system", chapterId: "visual", kind: "visual-system", chapter: "Univers visuel", variant: "complete-identity-system", density: 0 }, [data.ambiance, ...data.palette.flatMap((color) => [color.name, color.hex, color.usage])], data.palette.length + Number(Boolean(data.logoUrl)));
  if (data.moodboard.length) add({ id: "moodboard", chapterId: "moodboard", kind: "moodboard", chapter: "Moodboard", variant: "original-composition", density: 0 }, data.moodboard.map((item) => item.label), data.moodboard.length);
  if (data.messages.length || data.language.use.length) add({ id: "applications", chapterId: "applications", kind: "applications", chapter: "Applications", variant: "brand-specimens", density: 0 }, [data.baseline, ...data.messages.map((item) => item.value)], 3);
  if (data.summary.length) add({ id: "summary", chapterId: "summary", kind: "summary", chapter: "Synthèse", variant: "strategy-poster", density: 0 }, data.summary.map((item) => item.value));

  const usefulDrafts = mergeOrphanContentIntoPreviousPage(drafts);
  const chapterIds = [...new Set(usefulDrafts.map((page) => page.chapterId))];
  const chapterNumbers = new Map(chapterIds.map((id, index) => [id, String(index + 1).padStart(2, "0")]));
  const contentPages = usefulDrafts.map((draft, index) => ({
    ...draft,
    page: index + 3,
    pageNumber: index + 3,
    number: chapterNumbers.get(draft.chapterId),
  }));
  const navigation = chapterIds.map((id) => {
    const page = contentPages.find((candidate) => candidate.chapterId === id)!;
    return { id, chapterNumber: chapterNumbers.get(id)!, label: page.chapter, firstPage: page.pageNumber };
  });
  const contents = navigation.map((item) => ({
    number: item.chapterNumber,
    title: item.label,
    page: item.firstPage,
    description: descriptions[item.id] || "",
  }));
  const pages: EditorialPagePlan[] = [
    { id: "cover", chapterId: "cover", kind: "cover", chapter: "Couverture", page: 1, pageNumber: 1, variant: coverVariant(direction, identity), density: 0.76, contentScore: 0.76, visibleContentCount: 1 },
    { id: "contents", chapterId: "contents", kind: "contents", chapter: "Sommaire", page: 2, pageNumber: 2, variant: "editorial-index", density: Math.min(0.88, 0.35 + contents.length * 0.06), contentScore: 0.7, visibleContentCount: contents.length },
    ...contentPages,
  ];
  return { pages, contents, tableOfContents: navigation, guideNavigationModel: navigation, totalPages: pages.length };
}
