import { describe, expect, it } from "vitest";
import type { GeneratedBrandGuide } from "../lib/brand-guide";
import { createBrandGuideData, hasMeaningfulContent, validateBrandGuideConsistency } from "../lib/brand-guide-pdf-data";
import { getCoverTitleFontSize, renderBrandGuidePdf } from "../lib/brand-guide-pdf";
import { composeEditorialPages } from "../lib/brand-guide-editorial-composer";
import { buildBrandVisualIdentity, createBrandGuideTheme } from "../lib/brand-visual-identity";
import { calculatePageDensity, composeMoodboard, getAccessibleTextColor, selectCoverLayout, selectEditorialLayout } from "../lib/brand-guide-editorial-layout";

function makeGuide(): GeneratedBrandGuide {
  return {
    brandName: "Maison Éditoriale au nom volontairement très long",
    brandAssets: { logoOwner: "Maison Éditoriale au nom volontairement très long" },
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
  it("selects editorial layouts from content density", () => {
    expect(selectEditorialLayout([{ label: "Promesse", value: "Une marque claire." }])).toBe("manifesto");
    expect(selectEditorialLayout([{ label: "Contexte", value: "x".repeat(750) }])).toBe("profile");
    expect(calculatePageDensity([{ label: "Contexte", value: "x".repeat(1500) }])).toBeGreaterThan(0.9);
  });

  it("computes accessible palette contrast", () => {
    expect(getAccessibleTextColor("#FAF6EF")).toBe("#29242C");
    expect(getAccessibleTextColor("#29242C")).toBe("#FFFFFF");
  });

  it("selects a cover from real assets without inventing a logo", () => {
    const data = createBrandGuideData(makeGuide());
    expect(selectCoverLayout(data)).toBe("palette-graphic");
    expect(data.logoUrl).toBeUndefined();
  });

  it("preserves the original moodboard composition and stacking order", () => {
    const source = makeGuide().visualUniverse.moodboard[0];
    const items = composeMoodboard([
      { ...source, id: "front", x: 90, y: 80, width: 8, height: 12, rotation: 4, zIndex: 9 },
      { ...source, id: "back", x: 6, y: 8, width: 34, height: 30, rotation: -3, zIndex: 2 },
    ]);
    expect(items.map((item) => item.id)).toEqual(["back", "front"]);
    expect(items[0]).toMatchObject({ x: 6, y: 8, width: 34, height: 30, rotation: -3, zIndex: 2 });
    expect(items[1]).toMatchObject({ x: 90, y: 80, width: 8, height: 12, rotation: 4, zIndex: 9 });
  });

  it("adapts the cover title to short, medium and long brand names", () => {
    expect(getCoverTitleFontSize("Éclat")).toBe(48);
    expect(getCoverTitleFontSize("Marine Communication")).toBe(40);
    expect(getCoverTitleFontSize("Une marque au nom particulièrement long et exigeant")).toBe(30);
  });
  it("removes placeholders and keeps only populated chapters", () => {
    const data = createBrandGuideData(makeGuide());
    expect(data.positioning.map((item) => item.label)).toEqual(["Contexte client", "Positionnement final"]);
    expect(JSON.stringify(data)).not.toContain("À compléter");
    expect(data.chapters.at(-1)?.title).toBe("Synthèse");
    expect(data.chapters.every((chapter) => chapter.page >= 3)).toBe(true);
    expect(data.chapters.find((chapter) => chapter.id === "positioning")?.page).toBe(
      data.chapters.find((chapter) => chapter.id === "messages")?.page,
    );
  });

  it("maps technical value rows into editorial value records", () => {
    const guide = makeGuide();
    guide.dna.values = [
      "1 · Valeur: Écoute · Cela signifie que je: prends le temps de comprendre · Dans la pratique: je questionne et je construis · Dans la communication: un discours humain et attentif",
    ];
    expect(createBrandGuideData(guide).values).toEqual([
      {
        name: "Écoute",
        meaning: "prends le temps de comprendre",
        concreteApplication: "je questionne et je construis",
        communicationExpression: "un discours humain et attentif",
      },
    ]);
  });

  it("preserves every moodboard block created in the exercise", () => {
    const guide = makeGuide();
    guide.visualUniverse.moodboard = [
      { id: "generic", type: "color", color: "#CF7430", label: "Couleur", description: "", x: 0, y: 0, width: 20, height: 20, rotation: 0, zIndex: 1 },
    ];
    expect(createBrandGuideData(guide).moodboard).toEqual(guide.visualUniverse.moodboard);
    expect(hasMeaningfulContent("Inspiration 1")).toBe(false);
  });

  it("blocks an export when two brand identities are detected", () => {
    const guide = makeGuide();
    guide.brandName = "Marine Communication";
    guide.personality.persona = "Lumière Studio incarne une présence douce.";
    const result = validateBrandGuideConsistency(createBrandGuideData(guide));
    expect(result.valid).toBe(false);
    expect(result.conflicts).toContain("Lumière Studio");
  });

  it("renders a selectable A4 PDF with accents and a long brand name", async () => {
    const guide = makeGuide();
    const buffer = await renderBrandGuidePdf(guide);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(8_000);
    const pageCount = (buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
    const data = createBrandGuideData(guide);
    const identity = buildBrandVisualIdentity(guide);
    const theme = createBrandGuideTheme(identity);
    const plannedPageCount = composeEditorialPages({ data, identity, direction: theme.direction }).pages.length;
    expect(pageCount).toBe(plannedPageCount);
  });
});
