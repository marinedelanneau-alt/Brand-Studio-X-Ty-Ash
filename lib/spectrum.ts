export type SpectrumEffectType = "confetti" | "sparkle" | "pulse";
export type SpectrumEdgeTriggered = "left" | "right" | null;

export type SpectrumConfig = {
  leftLabel: string;
  rightLabel: string;
  leftEmoji: string;
  rightEmoji: string;
  defaultValue: number;
  helperText: string;
  enableJustification: boolean;
  requireJustification: boolean;
  enableEdgeEffect: boolean;
  edgeEffectType: SpectrumEffectType;
  edgeThreshold: number;
  leftEdgeMessage: string;
  rightEdgeMessage: string;
};

export type SpectrumAnswer = {
  type: "spectrum";
  leftLabel: string;
  rightLabel: string;
  leftEmoji: string;
  rightEmoji: string;
  score: number;
  interpretation: string;
  edgeTriggered: SpectrumEdgeTriggered;
  justification: string;
};

const SPECTRUM_CONFIG_PREFIX = "__spectrum_config__:";
const SPECTRUM_ANSWER_PREFIX = "__spectrum_answer__:";

export function getDefaultSpectrumConfig(): SpectrumConfig {
  return {
    leftLabel: "Sobre",
    rightLabel: "Expressif",
    leftEmoji: "🌿",
    rightEmoji: "🎨",
    defaultValue: 50,
    helperText: "Deplace le curseur pour situer ta marque.",
    enableJustification: true,
    requireJustification: false,
    enableEdgeEffect: true,
    edgeEffectType: "confetti",
    edgeThreshold: 10,
    leftEdgeMessage: "Ta marque assume une direction tres sobre.",
    rightEdgeMessage: "Ta marque assume une direction tres expressive.",
  };
}

export function normalizeSpectrumConfig(
  rawConfig: Partial<SpectrumConfig> | null | undefined,
): SpectrumConfig {
  const fallback = getDefaultSpectrumConfig();

  return {
    leftLabel:
      typeof rawConfig?.leftLabel === "string" && rawConfig.leftLabel.trim()
        ? rawConfig.leftLabel.trim()
        : fallback.leftLabel,
    rightLabel:
      typeof rawConfig?.rightLabel === "string" && rawConfig.rightLabel.trim()
        ? rawConfig.rightLabel.trim()
        : fallback.rightLabel,
    leftEmoji:
      typeof rawConfig?.leftEmoji === "string" ? rawConfig.leftEmoji.trim() : fallback.leftEmoji,
    rightEmoji:
      typeof rawConfig?.rightEmoji === "string"
        ? rawConfig.rightEmoji.trim()
        : fallback.rightEmoji,
    defaultValue: normalizeScore(rawConfig?.defaultValue, fallback.defaultValue),
    helperText:
      typeof rawConfig?.helperText === "string" && rawConfig.helperText.trim()
        ? rawConfig.helperText.trim()
        : fallback.helperText,
    enableJustification: rawConfig?.enableJustification ?? fallback.enableJustification,
    requireJustification: rawConfig?.requireJustification ?? fallback.requireJustification,
    enableEdgeEffect: rawConfig?.enableEdgeEffect ?? fallback.enableEdgeEffect,
    edgeEffectType: normalizeEffectType(rawConfig?.edgeEffectType),
    edgeThreshold: normalizeThreshold(rawConfig?.edgeThreshold, fallback.edgeThreshold),
    leftEdgeMessage:
      typeof rawConfig?.leftEdgeMessage === "string"
        ? rawConfig.leftEdgeMessage.trim()
        : fallback.leftEdgeMessage,
    rightEdgeMessage:
      typeof rawConfig?.rightEdgeMessage === "string"
        ? rawConfig.rightEdgeMessage.trim()
        : fallback.rightEdgeMessage,
  };
}

export function getSerializedSpectrumOptions(config: SpectrumConfig) {
  return [
    `${SPECTRUM_CONFIG_PREFIX}${encodeURIComponent(
      JSON.stringify(normalizeSpectrumConfig(config)),
    )}`,
  ];
}

export function parseStoredSpectrumConfig(rawOptions: string[]) {
  const rawConfig = rawOptions.find((option) => option.startsWith(SPECTRUM_CONFIG_PREFIX));

  if (!rawConfig) {
    return getDefaultSpectrumConfig();
  }

  try {
    return normalizeSpectrumConfig(
      JSON.parse(
        decodeURIComponent(rawConfig.slice(SPECTRUM_CONFIG_PREFIX.length)),
      ) as Partial<SpectrumConfig>,
    );
  } catch {
    return getDefaultSpectrumConfig();
  }
}

export function isSpectrumOptions(rawOptions: string[]) {
  return rawOptions.some((option) => option.startsWith(SPECTRUM_CONFIG_PREFIX));
}

export function serializeSpectrumAnswer(answer: SpectrumAnswer) {
  return `${SPECTRUM_ANSWER_PREFIX}${encodeURIComponent(JSON.stringify(answer))}`;
}

export function parseStoredSpectrumAnswer(rawValues: string[]) {
  const rawAnswer = rawValues.find((value) => value.startsWith(SPECTRUM_ANSWER_PREFIX));

  if (!rawAnswer) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      decodeURIComponent(rawAnswer.slice(SPECTRUM_ANSWER_PREFIX.length)),
    ) as Partial<SpectrumAnswer>;

    if (parsed.type !== "spectrum") {
      return null;
    }

    return {
      type: "spectrum",
      leftLabel: typeof parsed.leftLabel === "string" ? parsed.leftLabel : "",
      rightLabel: typeof parsed.rightLabel === "string" ? parsed.rightLabel : "",
      leftEmoji: typeof parsed.leftEmoji === "string" ? parsed.leftEmoji : "",
      rightEmoji: typeof parsed.rightEmoji === "string" ? parsed.rightEmoji : "",
      score: normalizeScore(parsed.score, 50),
      interpretation:
        typeof parsed.interpretation === "string" ? parsed.interpretation : "",
      edgeTriggered:
        parsed.edgeTriggered === "left" || parsed.edgeTriggered === "right"
          ? parsed.edgeTriggered
          : null,
      justification:
        typeof parsed.justification === "string" ? parsed.justification : "",
    } satisfies SpectrumAnswer;
  } catch {
    return null;
  }
}

export function getSpectrumInterpretation(config: SpectrumConfig, score: number) {
  const normalizedScore = normalizeScore(score, config.defaultValue);

  if (normalizedScore <= 10) {
    return `Tres proche de ${config.leftLabel}`;
  }

  if (normalizedScore < 35) {
    return `Plutot ${config.leftLabel}`;
  }

  if (normalizedScore <= 65) {
    return `Entre ${config.leftLabel} et ${config.rightLabel}`;
  }

  if (normalizedScore < 90) {
    return `Plutot ${config.rightLabel}`;
  }

  return `Tres proche de ${config.rightLabel}`;
}

export function getSpectrumEdgeTriggered(config: SpectrumConfig, score: number) {
  const normalizedScore = normalizeScore(score, config.defaultValue);

  if (normalizedScore <= config.edgeThreshold) {
    return "left" satisfies SpectrumEdgeTriggered;
  }

  if (normalizedScore >= 100 - config.edgeThreshold) {
    return "right" satisfies SpectrumEdgeTriggered;
  }

  return null;
}

export function buildSpectrumAnswer(input: {
  config: SpectrumConfig;
  score: number;
  justification?: string;
}) {
  const normalizedScore = normalizeScore(input.score, input.config.defaultValue);

  return {
    type: "spectrum",
    leftLabel: input.config.leftLabel,
    rightLabel: input.config.rightLabel,
    leftEmoji: input.config.leftEmoji,
    rightEmoji: input.config.rightEmoji,
    score: normalizedScore,
    interpretation: getSpectrumInterpretation(input.config, normalizedScore),
    edgeTriggered: getSpectrumEdgeTriggered(input.config, normalizedScore),
    justification: input.justification?.trim() ?? "",
  } satisfies SpectrumAnswer;
}

export function getDefaultSpectrumAnswer(config: SpectrumConfig) {
  return buildSpectrumAnswer({
    config,
    score: config.defaultValue,
    justification: "",
  });
}

function normalizeEffectType(value: unknown): SpectrumEffectType {
  if (value === "sparkle" || value === "pulse") {
    return value;
  }

  return "confetti";
}

function normalizeThreshold(value: unknown, fallback: number) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(numericValue), 5), 20);
}

function normalizeScore(value: unknown, fallback: number) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(numericValue), 0), 100);
}
