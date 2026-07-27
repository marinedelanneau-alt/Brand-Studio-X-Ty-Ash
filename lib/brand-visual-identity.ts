import type { GeneratedBrandGuide, GuideColor, GuideMoodboardItem } from "./brand-guide";

export type BrandArtDirection =
  | "editorial-minimal"
  | "premium-editorial"
  | "creative-studio"
  | "organic-brand"
  | "luxury"
  | "bold"
  | "soft"
  | "warm"
  | "graphic"
  | "contemporary";

export type BrandVisualIdentity = {
  brandName: string;
  logo?: GeneratedBrandGuide["brandAssets"];
  colors: GuideColor[];
  typography: {
    displayFont: "Source Serif 4" | "Inter";
    headingFont: "Source Serif 4" | "Inter";
    bodyFont: "Inter" | "Source Serif 4";
  };
  moodboard: {
    items: GuideMoodboardItem[];
    images: GuideMoodboardItem[];
    icons: GuideMoodboardItem[];
    keywords: string[];
    background: string;
  };
  visualKeywords: string[];
  graphicElements: string[];
  personalityTraits: string[];
  tone: string;
  ambiance: string;
};

export type BrandGuideTheme = {
  direction: BrandArtDirection;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    mutedText: string;
    border: string;
  };
  typography: BrandVisualIdentity["typography"] & {
    displayScale: number;
    headingWeight: 400 | 600;
    bodyWeight: 400 | 600;
  };
  layout: {
    density: "airy" | "balanced" | "dense";
    alignment: "left" | "centered" | "mixed";
    geometry: "soft" | "structured" | "organic" | "editorial";
    imageStyle: "fullBleed" | "framed" | "collage" | "minimal";
    useAsymmetry: boolean;
    cornerRadius: number;
    lineWidth: number;
  };
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return { r: 255, g: 255, b: 255 };
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function getContrastRatio(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

export function getAccessibleTextColor(background: string) {
  return getContrastRatio("#171419", background) >= getContrastRatio("#FFFFFF", background)
    ? "#171419"
    : "#FFFFFF";
}

function mix(color: string, target: string, amount: number) {
  const source = hexToRgb(color);
  const destination = hexToRgb(target);
  const ratio = Math.max(0, Math.min(amount, 1));
  const value = [source.r, source.g, source.b]
    .map((component, index) => {
      const targetComponent = [destination.r, destination.g, destination.b][index];
      return Math.round(component + (targetComponent - component) * ratio)
        .toString(16)
        .padStart(2, "0");
    })
    .join("");
  return `#${value.toUpperCase()}`;
}

export const generateTint = (color: string, percentage: number) =>
  mix(color, "#FFFFFF", percentage / 100);

export const generateShade = (color: string, percentage: number) =>
  mix(color, "#000000", percentage / 100);

function meaningful(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

export function buildBrandVisualIdentity(guide: GeneratedBrandGuide): BrandVisualIdentity {
  const colors = [...guide.visualUniverse.palette.primary, ...guide.visualUniverse.palette.secondary]
    .filter((color) => /^#[0-9a-f]{6}$/i.test(color.hex));
  const items = guide.visualUniverse.moodboard.filter((item) => {
    if (item.type === "image" || item.type === "icon") return Boolean(item.imageUrl);
    return Boolean(item.label.trim() || item.color);
  });
  const keywords = items
    .filter((item) => item.type === "keyword" || item.type === "text")
    .map((item) => item.label.trim())
    .filter(Boolean);
  const signals = normalize([
    guide.visualUniverse.ambiance,
    guide.visualUniverse.graphicElements,
    guide.personality.traits.join(" "),
    guide.personality.tone,
    keywords.join(" "),
  ].join(" "));
  const serifLed = /(premium|elegan|raffin|luxe|sensible|doux|chaleur|humain|nature)/.test(signals);

  return {
    brandName: guide.brandName.trim(),
    logo: guide.brandAssets.logoUrl ? guide.brandAssets : undefined,
    colors,
    typography: {
      displayFont: serifLed ? "Source Serif 4" : "Inter",
      headingFont: serifLed ? "Source Serif 4" : "Inter",
      bodyFont: "Inter",
    },
    moodboard: {
      items,
      images: items.filter((item) => item.type === "image"),
      icons: items.filter((item) => item.type === "icon"),
      keywords,
      background: guide.visualUniverse.moodboardBackground,
    },
    visualKeywords: meaningful(keywords),
    graphicElements: meaningful(guide.visualUniverse.graphicElements.split(/[,·|]/)),
    personalityTraits: meaningful(guide.personality.traits),
    tone: guide.personality.tone.trim(),
    ambiance: guide.visualUniverse.ambiance.trim(),
  };
}

export function selectBrandGuideArtDirection(identity: BrandVisualIdentity): BrandArtDirection {
  const signal = normalize([
    identity.ambiance,
    identity.tone,
    identity.personalityTraits.join(" "),
    identity.visualKeywords.join(" "),
    identity.graphicElements.join(" "),
  ].join(" "));
  if (/(luxe|luxury|prestige|exclusif)/.test(signal)) return "luxury";
  if (/(premium|raffin|elegan|minimal)/.test(signal)) return "premium-editorial";
  if (/(audac|vif|impact|puissant|energie)/.test(signal)) return "bold";
  if (/(creatif|expressif|collage|artist|original)/.test(signal)) return "creative-studio";
  if (/(nature|organique|vegetal|matiere|artisanal)/.test(signal)) return "organic-brand";
  if (/(doux|delicat|sensible|apais|subtil)/.test(signal)) return "soft";
  if (/(chaleur|solaire|convivial|proche|humain)/.test(signal)) return "warm";
  if (/(graphique|geometri|contraste|typograph)/.test(signal)) return "graphic";
  if (/(structure|precis|rigueur|fiable|method)/.test(signal)) return "contemporary";
  return "editorial-minimal";
}

function colorByRole(colors: GuideColor[], role: string) {
  return colors.find((color) => normalize(`${color.name} ${color.usage}`).includes(role))?.hex;
}

function darkest(colors: string[]) {
  return colors.slice().sort((a, b) => luminance(a) - luminance(b))[0];
}

function lightest(colors: string[]) {
  return colors.slice().sort((a, b) => luminance(b) - luminance(a))[0];
}

export function createBrandGuideTheme(identity: BrandVisualIdentity): BrandGuideTheme {
  const direction = selectBrandGuideArtDirection(identity);
  const values = identity.colors.map((color) => color.hex);
  const primary = colorByRole(identity.colors, "princip") || values[0] || "#343038";
  const secondary = colorByRole(identity.colors, "second") || values[1] || generateTint(primary, 60);
  const accent = colorByRole(identity.colors, "accent") || values[2] || primary;
  const candidateBackground = colorByRole(identity.colors, "fond") || lightest(values) || "#F7F5F1";
  const background = luminance(candidateBackground) > 0.72
    ? candidateBackground
    : generateTint(candidateBackground, 88);
  const dark = darkest(values) || "#242127";
  const text = getContrastRatio(dark, background) >= 4.5 ? dark : "#171419";
  const softDirections = new Set<BrandArtDirection>(["organic-brand", "soft", "warm"]);
  const boldDirections = new Set<BrandArtDirection>(["bold", "graphic", "creative-studio"]);
  const premiumDirections = new Set<BrandArtDirection>(["luxury", "premium-editorial"]);

  return {
    direction,
    colors: {
      background,
      surface: generateTint(background, 45),
      primary,
      secondary,
      accent,
      text,
      mutedText: mix(text, background, 42 / 100),
      border: mix(text, background, 78 / 100),
    },
    typography: {
      ...identity.typography,
      displayScale: boldDirections.has(direction) ? 1.12 : premiumDirections.has(direction) ? 1.06 : 1,
      headingWeight: boldDirections.has(direction) ? 600 : 400,
      bodyWeight: direction === "contemporary" ? 600 : 400,
    },
    layout: {
      density: premiumDirections.has(direction) || direction === "editorial-minimal" ? "airy" : boldDirections.has(direction) ? "dense" : "balanced",
      alignment: boldDirections.has(direction) ? "mixed" : premiumDirections.has(direction) ? "centered" : "left",
      geometry: softDirections.has(direction) ? "organic" : boldDirections.has(direction) ? "structured" : premiumDirections.has(direction) ? "editorial" : "soft",
      imageStyle: direction === "creative-studio" ? "collage" : boldDirections.has(direction) ? "fullBleed" : premiumDirections.has(direction) ? "minimal" : "framed",
      useAsymmetry: boldDirections.has(direction) || direction === "organic-brand",
      cornerRadius: softDirections.has(direction) ? 18 : premiumDirections.has(direction) ? 0 : 4,
      lineWidth: boldDirections.has(direction) ? 4 : 1,
    },
  };
}

export const createPdfThemeFromBrandPalette = createBrandGuideTheme;
export const createTint = generateTint;
export const createShade = generateShade;
export const getRelativeLuminance = luminance;
