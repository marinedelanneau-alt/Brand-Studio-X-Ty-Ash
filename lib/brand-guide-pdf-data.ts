import type { GeneratedBrandGuide, GuideColor, GuideMoodboardItem } from "@/lib/brand-guide";
import { calculatePageDensity } from "./brand-guide-editorial-layout";

export type PdfField = { label: string; value: string };

export type BrandGuideChapter = {
  id: string;
  number: string;
  title: string;
  page: number;
  fields: PdfField[];
};

export type BrandValueData = {
  name: string;
  meaning?: string;
  concreteApplication?: string;
  communicationExpression?: string;
};

export type BrandGuideData = {
  brandName: string;
  logoUrl?: string;
  logoStoragePath?: string;
  logoAlt?: string;
  logoAspectRatio?: number;
  logoOwner: string;
  baseline: string;
  generatedAt: string;
  chapters: BrandGuideChapter[];
  foundations: PdfField[];
  values: BrandValueData[];
  positioning: PdfField[];
  personality: PdfField[];
  language: { use: string[]; avoid: string[] };
  messages: PdfField[];
  palette: GuideColor[];
  ambiance: string;
  moodboardBackground: string;
  moodboard: GuideMoodboardItem[];
  summary: PdfField[];
  combinePositioningAndMessages: boolean;
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
  "inspiration 1",
  "inspiration 2",
  "donnee de demonstration",
  "exemple",
];

function compact(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalized(value: string) {
  return compact(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function hasMeaningfulContent(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasMeaningfulContent);
  if (value && typeof value === "object") return Object.values(value).some(hasMeaningfulContent);
  const text = compact(value);
  if (!text) return false;
  const search = normalized(text);
  return !EMPTY_MARKERS.some((marker) => search.includes(marker));
}

export const isPdfContent = hasMeaningfulContent;

export function filterMeaningfulContent<T>(values: T[]) {
  return values.filter(hasMeaningfulContent);
}

function field(label: string, value: unknown): PdfField | null {
  return isPdfContent(value) ? { label, value: compact(value) } : null;
}

function fields(values: Array<PdfField | null>) {
  return values.filter((value): value is PdfField => value !== null);
}

function cleanList(values: string[]) {
  return values.map(compact).filter(hasMeaningfulContent);
}

export function mapValueAnswers(values: string[]): BrandValueData[] {
  const source = values.join(" · ");
  const labels = "Valeur|Cela signifie que je|Ce que cette valeur signifie|Dans la pratique|Concrètement|Dans ma communication|Dans la communication";
  const matches = [...source.matchAll(new RegExp(`(?:^|\\s*·\\s*)(?:\\d+\\s*·\\s*)?(${labels})\\s*:\\s*(.*?)(?=\\s*·\\s*(?:\\d+\\s*·\\s*)?(?:${labels})\\s*:|$)`, "gi"))];
  const result: BrandValueData[] = [];
  let current: BrandValueData | null = null;

  for (const match of matches) {
    const key = normalized(match[1]);
    const value = compact(match[2]);
    if (!hasMeaningfulContent(value)) continue;
    if (key === "valeur") {
      current = { name: value };
      result.push(current);
    } else if (current && (key.includes("signifie") || key.includes("meaning"))) {
      current.meaning = value;
    } else if (current && (key.includes("pratique") || key.includes("concret"))) {
      current.concreteApplication = value;
    } else if (current && key.includes("communication")) {
      current.communicationExpression = value;
    }
  }

  if (result.length > 0) return result.slice(0, 6);
  return cleanList(values)
    .filter((value) => !value.includes(":"))
    .slice(0, 6)
    .map((name) => ({ name }));
}

export function normalizeBrandGuideData(guide: GeneratedBrandGuide): BrandGuideData {
  const values = mapValueAnswers(guide.dna.values);
  const foundations = fields([
    field("Activité", guide.dna.activity),
    field("Raison d’être", guide.dna.essence),
    field("Mission", guide.dna.mission),
    field("Vision", guide.dna.vision),
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
  const moodboard = guide.visualUniverse.moodboard.filter(
    (item) => item.type !== "image" || Boolean(item.imageUrl),
  );

  const definitions: Array<Omit<BrandGuideChapter, "number" | "page">> = [
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
  const combinePositioningAndMessages = positioning.length > 0 && messages.length > 0 &&
    calculatePageDensity([...positioning, ...messages], 0.12) <= 0.9;
  const pageDefinitions = [
    { id: "foundations", title: "Fondations", fields: foundations },
    { id: "values", title: "Valeurs", fields: values.map((value) => ({ label: "Valeur", value: [value.name, value.meaning, value.concreteApplication, value.communicationExpression].filter(Boolean).join(" ") })) },
    { id: "positioning", title: "Positionnement", fields: positioning },
    { id: "messages", title: "Messages", fields: messages },
    { id: "voice", title: "Personnalité & langage", fields: [...personality, ...definitions.find((item) => item.id === "language")!.fields] },
    { id: "visual", title: "Univers visuel", fields: definitions.find((item) => item.id === "visual")!.fields },
    { id: "moodboard", title: "Moodboard", fields: definitions.find((item) => item.id === "moodboard")!.fields },
    { id: "summary", title: "Synthèse", fields: summary },
  ].filter((chapter) => chapter.fields.length > 0);
  let nextPage = 3;
  let positioningPage = 0;
  const chapters = pageDefinitions.map((chapter, index) => {
    const page = chapter.id === "messages" && combinePositioningAndMessages
      ? positioningPage
      : nextPage++;
    if (chapter.id === "positioning") positioningPage = page;
    return { ...chapter, number: String(index + 1).padStart(2, "0"), page };
  });

  return {
    brandName: compact(guide.brandName) || "Ma marque",
    logoUrl: guide.brandAssets?.logoUrl,
    logoStoragePath: guide.brandAssets?.logoStoragePath,
    logoAlt: guide.brandAssets?.logoAlt,
    logoAspectRatio: guide.brandAssets?.logoAspectRatio,
    logoOwner: compact(guide.brandAssets?.logoOwner) || compact(guide.brandName),
    baseline: isPdfContent(guide.baseline) ? compact(guide.baseline) : "",
    generatedAt: guide.generatedAt,
    chapters,
    foundations,
    values,
    positioning,
    personality,
    language,
    messages,
    palette,
    ambiance,
    moodboardBackground: guide.visualUniverse.moodboardBackground || "#F5E8C8",
    moodboard,
    summary,
    combinePositioningAndMessages,
  };
}

export const createBrandGuideData = normalizeBrandGuideData;
export const filterEditorialContent = filterMeaningfulContent;

export function validateBrandGuideData(data: BrandGuideData) {
  const consistency = validateBrandGuideConsistency(data);
  return {
    ...consistency,
    valid: consistency.valid && hasMeaningfulContent(data.brandName) && data.chapters.length > 0,
    warnings: [
      ...consistency.warnings,
      ...(!hasMeaningfulContent(data.brandName) ? ["Nom de marque manquant"] : []),
      ...(data.chapters.length === 0 ? ["Aucune section éditoriale exploitable"] : []),
    ],
  };
}

export function validateBrandGuideConsistency(data: BrandGuideData) {
  const serialized = JSON.stringify(data);
  const candidates = [...serialized.matchAll(/\b([A-ZÀ-Ý][A-Za-zÀ-ÿ'’-]+(?:\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ'’-]+)*\s+(?:Studio|Communication))\b/g)]
    .map((match) => compact(match[1]));
  const detectedBrandNames = Array.from(new Set([data.brandName, ...candidates]));
  const expected = normalized(data.brandName);
  const conflicts = detectedBrandNames.filter((name) => normalized(name) !== expected);
  if (data.logoUrl && normalized(data.logoOwner) !== expected) conflicts.push(`Logo (${data.logoOwner})`);
  return {
    valid: conflicts.length === 0,
    detectedBrandNames,
    conflicts,
    warnings: conflicts.map((name) => `Identité incohérente détectée : ${name}`),
  };
}
