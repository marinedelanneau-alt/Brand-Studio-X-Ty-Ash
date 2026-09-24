import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import postcss from "postcss";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const tree = postcss.parse(css);

function palette(dark: boolean) {
  const tokens: Record<string, string> = {};
  tree.walkRules((rule) => {
    if (dark ? rule.selector.startsWith('html[data-theme="dark"],') : rule.selector.startsWith(":root,")) {
      rule.walkDecls(/^--/, (declaration) => { tokens[declaration.prop] = declaration.value; });
    }
  });
  function resolve(name: string): string {
    const value = tokens[name];
    if (!value) throw new Error(`Missing theme token: ${name}`);
    const alias = /^var\((--[^)]+)\)$/.exec(value);
    return alias ? resolve(alias[1]) : value;
  }
  return resolve;
}

function luminance(hex: string) {
  const rgb = hex.replace("#", "").match(/../g)!.map((part) => {
    const channel = parseInt(part, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

function contrast(a: string, b: string) {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dark + 0.05);
}

describe.each([false, true])("Ty Ash theme (dark=%s)", (dark) => {
  const token = palette(dark);
  const surfaces = ["--background", "--surface", "--card", "--surface-secondary", "--tyash-soft", "--tyash-subtle"];
  it("keeps normal text, small labels and secondary copy at AA on themed surfaces", () => {
    for (const surface of surfaces) {
      for (const ink of ["--heading-color", "--text-primary", "--text-muted", "--tyash-label-text", "--tyash-primary-dark"]) {
        expect(contrast(token(ink), token(surface)), `${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it("pairs action and disabled text with accessible backgrounds, including both gradient ends", () => {
    for (const surface of ["--tyash-primary", "--tyash-primary-hover"]) {
      expect(contrast(token("--tyash-text-on-primary"), token(surface))).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(token("--tyash-disabled-text"), token("--tyash-disabled-bg"))).toBeGreaterThanOrEqual(4.5);
  });
  it("makes focus outlines and input boundaries visible against their surroundings", () => {
    for (const surface of ["--background", "--surface", "--card", "--input"]) {
      expect(contrast(token("--tyash-focus-ring"), token(surface))).toBeGreaterThanOrEqual(3);
      expect(contrast(token("--input-border"), token(surface))).toBeGreaterThanOrEqual(3);
    }
    expect(contrast(token("--text-muted"), token("--input"))).toBeGreaterThanOrEqual(4.5);
  });
  it("keeps progress visible at both ends of its gradient", () => {
    for (const end of ["--tyash-primary", "--tyash-progress-end"]) {
      expect(contrast(token(end), token("--surface-secondary"))).toBeGreaterThanOrEqual(3);
    }
  });
});

it("does not recolor elements by matching fragments of Tailwind hover/focus classes", () => {
  tree.walkRules((rule) => { expect(rule.selector).not.toContain('[class*='); });
});
