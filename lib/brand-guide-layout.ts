import type { GuideMoodboardItem } from "./brand-guide";
import type { BrandGuideData, PdfField } from "./brand-guide-pdf-data";

export type TextFit = {
  fontSize: number;
  estimatedLines: number;
  fits: boolean;
};

export type PositioningLayout = {
  variant: "short" | "medium" | "long";
  statementFontSize: number;
  contextFontSize: number;
  columns: boolean;
};

const compact = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

export function fitTextToBox({
  text,
  width,
  height,
  minFontSize,
  maxFontSize,
  lineHeight,
}: {
  text: string;
  width: number;
  height: number;
  minFontSize: number;
  maxFontSize: number;
  lineHeight: number;
}): TextFit {
  const content = compact(text);
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 0.5) {
    const charactersPerLine = Math.max(8, Math.floor(width / (fontSize * 0.52)));
    const estimatedLines = content
      .split(/\n+/)
      .reduce((sum, paragraph) => sum + Math.max(1, Math.ceil(paragraph.length / charactersPerLine)), 0);
    if (estimatedLines * fontSize * lineHeight <= height) return { fontSize, estimatedLines, fits: true };
  }
  const charactersPerLine = Math.max(8, Math.floor(width / (minFontSize * 0.52)));
  const estimatedLines = Math.max(1, Math.ceil(content.length / charactersPerLine));
  return { fontSize: minFontSize, estimatedLines, fits: estimatedLines * minFontSize * lineHeight <= height };
}

export function getPositioningLayout(positioningText: string, contextText: string): PositioningLayout {
  const total = compact(positioningText).length + compact(contextText).length;
  const fit = fitTextToBox({
    text: positioningText,
    width: total < 650 ? 282 : 390,
    height: total < 650 ? 430 : 310,
    minFontSize: 20,
    maxFontSize: 31,
    lineHeight: 1.18,
  });
  if (total <= 560 && fit.fits) return { variant: "short", statementFontSize: fit.fontSize, contextFontSize: 10.5, columns: false };
  if (total <= 1_180 && fit.fits) return { variant: "medium", statementFontSize: fit.fontSize, contextFontSize: 9.5, columns: false };
  return { variant: "long", statementFontSize: 20, contextFontSize: 9.25, columns: true };
}

export function shouldRenderMissionSpread(data: BrandGuideData, foundationsLayout: string) {
  const mission = data.foundations.find((item) => item.label === "Mission")?.value;
  return Boolean(mission && foundationsLayout === "manifesto-reference");
}

export function isValidMoodboardColorItem(item: GuideMoodboardItem) {
  if (item.type !== "color") return true;
  return /^#[0-9a-f]{6}$/i.test(compact(item.color));
}

export function sanitizeMoodboardItems(items: GuideMoodboardItem[]) {
  return items.filter((item) => {
    if (!item || !compact(item.label)) return false;
    if (item.type === "color") return isValidMoodboardColorItem(item);
    if (["image", "icon"].includes(item.type)) return Boolean(item.imageUrl);
    const label = compact(item.label).toLowerCase();
    return !["inspiration 1", "inspiration 2", "à compléter", "non renseigné"].includes(label);
  });
}

export function selectApplicationMessage(data: BrandGuideData) {
  const baseline = compact(data.baseline || data.messages.find((item) => item.label === "Baseline")?.value);
  const main = compact(data.messages.find((item) => /message principal/i.test(item.label))?.value);
  const promise = compact(data.messages.find((item) => item.label === "Promesse")?.value);
  const pitch = compact(data.positioning.find((item) => /pitch/i.test(item.label))?.value);
  return [baseline, main, promise, pitch].find((value) => value && value.length <= 180) || data.brandName;
}

export function isOrphanPage(page: { contentScore: number; visibleContentCount: number; title?: string; chapter?: string }) {
  return page.contentScore < 0.15 || page.visibleContentCount < 1 || !compact(page.title || page.chapter);
}

export function mergeOrphanContentIntoPreviousPage<T extends { contentScore: number; visibleContentCount: number; title?: string; chapter?: string }>(pages: T[]) {
  return pages.filter((page, index) => index < 2 || !isOrphanPage(page));
}

export const forbiddenPdfTexts = [
  "Cela signifie que je",
  "Concrètement cela se traduit",
  "Ta réponse",
  "Exemple de prise de parole",
  "Inspiration 1",
  "Inspiration 2",
  "À compléter",
  "Non renseigné",
];

export function validateGeneratedGuide(guide: {
  pages: Array<{ id: string; pageNumber: number; title?: string; chapter?: string; contentScore: number; visibleContentCount: number }>;
  tableOfContents: Array<{ firstPage: number }>;
  totalPages: number;
}, text = "") {
  const errors: string[] = [];
  const ids = new Set<string>();
  guide.pages.forEach((page, index) => {
    if (ids.has(page.id)) errors.push(`Page dupliquée : ${page.id}`);
    ids.add(page.id);
    if (page.pageNumber !== index + 1) errors.push(`Pagination incohérente : ${page.id}`);
    if (index >= 2 && isOrphanPage(page)) errors.push(`Page orpheline : ${page.id}`);
  });
  guide.tableOfContents.forEach((entry) => {
    if (!guide.pages.some((page) => page.pageNumber === entry.firstPage)) errors.push(`Sommaire incorrect : ${entry.firstPage}`);
  });
  forbiddenPdfTexts.forEach((forbidden) => {
    if (text.includes(forbidden)) errors.push(`Texte interdit : ${forbidden}`);
  });
  if (guide.totalPages !== guide.pages.length) errors.push("Nombre total de pages incorrect");
  return { valid: errors.length === 0, errors };
}

export function visibleFields(fields: PdfField[]) {
  return fields.filter((field) => compact(field.value));
}
