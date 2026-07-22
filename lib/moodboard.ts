export type MoodboardLayoutStyle = "editorial" | "minimal" | "collage" | "grid" | "bold";

export type MoodboardBlockBase = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  zIndex: number;
  styleVariant?: string;
};

export type MoodboardImageBlock = MoodboardBlockBase & {
  type: "image";
  imageUrl: string;
  caption: string;
  altText: string;
  cropX: number;
  cropY: number;
};

export type MoodboardColorBlock = MoodboardBlockBase & {
  type: "color";
  color: string;
  label: string;
  usage: string;
};

export type MoodboardTextBlock = MoodboardBlockBase & {
  type: "text";
  text: string;
  author: string;
  textColor: string;
  fontSize: number;
};

export type MoodboardKeywordBlock = MoodboardBlockBase & {
  type: "keyword";
  keyword: string;
  textColor: string;
  fontSize: number;
};

export type MoodboardIconName = "spark" | "star" | "leaf" | "circle" | "wave";

export type MoodboardIconBlock = MoodboardBlockBase & {
  type: "icon";
  icon: MoodboardIconName;
  label: string;
  color: string;
  imageUrl?: string;
  altText?: string;
};

export type MoodboardBlock =
  | MoodboardImageBlock
  | MoodboardColorBlock
  | MoodboardTextBlock
  | MoodboardKeywordBlock
  | MoodboardIconBlock;

export type MoodboardAnswer = {
  type: "moodboard";
  version: 2;
  layoutStyle: MoodboardLayoutStyle;
  backgroundColor: string;
  ambiance: string;
  feedback: string;
  blocks: MoodboardBlock[];
};

export type MoodboardGenerationInput = {
  palette: string[];
  keywords: string[];
  persona: string;
  quote?: string;
  style?: MoodboardLayoutStyle;
  maxImages?: number;
};

export type MoodboardSlotType = "image" | "text" | "color";

export type MoodboardTemplateSlot = {
  id: string;
  type: MoodboardSlotType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  defaultText?: string;
  label?: string;
  usage?: string;
};

export type MoodboardTemplate = {
  id: string;
  name: string;
  preview_image: string;
  layoutType: "editorial" | "minimal" | "collage" | "grid";
  background: {
    type: "color";
    value: string;
  };
  slots: MoodboardTemplateSlot[];
};

export const MOODBOARD_TEMPLATES: MoodboardTemplate[] = [
  {
    id: "editorial_collage_01",
    name: "Collage éditorial",
    preview_image: "",
    layoutType: "collage",
    background: { type: "color", value: "#EFE8D0" },
    slots: [
      { id: "image_1", type: "image", x: 6, y: 8, width: 34, height: 34, rotation: -4 },
      { id: "image_2", type: "image", x: 42, y: 8, width: 32, height: 26, rotation: 3 },
      { id: "text_1", type: "text", x: 76, y: 38, width: 18, height: 12, rotation: 0, defaultText: "Ton univers en quelques mots" },
      { id: "color_1", type: "color", x: 8, y: 72, width: 12, height: 10, rotation: 0, label: "Accent", usage: "Ton principal" },
    ],
  },
  {
    id: "minimalist_moodboard_01",
    name: "Moodboard minimaliste",
    preview_image: "",
    layoutType: "minimal",
    background: { type: "color", value: "#F6EFE4" },
    slots: [
      { id: "image_1", type: "image", x: 6, y: 8, width: 44, height: 24, rotation: 0 },
      { id: "image_2", type: "image", x: 52, y: 8, width: 44, height: 24, rotation: 0 },
      { id: "text_1", type: "text", x: 6, y: 36, width: 42, height: 16, rotation: 0, defaultText: "Clair, doux, structuré" },
      { id: "color_1", type: "color", x: 52, y: 36, width: 20, height: 18, rotation: 0, label: "Palette", usage: "Tons clés" },
      { id: "image_3", type: "image", x: 74, y: 36, width: 22, height: 24, rotation: 0 },
    ],
  },
  {
    id: "grid_moodboard_01",
    name: "Moodboard grille propre",
    preview_image: "",
    layoutType: "grid",
    background: { type: "color", value: "#F8F1E7" },
    slots: [
      { id: "image_1", type: "image", x: 6, y: 6, width: 29, height: 24, rotation: 0 },
      { id: "image_2", type: "image", x: 36, y: 6, width: 28, height: 24, rotation: 0 },
      { id: "image_3", type: "image", x: 67, y: 6, width: 29, height: 24, rotation: 0 },
      { id: "text_1", type: "text", x: 6, y: 36, width: 29, height: 14, rotation: 0, defaultText: "Ambiance graphique" },
      { id: "color_1", type: "color", x: 36, y: 36, width: 28, height: 14, rotation: 0, label: "Accent", usage: "Couleur phare" },
      { id: "image_4", type: "image", x: 67, y: 36, width: 29, height: 14, rotation: 0 },
      { id: "text_2", type: "text", x: 6, y: 56, width: 29, height: 14, rotation: 0, defaultText: "Organisé et élégant" },
      { id: "image_5", type: "image", x: 36, y: 56, width: 28, height: 18, rotation: 0 },
      { id: "color_2", type: "color", x: 67, y: 56, width: 29, height: 18, rotation: 0, label: "Base", usage: "Fond" },
    ],
  },
];

export function getMoodboardTemplate(templateId: string) {
  return (
    MOODBOARD_TEMPLATES.find((template) => template.id === templateId) ??
    MOODBOARD_TEMPLATES[0]
  );
}

export function createMoodboardFromTemplate(
  template: MoodboardTemplate,
  signals: { palette: string[]; keywords: string[]; persona: string },
): MoodboardAnswer {
  const blocks: MoodboardBlock[] = template.slots.map((slot, index) => {
    if (slot.type === "image") {
      const keyword = signals.keywords[index % Math.max(signals.keywords.length, 1)] || "univers";
      const imageBlock = createGeneratedImageBlock({
        keyword,
        persona: signals.persona,
        palette: signals.palette,
        variant: index,
      });

      return {
        ...imageBlock,
        x: slot.x,
        y: slot.y,
        w: slot.width,
        h: slot.height,
        rotation: slot.rotation,
        zIndex: index + 1,
      };
    }

    if (slot.type === "color") {
      return {
        id: `mood-color-${crypto.randomUUID()}`,
        type: "color",
        color: ensureHexColor(signals.palette[index % signals.palette.length] ?? template.background.value),
        label: slot.label ?? "Couleur",
        usage: slot.usage ?? "Accent",
        x: slot.x,
        y: slot.y,
        w: slot.width,
        h: slot.height,
        rotation: slot.rotation,
        zIndex: index + 1,
      };
    }

    return {
      id: `mood-text-${crypto.randomUUID()}`,
      type: "text",
      text: slot.defaultText ?? signals.keywords[index % Math.max(signals.keywords.length, 1)] ?? "Ton univers",
      author: signals.persona || "Brand Studio",
      textColor: "#4B4550",
      fontSize: 28,
      x: slot.x,
      y: slot.y,
      w: slot.width,
      h: slot.height,
      rotation: slot.rotation,
      zIndex: index + 1,
    };
  });

  return {
    type: "moodboard",
    version: 2,
    layoutStyle: template.layoutType,
    backgroundColor: template.background.value,
    ambiance: "",
    feedback: "",
    blocks,
  };
}

const MOODBOARD_PREFIX = "__moodboard__:";
const DEFAULT_STYLE: MoodboardLayoutStyle = "editorial";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function ensureHexColor(value: string, fallback = "#E8DCCB") {
  const normalized = value.trim().toUpperCase();

  if (/^#[0-9A-F]{6}$/.test(normalized)) {
    return normalized;
  }

  return fallback;
}

function createBlockId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeRotation(rotation: number) {
  return clamp(Number.isFinite(rotation) ? rotation : 0, -7, 7);
}

function getStyleFrames(style: MoodboardLayoutStyle) {
  const frames = {
    editorial: [
      { x: 4, y: 4, w: 40, h: 32, rotation: -3 },
      { x: 47, y: 4, w: 49, h: 22, rotation: 2 },
      { x: 47, y: 29, w: 23, h: 23, rotation: -2 },
      { x: 72, y: 29, w: 24, h: 33, rotation: 3 },
      { x: 4, y: 39, w: 40, h: 24, rotation: 1 },
      { x: 4, y: 66, w: 26, h: 18, rotation: -1 },
      { x: 33, y: 66, w: 30, h: 18, rotation: 1 },
      { x: 66, y: 66, w: 30, h: 18, rotation: -2 },
    ],
    minimal: [
      { x: 4, y: 4, w: 44, h: 24, rotation: 0 },
      { x: 52, y: 4, w: 44, h: 24, rotation: 0 },
      { x: 4, y: 31, w: 29, h: 24, rotation: 0 },
      { x: 36, y: 31, w: 28, h: 24, rotation: 0 },
      { x: 67, y: 31, w: 29, h: 24, rotation: 0 },
      { x: 4, y: 58, w: 44, h: 24, rotation: 0 },
      { x: 52, y: 58, w: 44, h: 24, rotation: 0 },
    ],
    collage: [
      { x: 6, y: 6, w: 34, h: 30, rotation: -5 },
      { x: 34, y: 4, w: 30, h: 26, rotation: 4 },
      { x: 62, y: 7, w: 30, h: 34, rotation: -4 },
      { x: 11, y: 34, w: 28, h: 24, rotation: 3 },
      { x: 41, y: 29, w: 38, h: 26, rotation: -2 },
      { x: 63, y: 43, w: 28, h: 23, rotation: 4 },
      { x: 6, y: 60, w: 30, h: 20, rotation: -3 },
      { x: 35, y: 61, w: 26, h: 18, rotation: 2 },
      { x: 62, y: 69, w: 28, h: 14, rotation: -1 },
    ],
    grid: [
      { x: 4, y: 4, w: 29, h: 24, rotation: 0 },
      { x: 36, y: 4, w: 28, h: 24, rotation: 0 },
      { x: 67, y: 4, w: 29, h: 24, rotation: 0 },
      { x: 4, y: 31, w: 29, h: 24, rotation: 0 },
      { x: 36, y: 31, w: 28, h: 24, rotation: 0 },
      { x: 67, y: 31, w: 29, h: 24, rotation: 0 },
      { x: 4, y: 58, w: 29, h: 24, rotation: 0 },
      { x: 36, y: 58, w: 28, h: 24, rotation: 0 },
      { x: 67, y: 58, w: 29, h: 24, rotation: 0 },
    ],
    bold: [
      { x: 4, y: 4, w: 58, h: 44, rotation: -2 },
      { x: 65, y: 4, w: 31, h: 20, rotation: 2 },
      { x: 65, y: 27, w: 31, h: 21, rotation: -2 },
      { x: 4, y: 51, w: 28, h: 26, rotation: 3 },
      { x: 35, y: 51, w: 29, h: 26, rotation: -1 },
      { x: 67, y: 51, w: 29, h: 26, rotation: 2 },
      { x: 4, y: 80, w: 44, h: 10, rotation: 0 },
      { x: 52, y: 80, w: 44, h: 10, rotation: 0 },
    ],
  } satisfies Record<MoodboardLayoutStyle, Array<{ x: number; y: number; w: number; h: number; rotation: number }>>;

  return frames[style];
}

export function isMoodboardValue(value: string) {
  return value.startsWith(MOODBOARD_PREFIX);
}

export function getMoodboardImageCount(answer: MoodboardAnswer) {
  return answer.blocks.filter((block) => block.type === "image").length;
}

export function autoArrange(
  elements: MoodboardBlock[],
  style: MoodboardLayoutStyle,
): MoodboardBlock[] {
  const frames = getStyleFrames(style);

  return elements
    .slice()
    .sort((left, right) => left.zIndex - right.zIndex)
    .map((block, index) => {
      const frame = frames[index % frames.length];

      return {
        ...block,
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        rotation: normalizeRotation(frame.rotation),
        zIndex: index + 1,
      };
    });
}

function inferAmbiance(input: MoodboardGenerationInput) {
  const leadKeyword = input.keywords[0] ?? "éditorial";
  const persona = input.persona.trim();

  if (persona) {
    return `${persona}, ${leadKeyword} et cohérent`;
  }

  return `Univers ${leadKeyword}, cohérent et inspiré`;
}

function getLayoutDescriptor(style: MoodboardLayoutStyle) {
  switch (style) {
    case "minimal":
      return "calme, structurée et epuree";
    case "collage":
      return "creative, vibrante et libre";
    case "grid":
      return "ordonnee, lisible et methodique";
    case "bold":
      return "affirmée, graphique et intentionnelle";
    default:
      return "éditoriale, douce et premium";
  }
}

export function analyzeMoodboard(answer: MoodboardAnswer) {
  const descriptor = getLayoutDescriptor(answer.layoutStyle);
  const keywords = answer.blocks
    .flatMap((block) => {
      if (block.type === "keyword") return [block.keyword];
      if (block.type === "image") return [block.caption];
      if (block.type === "icon") return [block.label];
      return [];
    })
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, values) => values.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index)
    .slice(0, 3);
  const references = keywords.length > 0 ? `, guidée par ${keywords.join(", ")}` : "";
  const recommendation = answer.layoutStyle === "bold"
    ? "Privilégier les contrastes francs et des messages courts."
    : "Privilégier les compositions aérées et une typographie élégante.";

  return `Direction ${descriptor}${references}. ${recommendation}`;
}

function buildGeneratedImageSvg(input: {
  keyword: string;
  persona: string;
  palette: string[];
  variant: number;
}) {
  const palette = [
    ensureHexColor(input.palette[0] ?? "#EAD9C8"),
    ensureHexColor(input.palette[1] ?? "#CFA36A"),
    ensureHexColor(input.palette[2] ?? "#4E5D73"),
  ];
  const keyword = escapeSvgText(input.keyword || "Univers");
  const persona = escapeSvgText(input.persona || "Brand Studio");
  const shapeOffset = (input.variant % 5) * 18;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette[0]}" />
          <stop offset="52%" stop-color="${palette[1]}" />
          <stop offset="100%" stop-color="${palette[2]}" />
        </linearGradient>
        <radialGradient id="glow" cx="0.25" cy="0.25" r="0.7">
          <stop offset="0%" stop-color="rgba(255,255,255,0.88)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="900" height="1200" rx="44" fill="url(#bg)" />
      <rect x="56" y="56" width="788" height="1088" rx="38" fill="rgba(255,255,255,0.14)" />
      <circle cx="${210 + shapeOffset}" cy="260" r="180" fill="rgba(255,255,255,0.28)" />
      <circle cx="680" cy="${330 + shapeOffset}" r="150" fill="rgba(255,255,255,0.18)" />
      <path d="M110 ${860 - shapeOffset} C260 ${700 - shapeOffset}, 420 ${1020 - shapeOffset}, 760 ${860 - shapeOffset}" stroke="rgba(255,255,255,0.42)" stroke-width="18" fill="none" stroke-linecap="round" />
      <rect x="92" y="92" width="716" height="128" rx="28" fill="rgba(255,248,240,0.78)" />
      <text x="132" y="160" font-family="Georgia, serif" font-size="68" fill="#3D342C">${keyword}</text>
      <text x="136" y="210" font-family="Arial, sans-serif" font-size="22" letter-spacing="4" fill="#5F544A">${persona}</text>
      <rect x="92" y="980" width="250" height="94" rx="22" fill="rgba(255,255,255,0.86)" />
      <text x="126" y="1038" font-family="Arial, sans-serif" font-size="22" letter-spacing="4" fill="#6F645B">MOODBOARD</text>
      <circle cx="760" cy="1040" r="118" fill="rgba(255,255,255,0.18)" />
    </svg>
  `.trim();
}

function createGeneratedImageBlock(input: {
  keyword: string;
  persona: string;
  palette: string[];
  variant: number;
}): MoodboardImageBlock {
  return {
    id: createBlockId("mood-image"),
    type: "image",
    imageUrl: toDataUri(buildGeneratedImageSvg(input)),
    caption: input.keyword,
    altText: input.keyword,
    cropX: 50,
    cropY: 50,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    rotation: 0,
    zIndex: input.variant + 1,
  };
}

function normalizeBlock(block: MoodboardBlock, index: number): MoodboardBlock {
  const base = {
    ...block,
    id: block.id || createBlockId(block.type),
    x: clamp(block.x, 0, 100),
    y: clamp(block.y, 0, 100),
    w: clamp(block.w, 10, 96),
    h: clamp(block.h, 8, 96),
    rotation: normalizeRotation(block.rotation),
    zIndex: Number.isFinite(block.zIndex) ? block.zIndex : index + 1,
  };

  if (block.type === "image") {
    return {
      ...base,
      type: "image",
      imageUrl: block.imageUrl,
      caption: block.caption ?? "",
      altText: block.altText ?? block.caption ?? "",
      cropX: clamp(block.cropX ?? 50, 0, 100),
      cropY: clamp(block.cropY ?? 50, 0, 100),
    };
  }

  if (block.type === "color") {
    return {
      ...base,
      type: "color",
      color: ensureHexColor(block.color),
      label: block.label ?? "",
      usage: block.usage ?? "",
    };
  }

  if (block.type === "text") {
    return {
      ...base,
      type: "text",
      text: block.text ?? "",
      author: block.author ?? "",
      textColor: ensureHexColor(block.textColor ?? "#4B4550", "#4B4550"),
      fontSize: clamp(block.fontSize ?? 28, 12, 72),
    };
  }

  if (block.type === "icon") {
    const icon = ["spark", "star", "leaf", "circle", "wave"].includes(block.icon)
      ? block.icon
      : "spark";

    return {
      ...base,
      type: "icon",
      icon: icon as MoodboardIconName,
      label: block.label ?? "Pictogramme",
      color: ensureHexColor(block.color, "#4B4550"),
      imageUrl: block.imageUrl ?? "",
      altText: block.altText ?? block.label ?? "Pictogramme",
    };
  }

  return {
    ...base,
    type: "keyword",
    keyword: block.keyword ?? "",
    textColor: ensureHexColor(block.textColor ?? "#4B4550", "#4B4550"),
    fontSize: clamp(block.fontSize ?? 18, 12, 72),
  };
}

export function getDefaultMoodboardAnswer(style: MoodboardLayoutStyle = DEFAULT_STYLE): MoodboardAnswer {
  return {
    type: "moodboard",
    version: 2,
    layoutStyle: style,
    backgroundColor: "#F5E8C8",
    ambiance: "",
    feedback: "",
    blocks: [],
  };
}

export function serializeMoodboardAnswer(answer: MoodboardAnswer) {
  return `${MOODBOARD_PREFIX}${JSON.stringify({
    ...answer,
    blocks: answer.blocks.map((block, index) => normalizeBlock(block, index)),
  })}`;
}

function isLegacyGeneratedImage(block: MoodboardBlock) {
  return block.type === "image" &&
    block.imageUrl.startsWith("data:image/svg+xml");
}

function removeLegacyGeneratedComposition(blocks: MoodboardBlock[]) {
  if (!blocks.some(isLegacyGeneratedImage)) {
    return blocks;
  }

  // Version 1 seeded a full decorative composition automatically. Keep only
  // genuine uploaded images; generated SVGs and their companion cards are not
  // user choices and should not be carried into the personal editor.
  return blocks.filter(
    (block) => block.type === "image" && !isLegacyGeneratedImage(block),
  );
}

export function parseStoredMoodboardAnswer(
  rawValues: string[],
  maxImages = 6,
): MoodboardAnswer {
  const storedValue = rawValues.find((value) => isMoodboardValue(value));

  if (storedValue) {
    try {
      const parsed = JSON.parse(storedValue.slice(MOODBOARD_PREFIX.length)) as Partial<MoodboardAnswer>;
      const layoutStyle =
        parsed.layoutStyle === "editorial" ||
        parsed.layoutStyle === "minimal" ||
        parsed.layoutStyle === "collage" ||
        parsed.layoutStyle === "grid" ||
        parsed.layoutStyle === "bold"
          ? parsed.layoutStyle
          : DEFAULT_STYLE;
      const normalizedBlocks = Array.isArray(parsed.blocks)
        ? parsed.blocks
            .filter((block): block is MoodboardBlock => !!block && typeof block === "object")
            .map((block, index) => normalizeBlock(block, index))
        : [];
      const migratedGeneratedComposition = normalizedBlocks.some(isLegacyGeneratedImage);
      const blocks = removeLegacyGeneratedComposition(normalizedBlocks);

      const answer = {
        type: "moodboard",
        version: 2,
        layoutStyle,
        backgroundColor: ensureHexColor(parsed.backgroundColor ?? "#F5E8C8", "#F5E8C8"),
        ambiance: migratedGeneratedComposition
          ? ""
          : typeof parsed.ambiance === "string" ? parsed.ambiance : "",
        feedback: migratedGeneratedComposition
          ? ""
          : typeof parsed.feedback === "string" ? parsed.feedback : "",
        blocks,
      } satisfies MoodboardAnswer;

      return {
        ...answer,
        feedback: answer.feedback || (answer.blocks.length > 0 ? analyzeMoodboard(answer) : ""),
      };
    } catch {
      return getDefaultMoodboardAnswer();
    }
  }

  const legacyUrls = rawValues
    .filter(
      (value) =>
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("/") ||
        value.startsWith("data:image/"),
    )
    .slice(0, maxImages);

  if (legacyUrls.length === 0) {
    return getDefaultMoodboardAnswer();
  }

  const blocks = autoArrange(
    legacyUrls.map((imageUrl, index) => ({
      id: createBlockId("mood-image"),
      type: "image" as const,
      imageUrl,
      caption: `Inspiration ${index + 1}`,
      altText: `Inspiration ${index + 1}`,
      cropX: 50,
      cropY: 50,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      rotation: 0,
      zIndex: index + 1,
    })),
    DEFAULT_STYLE,
  );
  const answer = {
    type: "moodboard",
    version: 2,
    layoutStyle: DEFAULT_STYLE,
    backgroundColor: "#F5E8C8",
    ambiance: "",
    feedback: "",
    blocks,
  } satisfies MoodboardAnswer;

  return {
    ...answer,
    feedback: analyzeMoodboard(answer),
  };
}

export function isMoodboardComplete(answer: MoodboardAnswer) {
  return answer.blocks.length > 0;
}

export function createSuggestedMoodboardImages(
  input: MoodboardGenerationInput,
  count = 6,
) {
  const keywords =
    input.keywords.length > 0
      ? input.keywords
      : ["texture", "lumière", "matière", "contraste", "cadence", "atmosphere"];

  return Array.from({ length: count }, (_, index) =>
    createGeneratedImageBlock({
      keyword: keywords[index % keywords.length] ?? `univers ${index + 1}`,
      persona: input.persona,
      palette: input.palette,
      variant: index,
    }),
  );
}

export function generateMoodboard(input: MoodboardGenerationInput): MoodboardAnswer {
  const style = input.style ?? DEFAULT_STYLE;
  const maxImages = clamp(input.maxImages ?? 5, 4, 6);
  const uniqueKeywords = Array.from(
    new Set(
      input.keywords
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  );
  const seededKeywords =
    uniqueKeywords.length > 0
      ? uniqueKeywords
      : ["éditorial", "lumière", "matière", "équilibre", "présence", "raffinement"];
  const imageKeywords = seededKeywords.slice(0, maxImages);
  const imageBlocks = imageKeywords.map((keyword, index) =>
    createGeneratedImageBlock({
      keyword,
      persona: input.persona,
      palette: input.palette,
      variant: index,
    }),
  );
  const secondaryColor = ensureHexColor(input.palette[1] ?? input.palette[0] ?? "#CFA36A");
  const accentColor = ensureHexColor(input.palette[0] ?? "#EFE6DA");
  const blocks = autoArrange(
    [
      ...imageBlocks,
      {
        id: createBlockId("mood-color"),
        type: "color" as const,
        color: accentColor,
        label: "Couleur ancre",
        usage: "Base de l'ambiance",
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        rotation: 0,
        zIndex: imageBlocks.length + 1,
      },
      {
        id: createBlockId("mood-keyword"),
        type: "keyword" as const,
        keyword: seededKeywords[0] ?? "présence",
        textColor: "#4B4550",
        fontSize: 18,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        rotation: 0,
        zIndex: imageBlocks.length + 2,
      },
      {
        id: createBlockId("mood-text"),
        type: "text" as const,
        text:
          input.quote?.trim() ||
          `Une direction ${seededKeywords[0] ?? "éditoriale"} portée par ${secondaryColor}.`,
        author: input.persona || "Brand Studio",
        textColor: "#4B4550",
        fontSize: 28,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        rotation: 0,
        zIndex: imageBlocks.length + 3,
      },
    ],
    style,
  );
  const answer = {
    type: "moodboard",
    version: 2,
    layoutStyle: style,
    backgroundColor: "#F5E8C8",
    ambiance: inferAmbiance(input),
    feedback: "",
    blocks,
  } satisfies MoodboardAnswer;

  return {
    ...answer,
    feedback: analyzeMoodboard(answer),
  };
}
