import introductions from "@/content/tyash-v1/submodule-introductions.json";
import type { BrandSubmodule, SubmoduleEditorialIntroduction } from "./training-types";

// Local editorial content keyed by stable identity, separate from UI and release snapshots.
const localIntroductions: Readonly<Record<string, SubmoduleEditorialIntroduction>> = introductions;

export function getSubmoduleIntroduction(
  submodule: Pick<BrandSubmodule, "stableKey" | "editorialIntroduction">,
): SubmoduleEditorialIntroduction | undefined {
  return submodule.editorialIntroduction
    ?? (submodule.stableKey ? localIntroductions[submodule.stableKey] : undefined);
}
