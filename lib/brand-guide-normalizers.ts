import { normalizeHexColor, parseStoredColorPaletteAnswer } from "./color-palette";

export type BrandValue = {
  id: string;
  name: string;
  meaning: string;
  concreteApplication: string;
  communicationExpression: string;
};

export type BrandColorRole = "primary" | "secondary" | "accent" | "background" | "text";
export type BrandColor = {
  id: string;
  name: string;
  hex: string;
  role?: BrandColorRole;
  usage?: string;
  order: number;
};

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const normalized = (value: unknown) => clean(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function valueFromObject(source: Record<string, unknown>, aliases: string[]) {
  const entry = Object.entries(source).find(([key]) => aliases.some((alias) => normalized(key).includes(alias)));
  return clean(entry?.[1]);
}

function rowFromObject(source: Record<string, unknown>, index: number): BrandValue | null {
  const name = valueFromObject(source, ["name", "nom", "valeur"]);
  const meaning = valueFromObject(source, ["meaning", "signifi", "sens"]);
  const concreteApplication = valueFromObject(source, ["concrete", "pratique", "traduit"]);
  const communicationExpression = valueFromObject(source, ["communication", "expression"]);
  if (![name, meaning, concreteApplication, communicationExpression].some(Boolean)) return null;
  return { id: clean(source.id) || `value-${index + 1}`, name, meaning, concreteApplication, communicationExpression };
}

function parseLabelledText(text: string): BrandValue[] {
  const rowPattern = /(?:^|\s*[·|]\s*|\n)\s*(?:\d+\s*[·.)-]\s*)?(Valeur|Sens|Cela signifie que je(?:…|\.\.\.)?|Ce que cela signifie|Dans la pratique|Concrètement(?:,\s*cela se traduit par(?:…|\.\.\.)?)?|Dans ma communication(?:,\s*cela donne(?:…|\.\.\.)?)?|Dans la communication)\s*:\s*/giu;
  const matches = [...text.matchAll(rowPattern)];
  const rows: BrandValue[] = [];
  let current: BrandValue | null = null;
  matches.forEach((match, index) => {
    const label = normalized(match[1]);
    const value = clean(text.slice((match.index ?? 0) + match[0].length, matches[index + 1]?.index ?? text.length));
    if (label === "valeur") {
      current = { id: `value-${rows.length + 1}`, name: value, meaning: "", concreteApplication: "", communicationExpression: "" };
      rows.push(current);
    } else if (current && (label.includes("signifi") || label === "sens")) current.meaning = value;
    else if (current && (label.includes("pratique") || label.includes("concret"))) current.concreteApplication = value;
    else if (current && label.includes("communication")) current.communicationExpression = value;
  });
  return rows;
}

export function normalizeBrandValuesFromExercise(rawAnswers: unknown): BrandValue[] {
  if (typeof rawAnswers === "string") return parseLabelledText(rawAnswers);
  if (!rawAnswers || typeof rawAnswers !== "object") return [];

  if (!Array.isArray(rawAnswers)) {
    const source = rawAnswers as Record<string, unknown>;
    const nested = source.rows ?? source.values ?? source.answers;
    if (nested) return normalizeBrandValuesFromExercise(nested);
    const indexed = Object.entries(source).sort(([a], [b]) => Number(a) - Number(b)).map(([, value]) => value);
    if (indexed.every((item) => item && typeof item === "object")) {
      return indexed.map((item, index) => rowFromObject(item as Record<string, unknown>, index)).filter((item): item is BrandValue => Boolean(item));
    }
    return rowFromObject(source, 0) ? [rowFromObject(source, 0)!] : [];
  }

  if (rawAnswers.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    return rawAnswers.map((item, index) => rowFromObject(item as Record<string, unknown>, index)).filter((item): item is BrandValue => Boolean(item));
  }
  if (rawAnswers.every(Array.isArray)) {
    return (rawAnswers as unknown[][]).map((row, index) => ({
      id: `value-${index + 1}`, name: clean(row[0]), meaning: clean(row[1]),
      concreteApplication: clean(row[2]), communicationExpression: clean(row[3]),
    })).filter((row) => [row.name, row.meaning, row.concreteApplication, row.communicationExpression].some(Boolean));
  }

  const flat = (rawAnswers as unknown[]).map(clean);
  if (flat.some((item) => /(?:^|\s)Valeur\s*:/iu.test(item))) return parseLabelledText(flat.join(" · "));
  return Array.from({ length: Math.ceil(flat.length / 4) }, (_, index) => ({
    id: `value-${index + 1}`, name: flat[index * 4] ?? "", meaning: flat[index * 4 + 1] ?? "",
    concreteApplication: flat[index * 4 + 2] ?? "", communicationExpression: flat[index * 4 + 3] ?? "",
  })).filter((row) => [row.name, row.meaning, row.concreteApplication, row.communicationExpression].some(Boolean));
}

export function normalizeBrandPalette(rawPaletteAnswers: unknown): BrandColor[] {
  const values = Array.isArray(rawPaletteAnswers) ? rawPaletteAnswers.map(clean) : [clean(rawPaletteAnswers)];
  const stored = parseStoredColorPaletteAnswer(values);
  const source = stored
    ? [
        ...stored.primaryColors.map((color) => ({ ...color, role: "primary" as const })),
        ...stored.secondaryColors.map((color, index) => ({ ...color, role: index === 0 ? "accent" as const : "secondary" as const })),
      ]
    : [];
  const seen = new Set<string>();
  return source.flatMap((color, order) => {
    if (color.mode !== "solid") return [];
    const hex = normalizeHexColor(color.hex);
    if (!hex || seen.has(hex)) return [];
    seen.add(hex);
    return [{ id: color.id || `color-${order + 1}`, name: clean(color.name), hex, role: color.role, usage: clean(color.usage), order }];
  });
}
