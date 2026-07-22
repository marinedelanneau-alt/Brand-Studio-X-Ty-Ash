import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { ModulePdfSummary } from "../lib/module-pdf-summary";
import type { ModuleSummaryCard } from "../lib/module-summary";
import type { ModuleShareData } from "../lib/get-module-share-data";

const longAnswer = [
  "Révéler des marques authentiques en construisant une identité claire, sensible et mémorable.",
  "Cette réponse volontairement longue vérifie que le contenu peut continuer sur la page suivante",
  "sans être coupé, superposé ou traversé par la bordure d'une autre carte.",
].join(" ").repeat(6);

const summary: ModuleSummaryCard = {
  eyebrow: "Module 3",
  title: "Personnalité et ton",
  subtitle: "Atelier Démo",
  hero: "Une marque chaleureuse, précise et audacieuse.",
  insight: "Une direction claire se dessine.",
  focusWords: ["Sensible", "Audacieuse", "Claire"],
  highlights: [],
  quickRecap: [],
  footer: "",
  keyTakeaways: [
    {
      id: "baseline",
      label: "Ta baseline",
      value: longAnswer,
      context: "Ta phrase repère pour présenter ton activité.",
      icon: "baseline",
    },
  ],
  submoduleRecaps: [
    {
      id: 1,
      position: 1,
      title: "Angle émotionnel",
      summary: "",
      highlights: [
        { label: "Ta baseline", value: longAnswer },
        { label: "Intention", value: "Créer un lien immédiat et durable." },
      ],
    },
  ],
};

const shareData: ModuleShareData = {
  brandName: "Atelier Démo",
  moduleKey: "personnalite-et-ton",
  moduleTitle: "Personnalité et ton",
  progress: 100,
  completedAt: "2026-07-22T08:00:00.000Z",
  keywords: ["Ton", "Voix", "Expression"],
  shareSentence: "Ma marque trouve sa voix.",
  themeColors: {
    background: "#fbf4ea",
    surface: "#fffdf8",
    accent: "#cf7430",
    accentSoft: "#f1cc56",
    text: "#332d35",
    muted: "#6f645b",
  },
};

describe("module PDF summary", () => {
  it("renders long, indivisible answer cards as a valid multi-page PDF", async () => {
    const buffer = await renderToBuffer(
      <ModulePdfSummary summary={summary} shareData={shareData} />,
    );

    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(5_000);
  });
});
