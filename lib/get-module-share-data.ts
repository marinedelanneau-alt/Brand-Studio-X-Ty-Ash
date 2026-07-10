import type { ModuleSummaryCard } from "@/lib/module-summary";
import type { WorkspaceModule } from "@/lib/training-types";

export type ModuleShareData = {
  brandName: string;
  moduleKey: string;
  moduleTitle: string;
  progress: number;
  completedAt: string;
  keywords: string[];
  shareSentence: string;
  themeColors: {
    background: string;
    surface: string;
    accent: string;
    accentSoft: string;
    text: string;
    muted: string;
  };
};

const FALLBACK_COLORS = {
  background: "#fbf4ea",
  surface: "#fffdf8",
  accent: "#cf7430",
  accentSoft: "#f1cc56",
  text: "#332d35",
  muted: "#6f645b",
};

export function slugifyModuleKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "module";
}

export function slugifyFilePart(value: string) {
  return slugifyModuleKey(value).slice(0, 80) || "marque";
}

export function getModuleShareData(input: {
  brandName: string;
  module: WorkspaceModule;
  summary: ModuleSummaryCard;
  completedAt?: string;
}): ModuleShareData {
  const moduleTitle = input.module.title;
  const moduleKey = slugifyModuleKey(moduleTitle);
  const keywords = getKeywords(input.summary, moduleTitle);

  return {
    brandName: input.brandName.trim() || "Ma marque",
    moduleKey,
    moduleTitle,
    progress: input.module.progress.completionPercent,
    completedAt: input.completedAt ?? new Date().toISOString(),
    keywords,
    shareSentence: getShareSentence(moduleTitle),
    themeColors: FALLBACK_COLORS,
  };
}

function getKeywords(summary: ModuleSummaryCard, moduleTitle: string) {
  const normalizedTitle = moduleTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalizedTitle.includes("vision")) {
    return ["Mission", "Vision", "Promesse", "Valeurs"];
  }

  if (normalizedTitle.includes("positionnement")) {
    return ["Cible", "Difference", "Positionnement"];
  }

  if (normalizedTitle.includes("personnalite") || normalizedTitle.includes("ton")) {
    return ["Persona", "Ton", "Expression"];
  }

  const fromSummary = summary.focusWords
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => word.length <= 28);

  if (fromSummary.length >= 2) {
    return [...new Set(fromSummary)].slice(0, 4);
  }

  return ["Clarite", "Action", "Communication"];
}

function getShareSentence(moduleTitle: string) {
  const normalizedTitle = moduleTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalizedTitle.includes("vision")) {
    return "Je viens de clarifier les fondations de ma marque.";
  }

  if (normalizedTitle.includes("positionnement")) {
    return "Je construis une marque plus claire et plus coherente.";
  }

  if (normalizedTitle.includes("personnalite") || normalizedTitle.includes("ton")) {
    return "Ma marque trouve sa voix.";
  }

  return "Ma marque prend forme.";
}
