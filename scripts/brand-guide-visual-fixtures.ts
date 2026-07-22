import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import type { GeneratedBrandGuide, GuideColor, GuideMoodboardItem } from "../lib/brand-guide";
import { renderBrandGuidePdf } from "../lib/brand-guide-pdf";

const output = path.join(process.cwd(), "artifacts", "brand-guide-preview");

function logoData(vertical = false) {
  const canvas = createCanvas(vertical ? 260 : 520, vertical ? 420 : 180);
  const context = canvas.getContext("2d");
  context.fillStyle = "#C96C2D";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#FFF9F1";
  context.font = `600 ${vertical ? 92 : 72}px serif`;
  context.textAlign = "center";
  context.fillText("BS", canvas.width / 2, canvas.height / 2 + 28);
  return `data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`;
}

function colors(count = 5): GuideColor[] {
  const values = ["#C96C2D", "#F1CF84", "#282329", "#7D8E82", "#F7F1E8", "#A25B49", "#C7B7D9", "#35576A"];
  return values.slice(0, count).map((hex, index) => ({ id: String(index), name: `Nuance ${index + 1}`, usage: index === 0 ? "Accent et appels" : "Support de composition", css: hex, hex, role: index < 2 ? "primary" : "secondary" }));
}

function moodboard(count = 5): GuideMoodboardItem[] {
  return Array.from({ length: count }, (_, index) => ({ id: `mood-${index}`, type: index % 3 === 0 ? "color" : "keyword", color: index % 3 === 0 ? colors(8)[index]?.hex : undefined, label: ["Matière", "Clarté", "Précision", "Chaleur", "Rythme", "Équilibre"][index] || `Signe ${index}`, description: "Direction visuelle", x: 80, y: 80, width: 10, height: 10, rotation: 4, zIndex: index }));
}

function guide(name: string, options: { logo?: "horizontal" | "vertical"; partial?: boolean; values?: number; mood?: number; palette?: number } = {}): GeneratedBrandGuide {
  const palette = colors(options.palette ?? 5);
  const partial = options.partial;
  return {
    brandName: name,
    brandAssets: { logoUrl: options.logo ? logoData(options.logo === "vertical") : undefined, logoAspectRatio: options.logo === "vertical" ? 0.62 : options.logo ? 2.89 : undefined, logoOwner: name, logoAlt: `Logo de ${name}` },
    baseline: "Donner une forme claire aux idées qui comptent.", generatedAt: "2026-07-22T09:00:00.000Z",
    completion: { hasAnyData: true, warning: "", items: [] }, cover: { title: "", subtitle: "", introLine: "" }, introduction: "",
    dna: { activity: "Direction de marque et communication éditoriale.", essence: "Faire émerger une présence juste et durable.", mission: "Transformer la complexité en une direction de marque claire, sensible et immédiatement utilisable.", vision: partial ? "" : "Des marques cohérentes qui inspirent confiance sans surjouer.", values: Array.from({ length: options.values ?? 3 }, (_, index) => `${index + 1} · Valeur: ${["Écoute", "Clarté", "Exigence"][index] || `Valeur ${index + 1}`} · Cela signifie que je: prends le temps de comprendre le contexte · Dans la pratique: je hiérarchise et je construis avec méthode · Dans la communication: une expression humaine, précise et attentive`), promise: "Une identité cohérente qui facilite chaque décision." },
    positioning: { target: "Entrepreneures et studios en phase de structuration.", context: "Une activité solide mais une communication construite au fil de l’eau.", problem: partial ? "" : "Une image fragmentée qui ne traduit plus la qualité du travail.", differentiation: "Une approche stratégique, éditoriale et profondément concrète.", competitors: "", finalPositioning: "Le studio qui transforme une expertise complexe en marque claire, reconnaissable et confiante.", pitch: "Nous construisons la direction qui relie stratégie, mots et images." },
    personality: { persona: "Une stratège calme, cultivée et accessible.", traits: ["Claire", "Sensible", "Structurée"], relationship: "Elle guide avec tact, franchise et attention.", tone: "Direct, chaleureux et précis.", wordsToUse: ["clarté", "justesse", "élan"], wordsToAvoid: ["disruptif", "révolutionnaire", "solution 360"] },
    baselineSection: { final: "Donner une forme claire aux idées qui comptent.", variants: [], recommendedUses: [] },
    visualUniverse: { palette: { primary: palette.filter((item) => item.role === "primary"), secondary: palette.filter((item) => item.role === "secondary") }, ambiance: "Éditoriale, lumineuse, tactile et structurée.", graphicElements: "Grands aplats, détails typographiques et matières naturelles.", moodboardBackground: "#EDE1CE", prioritySupports: [], moodboard: moodboard(options.mood ?? 5) },
    applicationRules: { social: [], website: [], presentations: [], salesDocs: [], prioritySupports: [] }, checklists: { visual: [], editorial: [], support: [], evolution: [] }, expressSummary: { mission: "", positioning: "", tone: [], palette: [], promise: "", baseline: "" },
  };
}

const scenarios: Record<string, GeneratedBrandGuide> = {
  "lumiere-studio-complet": guide("Lumière Studio", { logo: "horizontal" }),
  "marine-communication-complet": guide("Marine Communication", { logo: "horizontal" }),
  "sans-logo": guide("Atelier Sillage"), "logo-horizontal": guide("Maison Nacre", { logo: "horizontal" }),
  "logo-vertical": guide("Studio Élan", { logo: "vertical" }), "nom-tres-long": guide("La Maison des Histoires et des Identités Sensibles", { logo: "horizontal" }),
  "partiellement-rempli": guide("Trait d’Union", { partial: true }), "trois-valeurs-longues": guide("Le Sens Juste", { values: 3 }),
  "moodboard-dense": guide("Atelier Matière", { mood: 6 }), "moodboard-incomplet": guide("Point de Départ", { mood: 1 }),
  "palette-trois-couleurs": guide("Trame", { palette: 3 }), "palette-huit-couleurs": guide("Nuancier", { palette: 8 }),
};

async function renderPngs(pdf: Buffer, scenario: string) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({ data: new Uint8Array(pdf) }).promise;
  const directory = path.join(output, scenario);
  await mkdir(directory, { recursive: true });
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.55 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvas: canvas as never, canvasContext: canvas.getContext("2d") as never, viewport }).promise;
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    const sampledColors = new Set<string>();
    for (let index = 0; index < pixels.length; index += 4 * 400) sampledColors.add(`${pixels[index]}-${pixels[index + 1]}-${pixels[index + 2]}`);
    if (sampledColors.size < 4) throw new Error(`${scenario}, page ${pageNumber}: page visuellement vide`);
    await writeFile(path.join(directory, `page-${String(pageNumber).padStart(2, "0")}.png`), canvas.toBuffer("image/png"));
  }
  return document.numPages;
}

async function main() {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const report: Record<string, number> = {};
  for (const [name, fixture] of Object.entries(scenarios)) {
    if (/à compléter|placeholder|donnée de démonstration/i.test(JSON.stringify(fixture))) throw new Error(`${name}: contenu technique détecté`);
    const pdf = await renderBrandGuidePdf(fixture);
    await writeFile(path.join(output, `${name}.pdf`), pdf);
    report[name] = await renderPngs(pdf, name);
  }
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  console.info(`Aperçus générés dans ${output}`, report);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
