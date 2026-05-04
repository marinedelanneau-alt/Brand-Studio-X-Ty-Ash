export type SmartFeedbackType = "rule_based" | "manual" | "ai_ready";
export type SmartFeedbackLevel = "improve" | "warning" | "good" | "excellent";

export type SmartFeedbackRuleCondition =
  | "length_less_than"
  | "length_between"
  | "contains_generic_words"
  | "contains_required_keywords"
  | "passes_all_checks";

export type SmartFeedbackRule = {
  id: string;
  condition: SmartFeedbackRuleCondition;
  value?: number | [number, number] | string[];
  message: string;
  level: SmartFeedbackLevel;
};

export type SmartFeedbackConfig = {
  enabled: boolean;
  type: SmartFeedbackType;
  minLength: number;
  maxLength: number;
  requiredKeywords: string[];
  forbiddenKeywords: string[];
  clarityScoreEnabled: boolean;
  rules: SmartFeedbackRule[];
  positiveMessage: string;
  neutralMessage: string;
  improvementMessage: string;
  excellentMessage: string;
};

export type SmartFeedbackResult = {
  level: SmartFeedbackLevel;
  message: string;
  clarityScore?: number;
};

const SMART_FEEDBACK_PREFIX = "__smart_feedback__:";

export const DEFAULT_GENERIC_WORDS = [
  "qualite",
  "personnalise",
  "sur-mesure",
  "unique",
  "authentique",
  "professionnel",
  "accompagnement complet",
  "solution adaptee",
  "expertise",
  "passion",
];

export function getDefaultSmartFeedbackConfig(): SmartFeedbackConfig {
  return {
    enabled: false,
    type: "rule_based",
    minLength: 80,
    maxLength: 600,
    requiredKeywords: [],
    forbiddenKeywords: DEFAULT_GENERIC_WORDS,
    clarityScoreEnabled: true,
    rules: [
      {
        id: "too_short",
        condition: "length_less_than",
        value: 80,
        message:
          "Ta reponse est encore courte. Tu peux preciser qui tu aides, ce que tu apportes et comment.",
        level: "improve",
      },
      {
        id: "too_generic",
        condition: "contains_generic_words",
        value: DEFAULT_GENERIC_WORDS,
        message:
          "Certains mots sont encore generiques. Essaie de rendre ta reponse plus concrete.",
        level: "warning",
      },
      {
        id: "clear_answer",
        condition: "length_between",
        value: [120, 400],
        message:
          "C'est clair. Tu peux encore renforcer ta reponse avec un exemple ou un benefice concret.",
        level: "good",
      },
      {
        id: "excellent_answer",
        condition: "passes_all_checks",
        message: "Excellent. Ta reponse est claire, specifique et exploitable.",
        level: "excellent",
      },
    ],
    positiveMessage: "C'est clair, tu peux encore ajouter un exemple.",
    neutralMessage: "Bonne base. Tu peux preciser davantage pour rendre la reponse plus exploitable.",
    improvementMessage: "Ta reponse est encore un peu floue. Essaie d'ajouter un resultat concret.",
    excellentMessage: "Excellent, cette reponse est exploitable.",
  };
}

export function normalizeSmartFeedbackConfig(
  rawConfig: Partial<SmartFeedbackConfig> | null | undefined,
): SmartFeedbackConfig {
  const fallback = getDefaultSmartFeedbackConfig();
  const normalizedRules = Array.isArray(rawConfig?.rules)
    ? rawConfig.rules.reduce<SmartFeedbackRule[]>((accumulator, rule) => {
        const normalizedRule = normalizeRule(rule);

        if (normalizedRule) {
          accumulator.push(normalizedRule);
        }

        return accumulator;
      }, [])
    : fallback.rules;

  return {
    enabled: rawConfig?.enabled ?? fallback.enabled,
    type:
      rawConfig?.type === "manual" || rawConfig?.type === "ai_ready"
        ? rawConfig.type
        : fallback.type,
    minLength: normalizeLength(rawConfig?.minLength, fallback.minLength),
    maxLength: normalizeLength(rawConfig?.maxLength, fallback.maxLength),
    requiredKeywords: normalizeStringList(rawConfig?.requiredKeywords),
    forbiddenKeywords: normalizeStringList(rawConfig?.forbiddenKeywords, DEFAULT_GENERIC_WORDS),
    clarityScoreEnabled:
      rawConfig?.clarityScoreEnabled ?? fallback.clarityScoreEnabled,
    rules: normalizedRules,
    positiveMessage:
      typeof rawConfig?.positiveMessage === "string" && rawConfig.positiveMessage.trim()
        ? rawConfig.positiveMessage.trim()
        : fallback.positiveMessage,
    neutralMessage:
      typeof rawConfig?.neutralMessage === "string" && rawConfig.neutralMessage.trim()
        ? rawConfig.neutralMessage.trim()
        : fallback.neutralMessage,
    improvementMessage:
      typeof rawConfig?.improvementMessage === "string" &&
      rawConfig.improvementMessage.trim()
        ? rawConfig.improvementMessage.trim()
        : fallback.improvementMessage,
    excellentMessage:
      typeof rawConfig?.excellentMessage === "string" &&
      rawConfig.excellentMessage.trim()
        ? rawConfig.excellentMessage.trim()
        : fallback.excellentMessage,
  };
}

export function getSerializedSmartFeedbackOption(config: SmartFeedbackConfig) {
  return `${SMART_FEEDBACK_PREFIX}${encodeURIComponent(
    JSON.stringify(normalizeSmartFeedbackConfig(config)),
  )}`;
}

export function parseStoredSmartFeedbackConfig(rawOptions: string[]) {
  const option = rawOptions.find((item) => item.startsWith(SMART_FEEDBACK_PREFIX));

  if (!option) {
    return getDefaultSmartFeedbackConfig();
  }

  try {
    return normalizeSmartFeedbackConfig(
      JSON.parse(
        decodeURIComponent(option.slice(SMART_FEEDBACK_PREFIX.length)),
      ) as Partial<SmartFeedbackConfig>,
    );
  } catch {
    return getDefaultSmartFeedbackConfig();
  }
}

export function isSmartFeedbackOption(value: string) {
  return value.startsWith(SMART_FEEDBACK_PREFIX);
}

export function evaluateSmartFeedback(
  value: string,
  config: SmartFeedbackConfig,
): SmartFeedbackResult | null {
  const normalizedConfig = normalizeSmartFeedbackConfig(config);

  if (!normalizedConfig.enabled) {
    return null;
  }

  const normalizedValue = value.trim();
  const clarityScore = normalizedConfig.clarityScoreEnabled
    ? calculateClarityScore(normalizedValue, normalizedConfig)
    : undefined;

  if (!normalizedValue) {
    return {
      level: "improve",
      message: normalizedConfig.improvementMessage,
      clarityScore,
    };
  }

  if (normalizedConfig.type === "manual") {
    return evaluateManualFeedback(normalizedValue, normalizedConfig, clarityScore);
  }

  if (normalizedConfig.type === "ai_ready") {
    return evaluateAiReadyFeedback(normalizedValue, normalizedConfig, clarityScore);
  }

  const ruleBasedResult = evaluateRuleBasedFeedback(
    normalizedValue,
    normalizedConfig,
    clarityScore,
  );

  if (ruleBasedResult) {
    return ruleBasedResult;
  }

  return {
    level: "good",
    message: normalizedConfig.positiveMessage,
    clarityScore,
  };
}

function evaluateManualFeedback(
  value: string,
  config: SmartFeedbackConfig,
  clarityScore?: number,
): SmartFeedbackResult {
  const length = value.length;

  if (length < config.minLength) {
    return {
      level: "improve",
      message: config.improvementMessage,
      clarityScore,
    };
  }

  if (length >= Math.max(config.minLength, 140) && !containsGenericWords(value, config)) {
    return {
      level: "excellent",
      message: config.excellentMessage,
      clarityScore,
    };
  }

  return {
    level: "good",
    message: config.positiveMessage,
    clarityScore,
  };
}

function evaluateAiReadyFeedback(
  value: string,
  config: SmartFeedbackConfig,
  clarityScore?: number,
): SmartFeedbackResult {
  if (value.length < config.minLength) {
    return {
      level: "improve",
      message: config.improvementMessage,
      clarityScore,
    };
  }

  return {
    level: clarityScore !== undefined && clarityScore >= 80 ? "excellent" : "good",
    message:
      clarityScore !== undefined && clarityScore >= 80
        ? config.excellentMessage
        : config.neutralMessage,
    clarityScore,
  };
}

function evaluateRuleBasedFeedback(
  value: string,
  config: SmartFeedbackConfig,
  clarityScore?: number,
): SmartFeedbackResult | null {
  for (const rule of config.rules) {
    if (rule.condition === "length_less_than") {
      const threshold = typeof rule.value === "number" ? rule.value : config.minLength;
      if (value.length < threshold) {
        return { level: rule.level, message: rule.message, clarityScore };
      }
    }

    if (rule.condition === "contains_generic_words") {
      const words = isStringArray(rule.value) ? rule.value : config.forbiddenKeywords;
      if (containsAnyWord(value, words)) {
        return { level: rule.level, message: rule.message, clarityScore };
      }
    }

    if (rule.condition === "contains_required_keywords") {
      const words = isStringArray(rule.value) ? rule.value : config.requiredKeywords;
      if (words.length > 0 && !containsAllWords(value, words)) {
        return { level: rule.level, message: rule.message, clarityScore };
      }
    }

    if (rule.condition === "length_between" && isNumberPair(rule.value)) {
      const [min, max] = rule.value;
      if (value.length >= min && value.length <= max) {
        return { level: rule.level, message: rule.message, clarityScore };
      }
    }

    if (rule.condition === "passes_all_checks" && passesAllChecks(value, config)) {
      return { level: rule.level, message: rule.message, clarityScore };
    }
  }

  if (containsGenericWords(value, config)) {
    return {
      level: "warning",
      message:
        "Ce mot peut etre utile, mais il gagne a etre precise par un exemple concret.",
      clarityScore,
    };
  }

  return null;
}

function calculateClarityScore(value: string, config: SmartFeedbackConfig) {
  if (!value.trim()) {
    return 0;
  }

  let score = 0;

  if (value.length >= config.minLength) {
    score += 25;
  }

  if (!containsGenericWords(value, config)) {
    score += 20;
  }

  if (containsTargetHint(value)) {
    score += 20;
  }

  if (containsConcreteOutcome(value)) {
    score += 20;
  }

  if (isReadableSentence(value, config)) {
    score += 15;
  }

  return Math.min(score, 100);
}

export function getClarityLabel(score: number) {
  if (score < 35) {
    return "A preciser";
  }

  if (score < 65) {
    return "Bonne base";
  }

  if (score < 85) {
    return "Tres clair";
  }

  return "Excellent";
}

function passesAllChecks(value: string, config: SmartFeedbackConfig) {
  return (
    value.length >= config.minLength &&
    value.length <= config.maxLength &&
    !containsGenericWords(value, config) &&
    (config.requiredKeywords.length === 0 ||
      containsAllWords(value, config.requiredKeywords))
  );
}

function containsGenericWords(value: string, config: SmartFeedbackConfig) {
  return containsAnyWord(value, config.forbiddenKeywords);
}

function containsAnyWord(value: string, words: string[]) {
  const normalizedValue = normalizeForMatch(value);
  return words.some((word) => normalizedValue.includes(normalizeForMatch(word)));
}

function containsAllWords(value: string, words: string[]) {
  const normalizedValue = normalizeForMatch(value);
  return words.every((word) => normalizedValue.includes(normalizeForMatch(word)));
}

function containsTargetHint(value: string) {
  const patterns = [
    "pour",
    "j'aide",
    "j accompagne",
    "nous aidons",
    "clients",
    "marques",
    "entrepreneurs",
    "audience",
  ];

  return containsAnyWord(value, patterns);
}

function containsConcreteOutcome(value: string) {
  const patterns = [
    "resultat",
    "gagner",
    "clarifier",
    "decider",
    "vendre",
    "convertir",
    "simplifier",
    "obtenir",
    "permet",
    "afin de",
  ];

  return containsAnyWord(value, patterns);
}

function isReadableSentence(value: string, config: SmartFeedbackConfig) {
  const sentences = value
    .split(/[.!?]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    sentences.length > 0 &&
    value.length <= config.maxLength &&
    sentences.some((sentence) => sentence.split(/\s+/).length >= 8)
  );
}

function normalizeRule(rawRule: Partial<SmartFeedbackRule>) {
  if (
    rawRule.condition !== "length_less_than" &&
    rawRule.condition !== "length_between" &&
    rawRule.condition !== "contains_generic_words" &&
    rawRule.condition !== "contains_required_keywords" &&
    rawRule.condition !== "passes_all_checks"
  ) {
    return null;
  }

  if (
    rawRule.level !== "improve" &&
    rawRule.level !== "warning" &&
    rawRule.level !== "good" &&
    rawRule.level !== "excellent"
  ) {
    return null;
  }

  if (typeof rawRule.message !== "string" || !rawRule.message.trim()) {
    return null;
  }

  return {
    id:
      typeof rawRule.id === "string" && rawRule.id.trim()
        ? rawRule.id.trim()
        : crypto.randomUUID(),
    condition: rawRule.condition,
    value: normalizeRuleValue(rawRule.condition, rawRule.value),
    message: rawRule.message.trim(),
    level: rawRule.level,
  } satisfies SmartFeedbackRule;
}

function normalizeRuleValue(
  condition: SmartFeedbackRuleCondition,
  value: unknown,
): SmartFeedbackRule["value"] {
  if (condition === "length_less_than") {
    return typeof value === "number" ? value : Number(value) || 0;
  }

  if (condition === "length_between") {
    if (
      Array.isArray(value) &&
      value.length === 2 &&
      value.every((item) => typeof item === "number" && Number.isFinite(item))
    ) {
      return [value[0], value[1]];
    }

    return undefined;
  }

  if (
    condition === "contains_generic_words" ||
    condition === "contains_required_keywords"
  ) {
    return normalizeStringList(value);
  }

  return undefined;
}

function normalizeLength(value: unknown, fallback: number) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }

  return Math.round(numericValue);
}

function normalizeStringList(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNumberPair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
