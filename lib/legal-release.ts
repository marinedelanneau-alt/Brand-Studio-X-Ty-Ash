/** Off by default. No environment or remote setting is changed by this code. */
export function isLegalReleaseEnabled() {
  return process.env.BRAND_STUDIO_LEGAL_RELEASE === "enabled";
}

export function isCommercialReleaseEnabled() {
  return isLegalReleaseEnabled() && process.env.BRAND_STUDIO_COMMERCIAL_RELEASE === "enabled";
}
