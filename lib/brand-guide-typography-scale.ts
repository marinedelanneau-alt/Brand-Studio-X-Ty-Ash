export const BRAND_GUIDE_TYPOGRAPHY = {
  coverTitle: 44,
  chapterTitle: 30,
  editorialLarge: 26,
  editorialMedium: 22,
  editorialSmall: 18,
  sectionTitle: 16,
  bodyLarge: 12.5,
  body: 11,
  caption: 9,
  label: 8.5,
} as const;

export type EditorialTextRole = "cover" | "chapter" | "statement" | "section" | "body" | "caption" | "label";

export function selectEditorialTextStyle({
  text,
  role,
}: {
  text: string;
  role: EditorialTextRole;
  availableWidth?: number;
  availableHeight?: number;
}) {
  const length = text.trim().length;
  if (role === "cover") return { fontSize: length > 44 ? 30 : length > 30 ? 36 : BRAND_GUIDE_TYPOGRAPHY.coverTitle };
  if (role === "chapter") return { fontSize: BRAND_GUIDE_TYPOGRAPHY.chapterTitle };
  if (role === "statement") {
    return { fontSize: length < 80 ? 26 : length < 160 ? 22 : length < 280 ? 18 : 14 };
  }
  if (role === "section") return { fontSize: BRAND_GUIDE_TYPOGRAPHY.sectionTitle };
  if (role === "caption") return { fontSize: BRAND_GUIDE_TYPOGRAPHY.caption };
  if (role === "label") return { fontSize: BRAND_GUIDE_TYPOGRAPHY.label };
  return { fontSize: length > 520 ? 10 : BRAND_GUIDE_TYPOGRAPHY.body };
}

export const BRAND_GUIDE_TYPE_LIMITS = { contentMin: 10, contentMax: 28 };
