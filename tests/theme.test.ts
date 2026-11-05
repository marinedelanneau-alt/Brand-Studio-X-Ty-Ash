import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { THEME_BOOTSTRAP } from "../lib/theme";
import { TYASH_PAPER_STYLE, TYASH_WEB_PAPER_STYLE } from "../lib/tyash-paper";
import postcss from "postcss";

function boot(saved: string | null, systemDark: boolean, blocked = false) {
  const root = { dataset: {} as Record<string, string>, style: {} as Record<string, string> };
  runInNewContext(THEME_BOOTSTRAP, {
    document: { documentElement: root },
    localStorage: { getItem: () => { if (blocked) throw new Error("blocked"); return saved; } },
    window: { matchMedia: () => ({ matches: systemDark }) },
  });
  return root;
}

describe("theme before first paint", () => {
  it.each([true, false])("uses the OS preference without a saved choice (dark=%s)", dark => {
    const root = boot(null, dark);
    expect(root.dataset.theme).toBe(dark ? "dark" : "light");
    expect(root.style.colorScheme).toBe(root.dataset.theme);
  });
  it.each(["light", "dark"])("restores an explicit %s choice over the OS preference", saved => {
    expect(boot(saved, saved === "light").dataset.theme).toBe(saved);
  });
  it("survives unavailable storage and invalid preferences", () => {
    expect(boot(null, true, true).dataset.theme).toBe("dark");
    expect(boot("invalid", false).dataset.theme).toBe("light");
  });
  it("isolates the UI grid from immutable export colors and geometry", () => {
    expect(TYASH_WEB_PAPER_STYLE.backgroundColor).toBe("var(--tyash-paper-color)");
    expect(TYASH_WEB_PAPER_STYLE.backgroundSize).toBe(TYASH_PAPER_STYLE.backgroundSize);
    expect(TYASH_PAPER_STYLE.backgroundColor).toBe("#F4F0DF");
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    expect(css).toContain('--tyash-paper-color: #19171c');
    expect(css).toContain(':not(.bs-export-surface, .bs-export-surface *)');
  });
  it("keeps notebook and workspace ink legible on the actual dark canvas and cards", () => {
    const tokens: Record<string, string> = {};
    postcss.parse(readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")).walkRules(rule => {
      if (rule.selector === ":root" || rule.selector.startsWith('html[data-theme="dark"],') || rule.selector === 'html.tyash-grid-theme[data-theme="dark"]') {
        rule.walkDecls(/^--/, decl => { tokens[decl.prop] = decl.value; });
      }
    });
    const resolve = (name: string): string => {
      const value = tokens[name];
      const alias = /^var\((--[^)]+)\)$/.exec(value);
      return alias ? resolve(alias[1]) : value;
    };
    const luminance = (hex: string) => {
      const rgb = hex.slice(1).match(/../g)!.map(n => parseInt(n, 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
      return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
    };
    const contrast = (a: string, b: string) => {
      const [light, dark] = [luminance(resolve(a)), luminance(resolve(b))].sort((x, y) => y - x);
      return (light + .05) / (dark + .05);
    };
    for (const ink of ["--tyash-display-ink", "--tyash-editorial-ink", "--notebook-body", "--notebook-muted"]) {
      for (const surface of ["--tyash-paper-color", "--notebook-surface"]) expect(contrast(ink, surface), `${ink} / ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
    for (const button of ["--notebook-button", "--notebook-button-hover"]) expect(contrast("--notebook-button-ink", button)).toBeGreaterThanOrEqual(4.5);
  });
});
