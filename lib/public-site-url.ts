const TY_ASH_SITE_URL = "https://brand-studio-x-ty-ash.vercel.app";

export function getConfiguredPublicSiteUrl(): URL | null {
  for (const configured of [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_FORMATION_URL]) {
    if (!configured) continue;
    try {
      const url = new URL(configured.trim().replace(/^(['"])(.*)\1$/, "$2"));
      if (url.protocol === "http:" || url.protocol === "https:") return url;
    } catch {
      // Try the next configured URL before using the Ty Ash fallback.
    }
  }
  return null;
}

export function getPublicSiteUrlWithFallback(): URL {
  return getConfiguredPublicSiteUrl() ?? new URL(TY_ASH_SITE_URL);
}
