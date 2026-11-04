import type { BrandSubmodule, SubmoduleEditorialIntroduction } from "./training-types";

export function getSubmoduleIntroduction(submodule: Pick<BrandSubmodule, "stableKey" | "editorialIntroduction">): SubmoduleEditorialIntroduction | undefined {
  return submodule.editorialIntroduction;
}
