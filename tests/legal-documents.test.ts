import { describe, expect, it } from "vitest";
import { legalDrafts, legalRoutes, validateLegalContent, isLegalDocumentReady } from "../lib/legal-documents";
describe("legal publication safeguards", () => {
  it("prepares all four documents without treating drafts as publishable", () => {
    expect(legalDrafts.map((draft) => draft.type).sort()).toEqual(Object.keys(legalRoutes).sort());
    for (const draft of legalDrafts) {
      const sections = draft.sections.map(([title, body], index) => ({ id: String(index), title, body }));
      expect(validateLegalContent(sections)).toBe(true);
      expect(isLegalDocumentReady(sections)).toBe(false);
    }
  });
  it("rejects missing, malformed and duplicated sections", () => {
    expect(validateLegalContent([])).toBe(false);
    expect(validateLegalContent([{ id: "a", title: "Titre", body: null }])).toBe(false);
    expect(validateLegalContent(Array(2).fill({ id: "a", title: "Titre", body: "Texte" }))).toBe(false);
  });
  it("requires resolution of validation markers before publication", () => {
    expect(isLegalDocumentReady([{ id: "a", title: "Contact", body: "[À VALIDER : contact]" }])).toBe(false);
    expect(isLegalDocumentReady([{ id: "a", title: "Contact", body: "Texte finalisé." }])).toBe(true);
  });
});
