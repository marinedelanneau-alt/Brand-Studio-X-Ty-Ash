import type { ModuleExercise } from "./training-types";

export const NEW_OFFER_OPTION = "Lancer une nouvelle offre";
const DETAIL_PREFIX = `${NEW_OFFER_OPTION} : `;

export function hasNewOfferDetail(exercise: Pick<ModuleExercise, "stableKey" | "type">): boolean {
  return exercise.type === "multiple" && [
    "tyash_v1_question_3887cc49-7322-4cea-b622-b746db9a121b",
    "template_question_1022",
  ].includes(exercise.stableKey ?? "");
}

export function isNewOfferDetail(value: string): boolean {
  return value.startsWith(DETAIL_PREFIX);
}

export function getNewOfferDetail(values: string[]): string {
  return values.find(isNewOfferDetail)?.slice(DETAIL_PREFIX.length) ?? "";
}

export function setNewOfferDetail(values: string[], text: string): string[] {
  const remaining = values.filter(value => !isNewOfferDetail(value));
  return text.length ? [...remaining, `${DETAIL_PREFIX}${text}`] : remaining;
}

export function removeNewOffer(values: string[]): string[] {
  return values.filter(value => value !== NEW_OFFER_OPTION && !isNewOfferDetail(value));
}
