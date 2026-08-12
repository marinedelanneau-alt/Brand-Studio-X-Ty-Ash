export const TYPOGRAPHY_CONFIG_PREFIX = "__typography_config__:";
export const TYPOGRAPHY_ANSWER_PREFIX = "__typography_answer__:";

export type TypographyRole = "title" | "subtitle" | "body";
export type TypographyChoice = {
  role: TypographyRole;
  family: string;
  source: "library" | "upload";
  fileUrl?: string;
  fileName?: string;
};
export type TypographyAnswer = { version: 1; choices: TypographyChoice[] };

export const OPEN_SOURCE_FONT_LIBRARY = [
  { family: "Inter", category: "Sans serif" },
  { family: "Source Serif 4", category: "Serif" },
  { family: "Montserrat", category: "Sans serif" },
  { family: "Poppins", category: "Sans serif" },
  { family: "DM Sans", category: "Sans serif" },
  { family: "Manrope", category: "Sans serif" },
  { family: "Lora", category: "Serif" },
  { family: "Playfair Display", category: "Serif" },
  { family: "Cormorant Garamond", category: "Serif" },
  { family: "Libre Baskerville", category: "Serif" },
  { family: "Space Grotesk", category: "Sans serif" },
  { family: "Bebas Neue", category: "Display" },
  { family: "Open Sans", category: "Sans serif" },
  { family: "Raleway", category: "Sans serif" },
  { family: "Nunito Sans", category: "Sans serif" },
  { family: "Work Sans", category: "Sans serif" },
  { family: "Merriweather", category: "Serif" },
  { family: "Crimson Pro", category: "Serif" },
  { family: "Bodoni Moda", category: "Serif" },
  { family: "Oswald", category: "Display" },
  { family: "Abril Fatface", category: "Display" },
] as const;

export function getSerializedTypographyOptions() {
  return [`${TYPOGRAPHY_CONFIG_PREFIX}${encodeURIComponent(JSON.stringify({ maxFonts: 3, allowUpload: true }))}`];
}

export function isTypographyOptions(options: string[]) {
  return options.some((option) => option.startsWith(TYPOGRAPHY_CONFIG_PREFIX));
}

export function serializeTypographyAnswer(answer: TypographyAnswer) {
  return `${TYPOGRAPHY_ANSWER_PREFIX}${encodeURIComponent(JSON.stringify(answer))}`;
}

export function parseStoredTypographyAnswer(values: string[]): TypographyAnswer {
  const stored = values.find((value) => value.startsWith(TYPOGRAPHY_ANSWER_PREFIX));
  if (!stored) return { version: 1, choices: [] };
  try {
    const parsed = JSON.parse(decodeURIComponent(stored.slice(TYPOGRAPHY_ANSWER_PREFIX.length))) as TypographyAnswer;
    return {
      version: 1,
      choices: Array.isArray(parsed.choices)
        ? parsed.choices.filter((choice) => ["title", "subtitle", "body"].includes(choice.role) && Boolean(choice.family)).slice(0, 3)
        : [],
    };
  } catch {
    return { version: 1, choices: [] };
  }
}

export function isTypographyComplete(answer: TypographyAnswer) {
  return ["title", "subtitle", "body"].every((role) => answer.choices.some((choice) => choice.role === role));
}
