export type FinalAnswerConcept = "promise" | "positioning";

export type FinalAnswerCandidate = {
  label: string;
  type: string;
};

function normalizeForSearch(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function findFinalAnswerCandidate<T extends FinalAnswerCandidate>(
  candidates: T[],
  concept: FinalAnswerConcept,
) {
  return candidates.find((candidate) => {
    const label = normalizeForSearch(candidate.label);

    if (concept === "promise") {
      return candidate.type === "prompt_open" &&
        (label === "ta promesse" || label.includes("promesse finale"));
    }

    const isPositioningLabel = label.includes("positionnement");
    const isExplicitlyFinal =
      label.includes("positionnement final") ||
      label.includes("positionnement formule") ||
      label.includes("phrase de positionnement") ||
      label === "ton positionnement" ||
      label === "ta phrase de positionnement";

    return isPositioningLabel &&
      (candidate.type === "prompt_open" || isExplicitlyFinal);
  });
}
