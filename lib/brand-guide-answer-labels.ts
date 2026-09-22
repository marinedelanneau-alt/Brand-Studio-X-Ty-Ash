function normalize(label: string) {
  return label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

export function isExcludedAnswerLabel(label: string) {
  return /\b(?:pas|jamais|sans|ni|eviter|ecarter|bannir|exclure|interdit\w*|proscrire|refus\w*)\b/.test(normalize(label));
}

/** Use the question's instruction, never the sentiment of its answer. */
export function getVocabularyDirection(label: string): "use" | "avoid" | null {
  const text = normalize(label);
  if (!/\b(?:mots?|vocabulaire|expressions?|termes?|adjectifs?|langage)\b/.test(text)) return null;
  const positive = /\b(?:utiliser|employer|privilegier|retenir|associer|represent\w*|decri\w*)\b/.test(text);
  if (positive && /\b(?:et|ou) (?:a )?(?:eviter|ecarter|bannir|exclure)\b/.test(text)) return null;
  if (isExcludedAnswerLabel(label)) return "avoid";
  return positive ? "use" : null;
}
