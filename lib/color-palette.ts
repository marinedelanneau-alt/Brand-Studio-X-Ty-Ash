export type ColorPaletteMode = "solid" | "gradient";
export type GradientDirection = "horizontal" | "vertical" | "diagonal";
export type ColorPaletteBucket = "primary" | "secondary";

export type ColorPaletteExample = {
  id: string;
  name: string;
  hex: string;
  usage: string;
  type: ColorPaletteBucket;
};

export type ColorPaletteConfig = {
  allowGradient: boolean;
  allowColorPicker: boolean;
  allowHexInput: boolean;
  allowEyeDropper: boolean;
  maxPrimaryColors: number;
  maxSecondaryColors: number;
  requireUsage: boolean;
  enableColorMeaningHelper: boolean;
  defaultMode: ColorPaletteMode;
  helperText: string;
  exampleColors: ColorPaletteExample[];
};

export type SolidPaletteColor = {
  id: string;
  mode: "solid";
  name: string;
  hex: string;
  usage: string;
};

export type GradientPaletteColor = {
  id: string;
  mode: "gradient";
  name: string;
  from: string;
  to: string;
  direction: GradientDirection;
  usage: string;
};

export type PaletteColor = SolidPaletteColor | GradientPaletteColor;

export type ColorPaletteAnswer = {
  type: "color_palette";
  primaryColors: PaletteColor[];
  secondaryColors: PaletteColor[];
};

const COLOR_PALETTE_CONFIG_PREFIX = "__color_palette_config__:";
const COLOR_PALETTE_ANSWER_PREFIX = "__color_palette_answer__:";

const DEFAULT_HELPER_TEXT =
  "Compose une palette principale et secondaire, puis precise l'usage de chaque couleur.";

const DEFAULT_EXAMPLES: ColorPaletteExample[] = [
  {
    id: "example-beige-chaud",
    name: "Beige chaud",
    hex: "#EFE8D0",
    usage: "Fond principal / ambiance douce",
    type: "primary",
  },
  {
    id: "example-noir-profond",
    name: "Noir profond",
    hex: "#1F1A17",
    usage: "Texte / contraste / signature",
    type: "primary",
  },
  {
    id: "example-jaune-accent",
    name: "Jaune accent",
    hex: "#F3C447",
    usage: "Accent / bouton / details",
    type: "secondary",
  },
  {
    id: "example-vert-doux",
    name: "Vert doux",
    hex: "#A7C4A0",
    usage: "Respiration visuelle / repere secondaire",
    type: "secondary",
  },
];

export function getDefaultColorPaletteConfig(): ColorPaletteConfig {
  return {
    allowGradient: true,
    allowColorPicker: true,
    allowHexInput: true,
    allowEyeDropper: true,
    maxPrimaryColors: 4,
    maxSecondaryColors: 6,
    requireUsage: true,
    enableColorMeaningHelper: true,
    defaultMode: "solid",
    helperText: DEFAULT_HELPER_TEXT,
    exampleColors: DEFAULT_EXAMPLES,
  };
}

export function normalizeColorPaletteConfig(
  rawConfig: Partial<ColorPaletteConfig> | null | undefined,
): ColorPaletteConfig {
  const fallback = getDefaultColorPaletteConfig();

  return {
    allowGradient: rawConfig?.allowGradient ?? fallback.allowGradient,
    allowColorPicker: rawConfig?.allowColorPicker ?? fallback.allowColorPicker,
    allowHexInput: rawConfig?.allowHexInput ?? fallback.allowHexInput,
    allowEyeDropper: rawConfig?.allowEyeDropper ?? fallback.allowEyeDropper,
    maxPrimaryColors: normalizeBoundedInteger(rawConfig?.maxPrimaryColors, 4, 1, 8),
    maxSecondaryColors: normalizeBoundedInteger(rawConfig?.maxSecondaryColors, 6, 1, 12),
    requireUsage: rawConfig?.requireUsage ?? fallback.requireUsage,
    enableColorMeaningHelper:
      rawConfig?.enableColorMeaningHelper ?? fallback.enableColorMeaningHelper,
    defaultMode: rawConfig?.defaultMode === "gradient" ? "gradient" : "solid",
    helperText:
      typeof rawConfig?.helperText === "string" && rawConfig.helperText.trim()
        ? rawConfig.helperText.trim()
        : fallback.helperText,
    exampleColors: normalizeExampleColors(rawConfig?.exampleColors),
  };
}

export function getSerializedColorPaletteOptions(config: ColorPaletteConfig) {
  return [
    `${COLOR_PALETTE_CONFIG_PREFIX}${encodeURIComponent(
      JSON.stringify(normalizeColorPaletteConfig(config)),
    )}`,
  ];
}

export function parseStoredColorPaletteConfig(rawOptions: string[]) {
  const rawConfig = rawOptions.find((option) =>
    option.startsWith(COLOR_PALETTE_CONFIG_PREFIX),
  );

  if (!rawConfig) {
    return getDefaultColorPaletteConfig();
  }

  try {
    return normalizeColorPaletteConfig(
      JSON.parse(
        decodeURIComponent(rawConfig.slice(COLOR_PALETTE_CONFIG_PREFIX.length)),
      ) as Partial<ColorPaletteConfig>,
    );
  } catch {
    return getDefaultColorPaletteConfig();
  }
}

export function isColorPaletteOptions(rawOptions: string[]) {
  return rawOptions.some((option) => option.startsWith(COLOR_PALETTE_CONFIG_PREFIX));
}

export function createEmptyPaletteColor(mode: ColorPaletteMode = "solid"): PaletteColor {
  return mode === "gradient"
    ? {
        id: crypto.randomUUID(),
        mode: "gradient",
        name: "",
        from: "#EFE8D0",
        to: "#F3C447",
        direction: "horizontal",
        usage: "",
      }
    : {
        id: crypto.randomUUID(),
        mode: "solid",
        name: "",
        hex: "#EFE8D0",
        usage: "",
      };
}

export function getDefaultColorPaletteAnswer(): ColorPaletteAnswer {
  return {
    type: "color_palette",
    primaryColors: [],
    secondaryColors: [],
  };
}

export function serializeColorPaletteAnswer(answer: ColorPaletteAnswer) {
  return `${COLOR_PALETTE_ANSWER_PREFIX}${encodeURIComponent(
    JSON.stringify(normalizeColorPaletteAnswer(answer)),
  )}`;
}

export function parseStoredColorPaletteAnswer(rawValues: string[]) {
  const rawAnswer = rawValues.find((value) => value.startsWith(COLOR_PALETTE_ANSWER_PREFIX));

  if (!rawAnswer) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      decodeURIComponent(rawAnswer.slice(COLOR_PALETTE_ANSWER_PREFIX.length)),
    ) as Partial<ColorPaletteAnswer>;

    if (parsed.type !== "color_palette") {
      return null;
    }

    return normalizeColorPaletteAnswer(parsed);
  } catch {
    return null;
  }
}

export function buildColorPaletteAnswer(input: {
  primaryColors: PaletteColor[];
  secondaryColors: PaletteColor[];
}) {
  return normalizeColorPaletteAnswer({
    type: "color_palette",
    primaryColors: input.primaryColors,
    secondaryColors: input.secondaryColors,
  });
}

export function isColorPaletteComplete(
  answer: ColorPaletteAnswer | null,
  config: ColorPaletteConfig,
) {
  if (!answer) {
    return false;
  }

  if (answer.primaryColors.length === 0) {
    return false;
  }

  return [...answer.primaryColors, ...answer.secondaryColors].every((color) =>
    isPaletteColorComplete(color, config.requireUsage),
  );
}

export function isPaletteColorComplete(color: PaletteColor, requireUsage: boolean) {
  if (!color.name.trim()) {
    return false;
  }

  if (requireUsage && !color.usage.trim()) {
    return false;
  }

  if (color.mode === "gradient") {
    return isValidHexColor(color.from) && isValidHexColor(color.to);
  }

  return isValidHexColor(color.hex);
}

export function getPaletteColorCss(color: PaletteColor) {
  return color.mode === "gradient"
    ? buildGradientCss(color.from, color.to, color.direction)
    : normalizeHexColor(color.hex) ?? "#EFE8D0";
}

export function buildGradientCss(
  from: string,
  to: string,
  direction: GradientDirection,
) {
  const angle =
    direction === "vertical" ? "180deg" : direction === "diagonal" ? "135deg" : "90deg";

  return `linear-gradient(${angle}, ${normalizeHexColor(from) ?? "#EFE8D0"}, ${
    normalizeHexColor(to) ?? "#F3C447"
  })`;
}

export function normalizeHexColor(input: string | null | undefined) {
  const value = String(input ?? "").trim();
  const hex = value.startsWith("#") ? value.slice(1) : value;

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex
      .split("")
      .map((character) => `${character}${character}`)
      .join("")
      .toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toUpperCase()}`;
  }

  return null;
}

export function isValidHexColor(input: string | null | undefined) {
  return normalizeHexColor(input) !== null;
}

export function suggestColorMeaning(input: string) {
  const normalizedHex = normalizeHexColor(input);

  if (!normalizedHex) {
    return "";
  }

  const { hue, saturation, lightness } = hexToHsl(normalizedHex);

  if (lightness < 12) {
    return "Cette couleur peut evoquer l'elegance, l'autorite et un contraste assume.";
  }

  if (saturation < 10 && lightness > 80) {
    return "Cette couleur peut evoquer la douceur, l'air, la simplicite et un premium discret.";
  }

  if (hue >= 35 && hue <= 55) {
    return "Cette couleur peut evoquer l'energie, la chaleur et la creativite.";
  }

  if (hue >= 190 && hue <= 240) {
    return "Cette couleur peut evoquer la confiance, la structure et le calme.";
  }

  if (hue >= 80 && hue <= 165) {
    return "Cette couleur peut evoquer le naturel, l'equilibre et l'apaisement.";
  }

  if ((hue >= 330 || hue <= 15) && saturation < 35 && lightness > 75) {
    return "Cette couleur peut evoquer la douceur, la proximite et une sensibilite editoriale.";
  }

  if ((hue >= 18 && hue <= 38) && saturation < 35 && lightness > 70) {
    return "Cette couleur peut evoquer la douceur, le naturel et un premium discret.";
  }

  if (hue >= 300 || hue <= 330) {
    return "Cette couleur peut evoquer l'emotion, la singularite et la proximite.";
  }

  return "Cette couleur peut evoquer une presence forte. Precise ensuite son usage pour clarifier son role dans la marque.";
}

function normalizeColorPaletteAnswer(
  rawAnswer: Partial<ColorPaletteAnswer> | ColorPaletteAnswer,
): ColorPaletteAnswer {
  return {
    type: "color_palette",
    primaryColors: normalizePaletteColors(rawAnswer.primaryColors),
    secondaryColors: normalizePaletteColors(rawAnswer.secondaryColors),
  };
}

function normalizePaletteColors(rawColors: unknown) {
  if (!Array.isArray(rawColors)) {
    return [] as PaletteColor[];
  }

  return rawColors
    .map((rawColor) => normalizePaletteColor(rawColor))
    .filter((color): color is PaletteColor => color !== null);
}

function normalizePaletteColor(rawColor: unknown) {
  if (!rawColor || typeof rawColor !== "object") {
    return null;
  }

  const item = rawColor as Partial<PaletteColor> & {
    hex?: string;
    from?: string;
    to?: string;
    direction?: GradientDirection;
  };

  const name = typeof item.name === "string" ? item.name.trim() : "";
  const usage = typeof item.usage === "string" ? item.usage.trim() : "";
  const id =
    typeof item.id === "string" && item.id.trim() ? item.id : crypto.randomUUID();

  if (item.mode === "gradient") {
    return {
      id,
      mode: "gradient",
      name,
      from: normalizeHexColor(item.from) ?? "#EFE8D0",
      to: normalizeHexColor(item.to) ?? "#F3C447",
      direction: normalizeGradientDirection(item.direction),
      usage,
    } satisfies GradientPaletteColor;
  }

  return {
    id,
    mode: "solid",
    name,
    hex: normalizeHexColor(item.hex) ?? "#EFE8D0",
    usage,
  } satisfies SolidPaletteColor;
}

function normalizeExampleColors(rawExamples: unknown) {
  if (!Array.isArray(rawExamples)) {
    return DEFAULT_EXAMPLES;
  }

  const normalizedExamples = rawExamples
    .map((rawExample) => {
      if (!rawExample || typeof rawExample !== "object") {
        return null;
      }

      const item = rawExample as Partial<ColorPaletteExample>;
      const hex = normalizeHexColor(item.hex);

      if (!hex) {
        return null;
      }

      return {
        id:
          typeof item.id === "string" && item.id.trim()
            ? item.id
            : crypto.randomUUID(),
        name: typeof item.name === "string" ? item.name.trim() : "",
        hex,
        usage: typeof item.usage === "string" ? item.usage.trim() : "",
        type: item.type === "secondary" ? "secondary" : "primary",
      } satisfies ColorPaletteExample;
    })
    .filter((example): example is ColorPaletteExample => example !== null);

  return normalizedExamples.length > 0 ? normalizedExamples : DEFAULT_EXAMPLES;
}

function normalizeGradientDirection(value: unknown): GradientDirection {
  if (value === "vertical" || value === "diagonal") {
    return value;
  }

  return "horizontal";
}

function normalizeBoundedInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(numericValue), min), max);
}

function hexToHsl(hexColor: string) {
  const hex = hexColor.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }

    hue *= 60;
  }

  return {
    hue: Math.round(hue),
    saturation: Math.round(saturation * 100),
    lightness: Math.round(lightness * 100),
  };
}
