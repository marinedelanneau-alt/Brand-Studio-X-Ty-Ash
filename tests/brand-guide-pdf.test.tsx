import { describe, expect, it } from "vitest";
import type { GeneratedBrandGuide } from "../lib/brand-guide";
import { createBrandGuideData } from "../lib/brand-guide-pdf-data";
import { renderBrandGuidePdf } from "../lib/brand-guide-pdf";

function makeGuide(): GeneratedBrandGuide {
  return {
    brandName: "Maison Éditoriale au nom volontairement très long",
    baseline: "Créer du sens, durablement.",
    generatedAt: "2026-07-22T09:00:00.000Z",
    completion: { hasAnyData: true, warning: "", items: [] },
    cover: { title: "", subtitle: "", introLine: "" },
    introduction: "",
    dna: {
      activity: "Conseil en stratégie de marque.",
      essence: "Clarté et justesse.",
      mission: "Rendre les marques plus lisibles et plus humaines.",
      vision: "Des identités cohérentes et durables.",
      values: ["Clarté", "Écoute", "Exigence"],
      promise: "Une direction claire pour décider avec confiance.",
    },
    positioning: {
      target: "À compléter dans le module Positionnement.",
      context: "Des entreprises qui ont grandi sans direction visuelle commune.",
      problem: "",
      differentiation: "",
      competitors: "",
      finalPositioning: "Le studio qui transforme la complexité en une marque évidente.",
      pitch: "",
    },
    personality: {
      persona: "Une stratège calme, précise et chaleureuse.",
      traits: ["Sensible", "Structurée", "Accessible"],
      relationship: "Elle guide avec tact et franchise.",
      tone: "Clair, direct et bienveillant.",
      wordsToUse: ["Clarté", "Élan", "Confiance"],
      wordsToAvoid: ["Disruptif", "Révolutionnaire"],
    },
    baselineSection: { final: "Créer du sens, durablement.", variants: [], recommendedUses: [] },
    visualUniverse: {
      palette: {
        primary: [{ id: "1", name: "Terracotta", usage: "Accent", css: "#CF7430", hex: "#CF7430", role: "primary" }],
        secondary: [{ id: "2", name: "Crème", usage: "Fond", css: "#FAF6EF", hex: "#FAF6EF", role: "secondary" }],
      },
      ambiance: "Éditoriale, lumineuse et structurée.",
      graphicElements: "",
      moodboardBackground: "#F5E8C8",
      prioritySupports: [],
      moodboard: [{ id: "color", type: "color", color: "#CF7430", label: "Terracotta", description: "", x: 8, y: 10, width: 35, height: 35, rotation: 0, zIndex: 1 }],
    },
    applicationRules: { social: [], website: [], presentations: [], salesDocs: [], prioritySupports: [] },
    checklists: { visual: [], editorial: [], support: [], evolution: [] },
    expressSummary: { mission: "", positioning: "", tone: [], palette: [], promise: "", baseline: "" },
  };
}

describe("editorial brand guide PDF", () => {
  it("removes placeholders and keeps only populated chapters", () => {
    const data = createBrandGuideData(makeGuide());
    expect(data.positioning.map((item) => item.label)).toEqual(["Contexte client", "Positionnement final"]);
    expect(JSON.stringify(data)).not.toContain("À compléter");
    expect(data.chapters.at(-1)?.title).toBe("Synthèse");
  });

  it("renders a selectable A4 PDF with accents and a long brand name", async () => {
    const buffer = await renderBrandGuidePdf(makeGuide());
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(8_000);
  });
});
