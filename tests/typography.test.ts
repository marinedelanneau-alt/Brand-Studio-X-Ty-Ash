import { describe, expect, it } from "vitest";
import {
  getSerializedTypographyOptions,
  isTypographyComplete,
  isTypographyOptions,
  parseStoredTypographyAnswer,
  serializeTypographyAnswer,
} from "../lib/typography";

describe("typography exercise", () => {
  it("stores exactly one choice for each typographic role", () => {
    const value = serializeTypographyAnswer({
      version: 1,
      choices: [
        { role: "title", family: "Playfair Display", source: "library" },
        { role: "subtitle", family: "DM Sans", source: "library" },
        { role: "body", family: "Inter", source: "library" },
      ],
    });
    const parsed = parseStoredTypographyAnswer([value]);
    expect(parsed.choices).toHaveLength(3);
    expect(isTypographyComplete(parsed)).toBe(true);
  });

  it("recognizes the persisted exercise configuration", () => {
    expect(isTypographyOptions(getSerializedTypographyOptions())).toBe(true);
  });
});
