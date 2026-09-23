import { describe, expect, it } from "vitest";
import { isMissingServerAction } from "../lib/server-action-error";

describe("missing server action detection", () => {
  it("recognizes client and server version mismatch errors", () => {
    expect(isMissingServerAction('Server Action "404b" was not found on the server.')).toBe(true);
    expect(isMissingServerAction('Failed to find Server Action "404b".')).toBe(true);
  });

  it("does not suggest reloading for unrelated save failures", () => {
    expect(isMissingServerAction("Failed to fetch")).toBe(false);
    expect(isMissingServerAction("Accès requis pour synchroniser les réponses.")).toBe(false);
    expect(isMissingServerAction("")).toBe(false);
  });
});
