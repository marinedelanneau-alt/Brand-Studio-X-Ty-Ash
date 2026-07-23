import type { GuideMoodboardItem } from "./brand-guide";
import type { PdfField } from "./brand-guide-pdf-data";

export const PDF_GRID = {
  columns: 12,
  pageWidth: 595.28,
  pageHeight: 841.89,
  marginX: 52,
  gutter: 12,
  contentWidth: 491.28,
} as const;

export type EditorialLayout = "manifesto" | "two-columns" | "profile" | "quote" | "compact-list";
export type CoverLayout = "logo-image" | "logo-typographic" | "palette-graphic";

export function calculatePageDensity(fields: PdfField[], extras = 0) {
  const characters = fields.reduce((sum, field) => sum + field.label.length + field.value.length, 0);
  const paragraphs = fields.reduce((sum, field) => sum + Math.max(1, field.value.split(/\n+/).length), 0);
  return Math.min(2, (characters / 1_650) + (paragraphs * 0.035) + extras);
}

export const calculatePageContentScore = calculatePageDensity;

export function hasVisibleEditorialContent(fields: PdfField[]) {
  return fields.some((field) => field.value.trim().length > 0);
}

export function selectCoverLayout(data: { logoUrl?: string; logoAspectRatio?: number; brandName: string; moodboard: GuideMoodboardItem[] }) : CoverLayout {
  const hasImage = data.moodboard.some((item) => item.type === "image" && item.imageUrl);
  if (data.logoUrl && hasImage && (data.logoAspectRatio ?? 1) >= 1.2) return "logo-image";
  if (data.logoUrl) return "logo-typographic";
  return "palette-graphic";
}

export function selectEditorialLayout(fields: PdfField[]): EditorialLayout {
  if (fields.length === 1 && fields[0].value.length < 430) return "manifesto";
  if (fields.some((field) => field.value.length > 700)) return "profile";
  if (fields.length >= 5 && calculatePageDensity(fields) < 0.95) return "compact-list";
  return "two-columns";
}

export function getAccessibleTextColor(hex: string) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return "#29242C";
  const rgb = [0, 2, 4].map((offset) => Number.parseInt(clean.slice(offset, offset + 2), 16) / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return luminance > 0.42 ? "#29242C" : "#FFFFFF";
}

export function composeMoodboard(items: GuideMoodboardItem[]) {
  return items.slice().sort((left, right) => left.zIndex - right.zIndex);
}
