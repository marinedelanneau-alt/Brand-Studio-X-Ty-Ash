export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim();
  }

  return "";
}

export function isSupabaseUnavailableError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("missing supabase environment variables")
  );
}

export function getUserFacingDataErrorMessage(error: unknown) {
  if (isSupabaseUnavailableError(error)) {
    return "La connexion a Supabase est indisponible pour le moment. Verifiez les variables d'environnement et le service, puis reessayez.";
  }

  const message = getErrorMessage(error);

  return message || "Une erreur inattendue est survenue.";
}
