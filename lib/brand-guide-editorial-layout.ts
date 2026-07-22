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

export function calculatePageDensity(fields: PdfField[], extras = 0) {
  const characters = fields.reduce((sum, field) => sum + field.label.length + field.value.length, 0);
  const paragraphs = fields.reduce((sum, field) => sum + Math.max(1, field.value.split(/\n+/).length), 0);
  return Math.min(2, (characters / 1_650) + (paragraphs * 0.035) + extras);
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

type MoodboardFrame = Pick<GuideMoodboardItem, "x" | "y" | "width" | "height" | "rotation">;

const MOODBOARD_FRAMES: Record<number, MoodboardFrame[]> = {
  1: [{ x: 0, y: 0, width: 100, height: 100, rotation: 0 }],
  2: [{ x: 0, y: 0, width: 63, height: 100, rotation: 0 }, { x: 65, y: 0, width: 35, height: 100, rotation: 0 }],
  3: [{ x: 0, y: 0, width: 58, height: 100, rotation: 0 }, { x: 60, y: 0, width: 40, height: 48, rotation: 0 }, { x: 60, y: 51, width: 40, height: 49, rotation: 0 }],
  4: [{ x: 0, y: 0, width: 60, height: 62, rotation: 0 }, { x: 62, y: 0, width: 38, height: 62, rotation: 0 }, { x: 0, y: 65, width: 38, height: 35, rotation: 0 }, { x: 40, y: 65, width: 60, height: 35, rotation: 0 }],
  5: [{ x: 0, y: 0, width: 50, height: 65, rotation: 0 }, { x: 52, y: 0, width: 48, height: 38, rotation: 0 }, { x: 52, y: 41, width: 23, height: 59, rotation: 0 }, { x: 77, y: 41, width: 23, height: 28, rotation: 0 }, { x: 77, y: 72, width: 23, height: 28, rotation: 0 }],
  6: [{ x: 0, y: 0, width: 48, height: 62, rotation: 0 }, { x: 50, y: 0, width: 25, height: 36, rotation: 0 }, { x: 77, y: 0, width: 23, height: 36, rotation: 0 }, { x: 50, y: 39, width: 50, height: 61, rotation: 0 }, { x: 0, y: 65, width: 23, height: 35, rotation: 0 }, { x: 25, y: 65, width: 23, height: 35, rotation: 0 }],
};

export function composeMoodboard(items: GuideMoodboardItem[]) {
  const selected = items.slice(0, 6);
  const frames = MOODBOARD_FRAMES[selected.length] ?? [];
  return selected.map((item, index) => ({ ...item, ...frames[index], zIndex: index + 1 }));
}
