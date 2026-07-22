import "server-only";

import { findFinalAnswerCandidate } from "@/lib/brand-guide-final-answers";
import { parseStoredBrandPersonaConfig, getBrandPersonaFields } from "@/lib/brand-persona";
import {
  getPaletteColorCss,
  parseStoredColorPaletteAnswer,
  type PaletteColor,
} from "@/lib/color-palette";
import {
  getPromptOpenLabel,
  parseChecklistEntries,
  parseIndexedAnswerItems,
  parseStoredTableConfig,
} from "@/lib/exercise-types";
import { analyzeMoodboard, parseStoredMoodboardAnswer, type MoodboardAnswer } from "@/lib/moodboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BrandProject, ModuleExercise, WorkspaceModule } from "@/lib/training-types";

type AnswerSource = {
  module: WorkspaceModule;
  exercise: ModuleExercise;
  label: string;
  values: string[];
  text: string;
};

export type GuideColor = {
  id: string;
  name: string;
  usage: string;
  css: string;
  hex: string;
  role: "primary" | "secondary";
};

export type GuideMoodboardItem = {
  id: string;
  type: "image" | "color" | "text" | "keyword" | "icon";
  imageUrl?: string;
  color?: string;
  label: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  cropX?: number;
  cropY?: number;
  textColor?: string;
  fontSize?: number;
};

export type GuideCompletionItem = {
  key: string;
  label: string;
  status: "ok" | "missing" | "optional";
  moduleHref?: string;
};

export type GeneratedBrandGuide = {
  brandName: string;
  baseline: string;
  generatedAt: string;
  completion: {
    hasAnyData: boolean;
    warning: string;
    items: GuideCompletionItem[];
  };
  cover: {
    title: string;
    subtitle: string;
    introLine: string;
  };
  introduction: string;
  dna: {
    activity: string;
    essence: string;
    mission: string;
    vision: string;
    values: string[];
    promise: string;
  };
  positioning: {
    target: string;
    context: string;
    problem: string;
    differentiation: string;
    competitors: string;
    finalPositioning: string;
    pitch: string;
  };
  personality: {
    persona: string;
    traits: string[];
    relationship: string;
    tone: string;
    wordsToUse: string[];
    wordsToAvoid: string[];
  };
  baselineSection: {
    final: string;
    variants: string[];
    recommendedUses: string[];
  };
  visualUniverse: {
    palette: {
      primary: GuideColor[];
      secondary: GuideColor[];
    };
    ambiance: string;
    graphicElements: string;
    moodboardBackground: string;
    prioritySupports: string[];
    moodboard: GuideMoodboardItem[];
  };
  applicationRules: {
    social: string[];
    website: string[];
    presentations: string[];
    salesDocs: string[];
    prioritySupports: string[];
  };
  checklists: {
    visual: string[];
    editorial: string[];
    support: string[];
    evolution: string[];
  };
  expressSummary: {
    mission: string;
    positioning: string;
    tone: string[];
    palette: string[];
    promise: string;
    baseline: string;
  };
};

export type BrandExportRecord = {
  id: number;
  project_id: number;
  export_type: "brand_guide";
  file_url: string | null;
  generated_at: string;
  guide_snapshot: GeneratedBrandGuide;
};

const MISSING = {
  activity: "Activité à compléter dans le module Vision & marque.",
  essence: "ADN de marque à compléter dans le module Vision & marque.",
  mission: "Mission à compléter dans le module Vision & marque.",
  vision: "Vision à compléter dans le module Vision & marque.",
  values: "Valeurs à compléter dans le module Vision & marque.",
  promise: "Promesse à compléter dans le module Vision & marque.",
  positioning: "Positionnement à compléter dans le module Positionnement.",
  tone: "Ton de marque à compléter dans le module Personnalité & ton.",
  palette: "Palette ou intention visuelle à compléter dans le module Palette de couleurs.",
};

function compactText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeForSearch(value: string) {
  return compactText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function splitList(value: string) {
  return compactText(value)
    .split(/\s*(?:,|;|\||\n| - )\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sentence(value: string, fallback: string) {
  const text = compactText(value);
  if (!text) return fallback;
  return text.endsWith(".") || text.endsWith("!") || text.endsWith("?") ? text : `${text}.`;
}

function hasRealValue(value: string) {
  return compactText(value).length > 0 && !normalizeForSearch(value).includes("a completer");
}

function getExerciseLabel(exercise: ModuleExercise) {
  if (exercise.type === "prompt_open") {
    return getPromptOpenLabel(exercise.question);
  }

  return exercise.question;
}

function summarizeTable(exercise: ModuleExercise, values: string[]) {
  const tableConfig = parseStoredTableConfig(exercise.options);
  return Array.from({ length: tableConfig.rows }, (_, rowIndex) => {
    const rowValues = Array.from({ length: tableConfig.columns }, (_, columnIndex) => {
      const value = compactText(values[rowIndex * tableConfig.columns + columnIndex]);
      if (!value) return "";
      const columnLabel = tableConfig.columnLabels[columnIndex] || `Colonne ${columnIndex + 1}`;
      return `${columnLabel}: ${value}`;
    }).filter(Boolean);

    if (rowValues.length === 0) return "";
    const rowLabel = tableConfig.rowLabels[rowIndex] || `Ligne ${rowIndex + 1}`;
    return `${rowLabel} - ${rowValues.join(", ")}`;
  }).filter(Boolean);
}

function buildAnswerText(exercise: ModuleExercise, values: string[]) {
  if (values.length === 0) return "";

  if (exercise.type === "brand_persona") {
    const fields = getBrandPersonaFields(parseStoredBrandPersonaConfig(exercise.options));
    const indexedAnswers = parseIndexedAnswerItems(values);
    return fields
      .map((field, fieldIndex) => {
        const fieldValues = indexedAnswers
          .filter((item) => item.questionIndex === fieldIndex)
          .sort((left, right) => left.valueIndex - right.valueIndex)
          .map((item) => compactText(item.value))
          .filter(Boolean);
        return fieldValues.length > 0 ? `${field.label}: ${fieldValues.join(", ")}` : "";
      })
      .filter(Boolean)
      .join(" | ");
  }

  if (exercise.type === "checklist") {
    const entries = parseChecklistEntries(values);
    const checked = entries.filter((entry) => entry.checked).map((entry) => entry.label);
    return (checked.length > 0 ? checked : entries.map((entry) => entry.label)).join(", ");
  }

  if (exercise.type === "table") {
    return summarizeTable(exercise, values).join(" | ");
  }

  const indexedAnswers = parseIndexedAnswerItems(values);
  if (indexedAnswers.length > 0) {
    return indexedAnswers
      .sort((left, right) =>
        left.questionIndex === right.questionIndex
          ? left.valueIndex - right.valueIndex
          : left.questionIndex - right.questionIndex,
      )
      .map((item) => item.value)
      .map(compactText)
      .filter(Boolean)
      .join(", ");
  }

  return values.map(compactText).filter(Boolean).join(", ");
}

function collectSources(modules: WorkspaceModule[]) {
  return modules.flatMap((module) =>
    module.exercises.flatMap((exercise) => {
      const values = module.answers[exercise.id] ?? [];
      const text = buildAnswerText(exercise, values);
      return text
        ? [{
            module,
            exercise,
            label: getExerciseLabel(exercise),
            values,
            text,
          } satisfies AnswerSource]
        : [];
    }),
  );
}

function findSource(sources: AnswerSource[], keywordGroups: string[][]) {
  return sources.find((source) => {
    const haystack = normalizeForSearch(
      `${source.module.title} ${source.label} ${source.text}`,
    );
    return keywordGroups.some((group) =>
      group.every((keyword) => haystack.includes(normalizeForSearch(keyword))),
    );
  });
}

function findText(sources: AnswerSource[], keywordGroups: string[][], fallback: string) {
  return findSource(sources, keywordGroups)?.text || fallback;
}

function findFinalAnswerSource(
  sources: AnswerSource[],
  concept: "promise" | "positioning",
) {
  return findFinalAnswerCandidate(
    sources.map((source) => ({
      ...source,
      type: source.exercise.type,
    })),
    concept,
  );
}

function moduleHref(source: AnswerSource | undefined) {
  return source ? `/mon-espace/module/position-${source.module.position}?mode=exercises` : undefined;
}

function collectPersonaValue(
  sources: AnswerSource[],
  fieldKeywords: string[],
  fallback = "",
) {
  const source = sources.find((item) => item.exercise.type === "brand_persona");
  if (!source) return fallback;
  const fields = getBrandPersonaFields(parseStoredBrandPersonaConfig(source.exercise.options));
  const indexedAnswers = parseIndexedAnswerItems(source.values);
  const fieldIndex = fields.findIndex((field) => {
    const label = normalizeForSearch(`${field.id} ${field.label}`);
    return fieldKeywords.some((keyword) => label.includes(normalizeForSearch(keyword)));
  });
  if (fieldIndex < 0) return fallback;

  return indexedAnswers
    .filter((item) => item.questionIndex === fieldIndex)
    .sort((left, right) => left.valueIndex - right.valueIndex)
    .map((item) => compactText(item.value))
    .filter(Boolean)
    .join(", ") || fallback;
}

function collectColors(sources: AnswerSource[]) {
  const source = sources.find((item) => item.exercise.type === "color_palette");
  const parsed = source
    ? parseStoredColorPaletteAnswer(source.values)
    : null;

  function mapColor(color: PaletteColor, role: "primary" | "secondary"): GuideColor {
    return {
      id: color.id,
      name: color.name || (role === "primary" ? "Couleur principale" : "Couleur secondaire"),
      usage: color.usage || "Usage à préciser dans la palette.",
      css: getPaletteColorCss(color),
      hex: color.mode === "gradient" ? `${color.from} -> ${color.to}` : color.hex,
      role,
    };
  }

  return {
    primary: (parsed?.primaryColors ?? []).map((color) => mapColor(color, "primary")),
    secondary: (parsed?.secondaryColors ?? []).map((color) => mapColor(color, "secondary")),
  };
}

function collectMoodboard(sources: AnswerSource[]) {
  const source = sources.find((item) => item.exercise.type === "moodboard");
  const answer: MoodboardAnswer | null = source ? parseStoredMoodboardAnswer(source.values) : null;

  return {
    ambiance: answer?.ambiance || (answer ? analyzeMoodboard(answer) : ""),
    backgroundColor: answer?.backgroundColor || "#F5E8C8",
    items: (answer?.blocks ?? []).slice(0, 16).map((block) => {
      const frame = {
        x: block.x,
        y: block.y,
        width: block.w,
        height: block.h,
        rotation: block.rotation,
        zIndex: block.zIndex,
      };

      if (block.type === "image") {
        return {
          ...frame,
          id: block.id,
          type: "image" as const,
          imageUrl: block.imageUrl,
          cropX: block.cropX,
          cropY: block.cropY,
          label: block.altText || block.caption || "Inspiration",
          description: block.caption || "Référence visuelle du moodboard.",
        };
      }

      if (block.type === "color") {
        return {
          ...frame,
          id: block.id,
          type: "color" as const,
          color: block.color,
          label: block.label || "Couleur",
          description: block.usage || "Rôle visuel à préciser.",
        };
      }

      if (block.type === "text") {
        return {
          ...frame,
          id: block.id,
          type: "text" as const,
          label: block.text || "Note d'ambiance",
          description: block.author || "Moodboard",
          textColor: block.textColor,
          fontSize: block.fontSize,
        };
      }

      if (block.type === "icon") {
        return {
          ...frame,
          id: block.id,
          type: "icon" as const,
          color: block.color,
          imageUrl: block.imageUrl,
          label: block.altText || block.label || "Pictogramme",
          description: block.icon,
        };
      }

      return {
        ...frame,
        id: block.id,
        type: "keyword" as const,
        label: block.keyword || "Mot-cle",
        description: "Mot d'ambiance.",
        textColor: block.textColor,
        fontSize: block.fontSize,
      };
    }),
  };
}

export function describeMoodboardElements(items: GuideMoodboardItem[]) {
  const labels = items
    .map((item) => compactText(item.label))
    .filter(Boolean)
    .filter((label, index, allLabels) =>
      allLabels.findIndex((candidate) => normalizeForSearch(candidate) === normalizeForSearch(label)) === index,
    )
    .slice(0, 12);

  return labels.length > 0
    ? labels.join(", ")
    : "Moodboard à compléter dans le module Univers visuel.";
}

function listFromText(text: string, fallback: string[]) {
  const items = splitList(text).slice(0, 8);
  return items.length > 0 ? items : fallback;
}

function buildPitch(brandName: string, target: string, problem: string, promise: string) {
  if (!hasRealValue(target) || !hasRealValue(problem) || !hasRealValue(promise)) {
    return "Pitch à finaliser lorsque la cible, le problème résolu et la promesse seront complétés.";
  }

  return `${brandName} aide ${target} à dépasser ${problem} grâce à une promesse claire : ${promise}`;
}

export function generateGuideFromAnswers(input: {
  project: BrandProject;
  modules: WorkspaceModule[];
  brandName?: string | null;
}) {
  return generateBrandGuide(input);
}

export function generateBrandGuide(input: {
  project: BrandProject;
  modules: WorkspaceModule[];
  brandName?: string | null;
}): GeneratedBrandGuide {
  const sources = collectSources(input.modules);
  const brandName = compactText(input.brandName) || compactText(input.project.name) || "Ma marque";
  const colors = collectColors(sources);
  const moodboard = collectMoodboard(sources);

  const missionSource = findSource(sources, [["mission"]]);
  const positioningSource = findFinalAnswerSource(sources, "positioning");
  const promiseSource = findFinalAnswerSource(sources, "promise");
  const toneSource = findSource(sources, [["ton"], ["voix"]]);
  const paletteSource = sources.find((item) => item.exercise.type === "color_palette");

  const activity = findText(sources, [["activite"], ["metier"], ["description", "marque"]], MISSING.activity);
  const essence = findText(sources, [["adn"], ["raison", "etre"], ["essence"]], MISSING.essence);
  const mission = findText(sources, [["mission"]], MISSING.mission);
  const vision = findText(sources, [["vision"]], MISSING.vision);
  const promise = promiseSource?.text || MISSING.promise;
  const target = findText(sources, [["cible"], ["audience"], ["client", "ideal"]], "Cible principale à compléter dans le module Positionnement.");
  const problem = findText(sources, [["probleme"], ["frustration"], ["douleur"]], "Problème client à compléter dans le module Positionnement.");
  const differentiation = findText(sources, [["differenciation"], ["different"], ["singulier"]], "Différenciation à compléter dans le module Positionnement.");
  const competitors = findText(sources, [["concurrent"]], "Concurrents à renseigner si utile.");
  const finalPositioning = positioningSource?.text || MISSING.positioning;
  const baseline = findText(sources, [["baseline"], ["slogan"], ["signature"]], "Baseline à compléter dans le module Baseline.");
  const traitsText =
    collectPersonaValue(sources, ["dominant_traits", "traits dominants"]) ||
    findText(sources, [["trait"], ["personnalite"]], "");
  const tone =
    collectPersonaValue(sources, ["tone_of_voice", "ton de voix"]) ||
    findText(sources, [["ton"], ["voix"]], MISSING.tone);
  const persona =
    collectPersonaValue(sources, ["final_summary_sentence", "phrase", "resume"]) ||
    collectPersonaValue(sources, ["persona_first_name", "prenom"]) ||
    findText(sources, [["persona"]], "Persona de marque à compléter dans le module Persona.");
  const relationship =
    collectPersonaValue(sources, ["communication_style", "style de communication"]) ||
    collectPersonaValue(sources, ["welcome_style", "accueille"]) ||
    "Posture relationnelle à compléter dans le module Personnalité & ton.";
  const visualAmbiance =
    moodboard.ambiance ||
    collectPersonaValue(sources, ["visual_mood", "ambiance visuelle"]) ||
    findText(sources, [["ambiance"], ["univers", "visuel"]], "Ambiance visuelle à compléter dans le module Moodboard.");
  const supports = listFromText(
    findText(sources, [["support"], ["application"], ["reseaux"], ["site web"]], ""),
    ["Reseaux sociaux", "Site web", "Presentations", "Documents commerciaux"],
  );

  const primaryColorNames = colors.primary.map((color) => color.name);
  const toneWords = listFromText(traitsText || tone, ["Clair", "Coherent", "Professionnel"]).slice(0, 3);
  const values = listFromText(
    findText(sources, [["valeur"]], ""),
    [MISSING.values],
  );
  const wordsToUse = listFromText(
    findText(sources, [["mots", "utiliser"], ["vocabulaire", "privilegier"]], ""),
    ["Mots alignés avec le ton de marque à compléter."],
  );
  const wordsToAvoid = listFromText(
    findText(sources, [["mots", "eviter"], ["vocabulaire", "eviter"]], ""),
    ["Mots à éviter à compléter."],
  );

  const completionItems: GuideCompletionItem[] = [
    { key: "brandName", label: "Nom de marque", status: hasRealValue(brandName) ? "ok" : "missing" },
    { key: "mission", label: "Mission", status: hasRealValue(mission) ? "ok" : "missing", moduleHref: moduleHref(missionSource) },
    { key: "positioning", label: "Positionnement", status: hasRealValue(finalPositioning) ? "ok" : "missing", moduleHref: moduleHref(positioningSource) },
    { key: "promise", label: "Promesse", status: hasRealValue(promise) ? "ok" : "missing", moduleHref: moduleHref(promiseSource) },
    { key: "tone", label: "Ton", status: hasRealValue(tone) ? "ok" : "missing", moduleHref: moduleHref(toneSource) },
    {
      key: "palette",
      label: "Palette",
      status: colors.primary.length > 0 || hasRealValue(visualAmbiance) ? "ok" : "missing",
      moduleHref: moduleHref(paletteSource),
    },
    {
      key: "moodboard",
      label: "Moodboard",
      status: moodboard.items.length > 0 ? "ok" : "optional",
    },
  ];
  const missingRequiredCount = completionItems.filter((item) => item.status === "missing").length;

  return {
    brandName,
    baseline,
    generatedAt: new Date().toISOString(),
    completion: {
      hasAnyData: sources.length > 0,
      warning:
        sources.length === 0
          ? "Aucune réponse n'est encore disponible pour générer le guide."
          : missingRequiredCount > 0
            ? "Ton guide peut être généré, mais certaines sections seront incomplètes."
            : "Ton Guide de Marque est prêt.",
      items: completionItems,
    },
    cover: {
      title: `Guide de Marque - ${brandName}`,
      subtitle: baseline,
      introLine: `Une marque ${toneWords.join(", ").toLowerCase()} qui avance avec coherence.`,
    },
    introduction: `Ce guide rassemble les fondations stratégiques, verbales et visuelles de ${brandName}. Il sert de référence pour créer des contenus, guider les visuels et garder une communication cohérente dans le temps.`,
    dna: {
      activity,
      essence,
      mission,
      vision,
      values,
      promise,
    },
    positioning: {
      target,
      context: findText(sources, [["contexte"], ["situation", "client"]], "Contexte client à préciser dans le module Positionnement."),
      problem,
      differentiation,
      competitors,
      finalPositioning,
      pitch: buildPitch(brandName, target, problem, promise),
    },
    personality: {
      persona,
      traits: toneWords,
      relationship,
      tone,
      wordsToUse,
      wordsToAvoid,
    },
    baselineSection: {
      final: baseline,
      variants: listFromText(findText(sources, [["variante"], ["baseline"]], ""), []).filter((item) => item !== baseline),
      recommendedUses: [
        "Couverture de presentation et documents commerciaux.",
        "Bio de reseaux sociaux lorsque l'espace le permet.",
        "Introduction courte sur le site ou les supports de vente.",
      ],
    },
    visualUniverse: {
      palette: colors,
      ambiance: visualAmbiance,
      graphicElements: describeMoodboardElements(moodboard.items),
      moodboardBackground: moodboard.backgroundColor,
      prioritySupports: supports,
      moodboard: moodboard.items,
    },
    applicationRules: {
      social: [
        "Utiliser le ton defini avant de publier un contenu.",
        "Conserver une présence visuelle régulière avec les couleurs principales.",
        "Faire ressortir une idée forte par publication.",
      ],
      website: [
        "Faire apparaitre clairement la promesse des les premiers ecrans.",
        "Garder la palette principale pour les zones de décision et de repère.",
        "Utiliser la baseline comme signature, pas comme texte explicatif principal.",
      ],
      presentations: [
        "Ouvrir avec le positionnement et la promesse.",
        "Limiter chaque page à une idée directrice.",
        "Reprendre les couleurs et les mots-clefs de la marque.",
      ],
      salesDocs: [
        "Mettre en avant le probleme resolu et la difference de la marque.",
        "Utiliser un vocabulaire clair, concret et cohérent avec le ton.",
        "Terminer par une action simple à comprendre.",
      ],
      prioritySupports: supports,
    },
    checklists: {
      visual: [
        "La palette principale est-elle respectee ?",
        "Le niveau de contraste rend-il le texte lisible ?",
        "L'ambiance correspond-elle au moodboard ?",
        "Le visuel reste-t-il cohérent avec la promesse ?",
      ],
      editorial: [
        "Le message parle-t-il clairement à la cible ?",
        "Le ton correspond-il aux traits de marque ?",
        "Les mots à privilégier sont-ils présents ?",
        "Les mots à éviter ont-ils été retirés ?",
      ],
      support: [
        "Le support a-t-il un objectif unique ?",
        "La baseline et la promesse sont-elles utilisees au bon endroit ?",
        "La hierarchie visuelle facilite-t-elle la lecture ?",
      ],
      evolution: [
        "La modification renforce-t-elle l'ADN de marque ?",
        "Le positionnement reste-t-il reconnaissable ?",
        "Les nouveaux choix peuvent-ils être réutilisés sur plusieurs supports ?",
      ],
    },
    expressSummary: {
      mission: sentence(mission, MISSING.mission),
      positioning: sentence(finalPositioning, MISSING.positioning),
      tone: toneWords,
      palette: primaryColorNames.length > 0 ? primaryColorNames : [MISSING.palette],
      promise: sentence(promise, MISSING.promise),
      baseline,
    },
  };
}

export async function enhanceGuideWithAI(guide: GeneratedBrandGuide) {
  return guide;
}

export async function getLatestBrandGuideExport(projectId: number) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brand_exports")
    .select("*")
    .eq("project_id", projectId)
    .eq("export_type", "brand_guide")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle<BrandExportRecord>();

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("could not find the table") || message.includes("schema cache")) {
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

export async function saveBrandGuideSnapshot(input: {
  projectId: number;
  guide: GeneratedBrandGuide;
}) {
  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("brand_exports").insert({
    project_id: input.projectId,
    export_type: "brand_guide",
    file_url: null,
    generated_at: now,
    guide_snapshot: input.guide,
  });

  if (error) {
    throw new Error(error.message);
  }
}
