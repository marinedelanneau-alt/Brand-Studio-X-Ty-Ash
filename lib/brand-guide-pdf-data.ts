import type { GeneratedBrandGuide, GuideColor, GuideMoodboardItem } from "@/lib/brand-guide";

export type PdfField = { label: string; value: string };

export type BrandGuideChapter = {
  id: string;
  number: string;
  title: string;
  fields: PdfField[];
};

export type BrandGuideData = {
  brandName: string;
  baseline: string;
  generatedAt: string;
  chapters: BrandGuideChapter[];
  foundations: PdfField[];
  positioning: PdfField[];
  personality: PdfField[];
  language: { use: string[]; avoid: string[] };
  messages: PdfField[];
  palette: GuideColor[];
  ambiance: string;
  moodboardBackground: string;
  moodboard: GuideMoodboardItem[];
  summary: PdfField[];
};

const EMPTY_MARKERS = [
  "a completer",
  "a preciser",
  "a renseigner",
  "a finaliser",
  "non renseigne",
  "valeur manquante",
  "champ vide",
  "placeholder",
  "aucune reponse",
];

function compact(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalized(value: string) {
  return compact(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function isPdfContent(value: unknown) {
  const text = compact(value);
  if (!text) return false;
  const search = normalized(text);
  return !EMPTY_MARKERS.some((marker) => search.includes(marker));
}

function field(label: string, value: unknown): PdfField | null {
  return isPdfContent(value) ? { label, value: compact(value) } : null;
}

function fields(values: Array<PdfField | null>) {
  return values.filter((value): value is PdfField => value !== null);
}

function cleanList(values: string[]) {
  return values.map(compact).filter(isPdfContent);
}

export function createBrandGuideData(guide: GeneratedBrandGuide): BrandGuideData {
  const foundations = fields([
    field("Activité", guide.dna.activity),
    field("Raison d’être", guide.dna.essence),
    field("Mission", guide.dna.mission),
    field("Vision", guide.dna.vision),
    field("Valeurs", cleanList(guide.dna.values).join(" · ")),
  ]);
  const positioning = fields([
    field("Contexte client", guide.positioning.context),
    field("Positionnement final", guide.positioning.finalPositioning),
  ]);
  const personality = fields([
    field("Portrait", guide.personality.persona),
    field("Traits", cleanList(guide.personality.traits).join(" · ")),
    field("Attitude", guide.personality.relationship),
    field("Tonalité", guide.personality.tone),
  ]);
  const language = {
    use: cleanList(guide.personality.wordsToUse),
    avoid: cleanList(guide.personality.wordsToAvoid),
  };
  const messages = fields([
    field("Promesse", guide.dna.promise),
    field("Baseline", guide.baselineSection.final),
  ]);
  const palette = [...guide.visualUniverse.palette.primary, ...guide.visualUniverse.palette.secondary]
    .filter((color) => isPdfContent(color.name) && /^#[0-9A-Fa-f]{6}$/.test(color.hex));
  const ambiance = isPdfContent(guide.visualUniverse.ambiance) ? compact(guide.visualUniverse.ambiance) : "";
  const moodboard = guide.visualUniverse.moodboard.filter((item) =>
    item.type === "color" || isPdfContent(item.label) || Boolean(item.imageUrl),
  );

  const definitions: Array<Omit<BrandGuideChapter, "number">> = [
    { id: "foundations", title: "Fondations", fields: foundations },
    { id: "positioning", title: "Positionnement", fields: positioning },
    { id: "personality", title: "Personnalité", fields: personality },
    { id: "language", title: "Langage", fields: fields([field("Mots à utiliser", language.use.join(" · ")), field("Mots à éviter", language.avoid.join(" · "))]) },
    { id: "messages", title: "Messages", fields: messages },
    { id: "visual", title: "Univers visuel", fields: fields([field("Ambiance générale", ambiance), field("Palette", palette.map((color) => color.name).join(" · "))]) },
    { id: "moodboard", title: "Moodboard", fields: moodboard.length > 0 ? [{ label: "Planche d’inspiration", value: `${moodboard.length} éléments` }] : [] },
  ];
  const summary = fields([
    field("Mission", guide.dna.mission),
    field("Positionnement", guide.positioning.finalPositioning),
    field("Promesse", guide.dna.promise),
    field("Baseline", guide.baselineSection.final),
    field("Personnalité", cleanList(guide.personality.traits).join(" · ")),
    field("Tonalité", guide.personality.tone),
    field("Mots-clés", language.use.slice(0, 5).join(" · ")),
    field("Palette", palette.map((color) => `${color.name} ${color.hex}`).join(" · ")),
  ]);
  const chapters = [
    ...definitions,
    { id: "summary", title: "Synthèse", fields: summary },
  ]
    .filter((chapter) => chapter.fields.length > 0)
    .map((chapter, index) => ({ ...chapter, number: String(index + 1).padStart(2, "0") }));

  return {
    brandName: compact(guide.brandName) || "Ma marque",
    baseline: isPdfContent(guide.baseline) ? compact(guide.baseline) : "",
    generatedAt: guide.generatedAt,
    chapters,
    foundations,
    positioning,
    personality,
    language,
    messages,
    palette,
    ambiance,
    moodboardBackground: guide.visualUniverse.moodboardBackground || "#F5E8C8",
    moodboard,
    summary,
  };
}
