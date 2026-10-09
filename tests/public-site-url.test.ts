import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicSiteUrlWithFallback } from "../lib/public-site-url";

afterEach(() => vi.unstubAllEnvs());

describe("Ty Ash public site URL", () => {
  it("prefers a valid site URL over the formation URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", ' "https://brand-studio-x-ty-ash.vercel.app" ');
    vi.stubEnv("NEXT_PUBLIC_FORMATION_URL", "https://example.com");
    expect(getPublicSiteUrlWithFallback().origin).toBe("https://brand-studio-x-ty-ash.vercel.app");
  });

  it("tries the formation URL when the site URL is invalid", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "invalid");
    vi.stubEnv("NEXT_PUBLIC_FORMATION_URL", "http://localhost:3000");
    expect(getPublicSiteUrlWithFallback().origin).toBe("http://localhost:3000");
  });

  it("uses Ty Ash when both configured URLs are absent or non-web", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "file:///tmp/site");
    vi.stubEnv("NEXT_PUBLIC_FORMATION_URL", "");
    expect(getPublicSiteUrlWithFallback().origin).toBe("https://brand-studio-x-ty-ash.vercel.app");
  });
});
