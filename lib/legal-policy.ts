export const BRAND_STUDIO_FIRST_PUBLICATION_YEAR = 2026;
export type EnforcementMode = "disabled" | "admin_only" | "new_users_only" | "all_users";

export function copyrightText(year = new Date().getFullYear()) {
  const years = year <= BRAND_STUDIO_FIRST_PUBLICATION_YEAR ? "2026" : `2026–${year}`;
  return `© ${years} Brand Studio. Tous droits réservés.`;
}

export function shouldRequireAcceptance(input: {
  mode: EnforcementMode; isAdmin: boolean; createdAt: string; cutoff?: string|null; accepted: boolean;
}) {
  if (input.accepted || input.mode === "disabled") return false;
  if (input.mode === "admin_only") return input.isAdmin;
  if (input.mode === "all_users") return true;
  return !input.cutoff || new Date(input.createdAt) >= new Date(input.cutoff);
}
