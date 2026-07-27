import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import type { GeneratedBrandGuide, GuideColor, GuideMoodboardItem } from "../lib/brand-guide";
import { createBrandGuideData, validateBrandGuideData } from "../lib/brand-guide-pdf-data";
import { composeEditorialPages } from "../lib/brand-guide-editorial-composer";
import { buildBrandVisualIdentity, createBrandGuideTheme } from "../lib/brand-visual-identity";
import { renderBrandGuidePdf } from "../lib/brand-guide-pdf";

const output = path.join(process.cwd(), "artifacts", "brand-guide-visual-tests");

type FixtureOptions = {
  palette: string[];
  traits: string[];
  ambiance: string;
  logo?: "horizontal" | "vertical";
  moodboard?: "dense" | "minimal";
  partial?: boolean;
  colorCount?: number;
};

function imageData(colors: string[], label: string, portrait = false) {
  const canvas = createCanvas(portrait ? 720 : 1100, portrait ? 980 : 760);
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1] || colors[0]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = colors[2] || "#FFFFFF";
  context.globalAlpha = 0.68;
  context.beginPath();
  context.arc(canvas.width * 0.72, canvas.height * 0.32, canvas.width * 0.24, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = "#FFFFFF";
  context.font = `600 ${portrait ? 56 : 74}px serif`;
  context.fillText(label, 56, canvas.height - 70);
  return `data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`;
}

function logoData(name: string, colors: string[], vertical: boolean) {
  const canvas = createCanvas(vertical ? 320 : 720, vertical ? 480 : 210);
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = colors[0];
  context.lineWidth = 8;
  context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  context.fillStyle = colors[0];
  context.font = `600 ${vertical ? 52 : 64}px serif`;
  context.textAlign = "center";
  context.fillText(name, canvas.width / 2, canvas.height / 2 + 18, canvas.width - 60);
  return `data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`;
}

function palette(values: string[], count?: number): GuideColor[] {
  const colors = count ? Array.from({ length: count }, (_, index) => values[index % values.length]) : values;
  return colors.map((hex, index) => ({
    id: `color-${index}`,
    name: index === 0 ? "Principale" : index === 1 ? "Secondaire" : `Accent ${index - 1}`,
    usage: index === 0 ? "Repères structurants" : index === 1 ? "Fonds et respirations" : "Détails graphiques",
    css: hex,
    hex,
    role: index < 2 ? "primary" : "secondary",
  }));
}

function moodboard(name: string, colors: string[], density: "dense" | "minimal" = "dense"): GuideMoodboardItem[] {
  const items: GuideMoodboardItem[] = [
    { id: "image-a", type: "image", imageUrl: imageData(colors, name), label: "Direction photographique", description: "", x: 4, y: 5, width: density === "dense" ? 48 : 70, height: 43, rotation: -2, zIndex: 1 },
    { id: "image-b", type: "image", imageUrl: imageData(colors.slice().reverse(), "Matière", true), label: "Matière", description: "", x: density === "dense" ? 57 : 24, y: density === "dense" ? 27 : 53, width: density === "dense" ? 36 : 55, height: density === "dense" ? 53 : 38, rotation: 3, zIndex: 2 },
    { id: "color", type: "color", color: colors[1] || colors[0], label: "Couleur", description: "", x: 58, y: 5, width: 34, height: 18, rotation: 0, zIndex: 0 },
    { id: "word", type: "keyword", label: "Singularité", description: "", textColor: colors[0], fontSize: 24, x: 5, y: 54, width: 42, height: 13, rotation: density === "dense" ? -4 : 0, zIndex: 3 },
  ];
  if (density === "dense") {
    items.push(
      { id: "word-b", type: "keyword", label: "Présence", description: "", textColor: colors[2] || colors[0], fontSize: 19, x: 5, y: 72, width: 35, height: 14, rotation: 0, zIndex: 4 },
      { id: "color-b", type: "color", color: colors[2] || colors[0], label: "", description: "", x: 44, y: 72, width: 12, height: 15, rotation: 7, zIndex: 5 },
    );
  }
  return items;
}

function fixture(name: string, options: FixtureOptions): GeneratedBrandGuide {
  const colors = palette(options.palette, options.colorCount);
  const hasLogo = Boolean(options.logo);
  return {
    brandName: name,
    brandAssets: {
      logoUrl: hasLogo ? logoData(name, options.palette, options.logo === "vertical") : undefined,
      logoAspectRatio: options.logo === "vertical" ? 0.67 : options.logo ? 3.43 : undefined,
      logoOwner: name,
      logoAlt: hasLogo ? `Logo de ${name}` : undefined,
    },
    baseline: "Faire émerger ce qui mérite d’être reconnu.",
    generatedAt: "2026-07-27T09:00:00.000Z",
    completion: { hasAnyData: true, warning: "", items: [] },
    cover: { title: "", subtitle: "", introLine: "" },
    introduction: "",
    dna: {
      activity: "Conseil, création et transmission autour d’une expertise singulière.",
      essence: "Donner une forme juste à ce qui compte.",
      mission: "Rendre les idées plus claires, plus sensibles et immédiatement reconnaissables.",
      vision: options.partial ? "" : "Faire grandir des marques capables de créer une relation durable.",
      values: [
        "1 · Valeur: Écoute · Cela signifie que je: comprends avant de proposer · Dans la pratique: des échanges attentifs et des décisions partagées · Dans la communication: une parole humaine et précise",
        "2 · Valeur: Clarté · Cela signifie que je: rends les choix lisibles · Dans la pratique: une méthode simple et structurée · Dans la communication: des mots directs et accessibles",
        "3 · Valeur: Exigence · Cela signifie que je: soigne chaque détail utile · Dans la pratique: une qualité constante · Dans la communication: une expression sobre et assurée",
      ],
      promise: "Une direction claire qui transforme chaque prise de parole.",
    },
    positioning: {
      target: "Des entreprises en phase de structuration.",
      context: "Une expertise solide qui mérite une expression plus cohérente.",
      problem: "",
      differentiation: "Une approche qui relie stratégie, récit et langage visuel.",
      competitors: "",
      finalPositioning: "La marque qui transforme une expertise complexe en présence claire et mémorable.",
      pitch: "",
    },
    personality: {
      persona: "Une présence cultivée, attentive et confiante.",
      traits: options.traits,
      relationship: "Elle guide avec assurance, nuance et proximité.",
      tone: options.traits.join(", "),
      wordsToUse: ["justesse", "élan", "présence", "clarté"],
      wordsToAvoid: ["disruptif", "solution 360", "révolutionnaire"],
    },
    baselineSection: { final: "Faire émerger ce qui mérite d’être reconnu.", variants: [], recommendedUses: [] },
    visualUniverse: {
      palette: { primary: colors.filter((color) => color.role === "primary"), secondary: colors.filter((color) => color.role === "secondary") },
      ambiance: options.ambiance,
      graphicElements: "Aplats, matière, rythme typographique, formes composées",
      moodboardBackground: options.palette.at(-1) || "#F5F5F2",
      prioritySupports: [],
      moodboard: moodboard(name, options.palette, options.moodboard),
    },
    applicationRules: { social: [], website: [], presentations: [], salesDocs: [], prioritySupports: [] },
    checklists: { visual: [], editorial: [], support: [], evolution: [] },
    expressSummary: { mission: "", positioning: "", tone: [], palette: [], promise: "", baseline: "" },
  };
}

const scenarios: Record<string, GeneratedBrandGuide> = {
  "douce-naturelle": fixture("Atelier Sève", { palette: ["#476B55", "#DCE6D6", "#C79D72", "#FBF8F1"], traits: ["Douce", "Naturelle", "Sensible"], ambiance: "Organique, végétale, tactile et apaisante", logo: "vertical", moodboard: "dense" }),
  "premium-minimaliste": fixture("Maison Orbe", { palette: ["#171719", "#EAE5DC", "#A68A60"], traits: ["Élégante", "Premium", "Minimaliste"], ambiance: "Raffinée, silencieuse et architecturale", logo: "horizontal", moodboard: "minimal" }),
  "creative-coloree": fixture("Studio Météore", { palette: ["#5B2EFF", "#FF695D", "#FFD84D", "#E6FFF7"], traits: ["Créative", "Audacieuse", "Expressive"], ambiance: "Créative, colorée, vive et graphique", moodboard: "dense" }),
  "structuree": fixture("Méthode Nord", { palette: ["#17324D", "#D7E2EA", "#E6532F"], traits: ["Structurée", "Précise", "Rassurante"], ambiance: "Contemporaine, précise et méthodique", logo: "horizontal", moodboard: "minimal" }),
  "sans-logo": fixture("Sillage", { palette: ["#3D4A42", "#ECE5D8", "#B46E4F"], traits: ["Humaine", "Calme", "Chaleureuse"], ambiance: "Chaleureuse, éditoriale et humaine", moodboard: "dense" }),
  "logo-horizontal": fixture("Trame Claire", { palette: ["#273B47", "#EEF1EC", "#DB755E"], traits: ["Claire", "Moderne", "Accessible"], ambiance: "Contemporaine et lumineuse", logo: "horizontal", moodboard: "dense" }),
  "logo-vertical": fixture("Éclat", { palette: ["#6B243D", "#F4DDD9", "#DFAF55"], traits: ["Sensible", "Élégante", "Singulière"], ambiance: "Douce, élégante et sensible", logo: "vertical", moodboard: "minimal" }),
  "palette-trois": fixture("Trois Tons", { palette: ["#223129", "#E7DEC8", "#CB633D"], colorCount: 3, traits: ["Organique", "Sobre"], ambiance: "Naturelle et structurée", logo: "horizontal" }),
  "palette-huit": fixture("Chromatique", { palette: ["#3320A8", "#FF5C82", "#FFB52E", "#28B6A1"], colorCount: 8, traits: ["Vive", "Graphique", "Audacieuse"], ambiance: "Contrastée, vive et graphique", logo: "horizontal" }),
  "moodboard-dense": fixture("Collection Libre", { palette: ["#263238", "#F2C94C", "#EB5757", "#F4F1EA"], traits: ["Créative", "Expressive"], ambiance: "Collage créatif et expressif", logo: "horizontal", moodboard: "dense" }),
  "moodboard-minimal": fixture("Silence", { palette: ["#20201F", "#F5F2EC", "#B5A58B"], traits: ["Minimaliste", "Premium"], ambiance: "Minimaliste et silencieuse", logo: "horizontal", moodboard: "minimal" }),
  "guide-incomplet": fixture("Point Initial", { palette: ["#315E68", "#EDF2F0", "#D89B6A"], traits: ["Claire"], ambiance: "Simple et contemporaine", partial: true, moodboard: "minimal" }),
  "guide-complet": fixture("Édition Commune", { palette: ["#4E3832", "#F0E3D4", "#D17A4B", "#738575"], traits: ["Éditoriale", "Chaleureuse", "Structurée"], ambiance: "Éditoriale, chaleureuse et structurée", logo: "horizontal", moodboard: "dense" }),
};

async function renderPages(pdf: Buffer, scenario: string, expectedDensity: number[]) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({ data: new Uint8Array(pdf) }).promise;
  const directory = path.join(output, scenario);
  await mkdir(directory, { recursive: true });
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.4 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvas: canvas as never, canvasContext: canvas.getContext("2d") as never, viewport }).promise;
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    const samples = new Set<string>();
    for (let index = 0; index < pixels.length; index += 4 * 220) samples.add(`${pixels[index]}-${pixels[index + 1]}-${pixels[index + 2]}`);
    const png = path.join(directory, `page-${String(pageNumber).padStart(2, "0")}.png`);
    await writeFile(png, canvas.toBuffer("image/png"));
    if (samples.size < 4) throw new Error(`${scenario}, page ${pageNumber}: page visuellement vide`);
    pages.push({ page: pageNumber, expectedDensity: expectedDensity[pageNumber - 1], sampledColors: samples.size, image: png });
  }
  return pages;
}

async function main() {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const report: Record<string, unknown> = {};
  for (const [name, guide] of Object.entries(scenarios)) {
    const identity = buildBrandVisualIdentity(guide);
    const theme = createBrandGuideTheme(identity);
    const data = createBrandGuideData(guide);
    const validation = validateBrandGuideData(data);
    if (!validation.valid) throw new Error(`${name}: ${validation.conflicts.join(", ")}`);
    const composition = composeEditorialPages({ data, identity, direction: theme.direction });
    const pdf = await renderBrandGuidePdf(guide);
    const pdfPath = path.join(output, `${name}.pdf`);
    await writeFile(pdfPath, pdf);
    const pages = await renderPages(pdf, name, composition.pages.map((page) => page.density));
    report[name] = { direction: theme.direction, palette: identity.colors.map((color) => color.hex), pdf: pdfPath, pages };
  }
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  console.info(`Tests visuels générés dans ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
