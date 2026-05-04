export type BrandPersonaFieldType = "text" | "textarea" | "checkbox" | "select";

export type BrandPersonaQuestion = {
  id: string;
  section: string;
  label: string;
  helperText: string;
  placeholder: string;
  fieldType: BrandPersonaFieldType;
  required: boolean;
  order: number;
  example: string;
  isActive: boolean;
  options: string[];
};

export type BrandPersonaSection = {
  id: string;
  key: string;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
  questions: BrandPersonaQuestion[];
};

export type BrandPersonaConfig = {
  version: number;
  isActive: boolean;
  summaryCtaLabel: string;
  sections: BrandPersonaSection[];
};

const BRAND_PERSONA_CONFIG_PREFIX = "__brand_persona_config__:";

function createQuestion(
  section: string,
  order: number,
  input: Omit<BrandPersonaQuestion, "section" | "order" | "required" | "isActive" | "options"> &
    Partial<Pick<BrandPersonaQuestion, "required" | "isActive" | "options">>,
): BrandPersonaQuestion {
  return {
    section,
    order,
    required: input.required ?? false,
    isActive: input.isActive ?? true,
    options: input.options ?? [],
    ...input,
  };
}

export function getDefaultBrandPersonaConfig(): BrandPersonaConfig {
  return {
    version: 1,
    isActive: true,
    summaryCtaLabel: "Utiliser ce persona pour guider mon ton de marque",
    sections: [
      {
        id: "identity",
        key: "identity",
        title: "Identite de base",
        description:
          "Pose les fondations de cette personne-marque pour lui donner un visage clair et memorisable.",
        order: 1,
        isActive: true,
        questions: [
          createQuestion("identity", 1, {
            id: "persona_first_name",
            label: "Prenom du persona",
            helperText: "Choisis un prenom qui traduit l'aura de ta marque.",
            placeholder: "Ex. Lumiere",
            fieldType: "text",
            example: "",
            required: true,
          }),
          createQuestion("identity", 2, {
            id: "persona_age_approx",
            label: "Age approximatif",
            helperText: "L'age peut etre reel ou symbolique.",
            placeholder: "Ex. 35 ans, mature et experimentee",
            fieldType: "text",
            example: "35 ans, mature et experimentee",
          }),
          createQuestion("identity", 3, {
            id: "persona_symbolic_profession",
            label: "Profession symbolique",
            helperText: "Un role qui exprime ce que ta marque apporte au monde.",
            placeholder: "Ex. Stratege bienveillante",
            fieldType: "text",
            example: "Stratege bienveillante",
            required: true,
          }),
          createQuestion("identity", 4, {
            id: "persona_summary_sentence",
            label: "Phrase qui resume cette personne",
            helperText: "Une phrase simple pour saisir son essence immediatement.",
            placeholder: "Ex. Une presence claire qui aide a avancer avec confiance.",
            fieldType: "textarea",
            example: "",
            required: true,
          }),
        ],
      },
      {
        id: "personality",
        key: "personality",
        title: "Personnalite & caractere",
        description:
          "Definis sa facon d'etre, d'entrer en relation et de faire passer ses idees.",
        order: 2,
        isActive: true,
        questions: [
          createQuestion("personality", 1, {
            id: "dominant_traits",
            label: "3 traits dominants",
            helperText: "Trois adjectifs suffisent pour fixer le cap.",
            placeholder: "Ex. Claire, structuree, rassurante",
            fieldType: "text",
            example: "Claire, structuree, rassurante",
            required: true,
          }),
          createQuestion("personality", 2, {
            id: "communication_style",
            label: "Style de communication",
            helperText: "Comment s'exprime-t-elle dans la forme ?",
            placeholder: "Ex. Pedagogique, chaleureux et precis",
            fieldType: "textarea",
            example: "Pedagogique, chaleureux et precis",
            required: true,
          }),
          createQuestion("personality", 3, {
            id: "tone_of_voice",
            label: "Ton de voix",
            helperText: "Le ton doit pouvoir guider tes textes et prises de parole.",
            placeholder: "Ex. Accessible sans etre familier, expert sans etre froid",
            fieldType: "textarea",
            example: "Accessible sans etre familier, expert sans etre froid",
            required: true,
          }),
          createQuestion("personality", 4, {
            id: "overall_energy",
            label: "Energie generale degagee",
            helperText: "Quelle impression laisse-t-elle quand elle entre dans une piece ?",
            placeholder: "Ex. Calme, lumineuse, solide et engageante",
            fieldType: "text",
            example: "",
          }),
        ],
      },
      {
        id: "style",
        key: "style",
        title: "Style & apparence",
        description:
          "Traduis sa personnalite en signaux visuels concrets pour inspirer ton univers de marque.",
        order: 3,
        isActive: true,
        questions: [
          createQuestion("style", 1, {
            id: "clothing_style",
            label: "Style vestimentaire",
            helperText: "Imagine son allure globale au premier regard.",
            placeholder: "Ex. Elegant decontracte, minimaliste et lumineux",
            fieldType: "text",
            example: "Elegant decontracte, minimaliste et lumineux",
          }),
          createQuestion("style", 2, {
            id: "colors_worn",
            label: "Couleurs portees",
            helperText: "Des couleurs qui donnent deja le ton sans parler.",
            placeholder: "Ex. Creme, camel, bleu encre, or doux",
            fieldType: "text",
            example: "",
          }),
          createQuestion("style", 3, {
            id: "signature_details",
            label: "Accessoires ou details distinctifs",
            helperText: "Les petits signes qui rendent ce persona memorable.",
            placeholder: "Ex. Carnet en cuir, lunettes fines, bague signature",
            fieldType: "textarea",
            example: "",
          }),
          createQuestion("style", 4, {
            id: "visual_mood",
            label: "Ambiance visuelle associee",
            helperText: "Atmosphere, textures, matieres, lumiere.",
            placeholder: "Ex. Editoriale, epuree, douce, premium",
            fieldType: "textarea",
            example: "",
          }),
        ],
      },
      {
        id: "values",
        key: "values",
        title: "Valeurs & convictions",
        description:
          "Ce bloc clarifie ce qui guide ses choix, ses prises de position et sa credibilite.",
        order: 4,
        isActive: true,
        questions: [
          createQuestion("values", 1, {
            id: "core_priority",
            label: "Ce qui compte le plus pour elle",
            helperText: "Sa priorite profonde au quotidien.",
            placeholder: "Ex. Rendre les decisions plus simples et plus justes",
            fieldType: "textarea",
            example: "",
            required: true,
          }),
          createQuestion("values", 2, {
            id: "defends",
            label: "Ce qu'elle defend",
            helperText: "Les idees ou comportements qu'elle porte activement.",
            placeholder: "Ex. La clarte, l'exigence utile et le respect du temps des gens",
            fieldType: "textarea",
            example: "",
          }),
          createQuestion("values", 3, {
            id: "intolerances",
            label: "Ce qu'elle ne tolere pas",
            helperText: "Ce qui va a l'encontre de sa posture.",
            placeholder: "Ex. Le flou, le jargon inutile, les promesses creuses",
            fieldType: "textarea",
            example: "Le flou, le jargon inutile, les promesses creuses",
            required: true,
          }),
          createQuestion("values", 4, {
            id: "credibility_source",
            label: "Ce qui la rend credible",
            helperText: "D'ou vient sa legitimite percue ?",
            placeholder: "Ex. Sa clarte, sa constance et la qualite de ses choix",
            fieldType: "textarea",
            example: "",
          }),
        ],
      },
      {
        id: "relationships",
        key: "relationships",
        title: "Relations & interactions",
        description:
          "Visualise la qualite de relation qu'elle installe avec son audience.",
        order: 5,
        isActive: true,
        questions: [
          createQuestion("relationships", 1, {
            id: "welcome_style",
            label: "Comment accueille-t-elle quelqu'un ?",
            helperText: "Premier contact, premier ton, premiere attention.",
            placeholder: "Ex. Avec chaleur, clarte et une vraie sensation d'etre attendu",
            fieldType: "textarea",
            example: "",
          }),
          createQuestion("relationships", 2, {
            id: "problem_reaction",
            label: "Comment reagit-elle face a un probleme ?",
            helperText: "Montre sa maturite relationnelle et professionnelle.",
            placeholder: "Ex. Elle calme le jeu, structure la suite et propose une direction nette",
            fieldType: "textarea",
            example: "",
          }),
          createQuestion("relationships", 3, {
            id: "advisor_type",
            label: "Quel type d'ami ou de conseiller serait-elle ?",
            helperText: "Decris le role qu'elle joue pour les autres.",
            placeholder: "Ex. Une amie lucide qui dit les choses avec tact et aide a trancher",
            fieldType: "textarea",
            example: "",
          }),
          createQuestion("relationships", 4, {
            id: "reassurance_style",
            label: "Comment rassure-t-elle son audience ?",
            helperText: "Qu'est-ce qui apaise et redonne confiance ?",
            placeholder: "Ex. Elle simplifie, explique et montre qu'un cap existe",
            fieldType: "textarea",
            example: "",
          }),
        ],
      },
      {
        id: "environment",
        key: "environment",
        title: "Environnement & univers",
        description:
          "Installe cette personne dans un decor pour rendre son monde tangible et inspirant.",
        order: 6,
        isActive: true,
        questions: [
          createQuestion("environment", 1, {
            id: "ideal_place",
            label: "Son lieu de vie ou de travail ideal",
            helperText: "Le cadre qui soutient son energie et sa facon de penser.",
            placeholder: "Ex. Un studio clair, calme, soigne et inspire",
            fieldType: "textarea",
            example: "",
          }),
          createQuestion("environment", 2, {
            id: "desk_objects",
            label: "Objets fetiches sur son bureau",
            helperText: "Des objets qui racontent son gout et sa methode.",
            placeholder: "Ex. Carnet creme, stylo lourd, bouquet sobre, echantillons matieres",
            fieldType: "textarea",
            example: "",
          }),
          createQuestion("environment", 3, {
            id: "music_ambience",
            label: "Musique ou ambiance qu'elle ecoute",
            helperText: "La bande-son de son univers.",
            placeholder: "Ex. Piano minimal, soul douce, ambiance feutree",
            fieldType: "text",
            example: "",
          }),
          createQuestion("environment", 4, {
            id: "defining_quote",
            label: "Citation qui la definit",
            helperText: "Une phrase qui capture sa philosophie.",
            placeholder: "Ex. Une marque claire permet de decider plus simplement.",
            fieldType: "textarea",
            example: "Une marque claire permet de decider plus simplement.",
            required: true,
          }),
        ],
      },
      {
        id: "summary",
        key: "summary",
        title: "Synthese finale",
        description:
          "Condense ce persona pour qu'il devienne un repere concret a chaque prise de parole.",
        order: 7,
        isActive: true,
        questions: [
          createQuestion("summary", 1, {
            id: "final_summary_sentence",
            label: "En une phrase, ma marque-persona est...",
            helperText: "Ta phrase-repere finale.",
            placeholder: "Ex. Une guide claire, elegante et rassurante qui aide a mieux choisir.",
            fieldType: "textarea",
            example: "",
            required: true,
          }),
          createQuestion("summary", 2, {
            id: "content_guiding_question",
            label:
              "Quand je cree du contenu, je dois me demander : Comment [prenom] communiquerait-elle ce message ?",
            helperText: "Transforme cette phrase en reflexe creatif.",
            placeholder: "Ex. Avec clarte, tact et une vraie intention d'aider",
            fieldType: "textarea",
            example: "",
          }),
        ],
      },
    ],
  };
}

function normalizeQuestion(
  rawQuestion: Partial<BrandPersonaQuestion>,
  fallbackSection: string,
  fallbackOrder: number,
): BrandPersonaQuestion | null {
  const id = typeof rawQuestion.id === "string" ? rawQuestion.id.trim() : "";
  const label = typeof rawQuestion.label === "string" ? rawQuestion.label.trim() : "";
  const section =
    typeof rawQuestion.section === "string" && rawQuestion.section.trim()
      ? rawQuestion.section.trim()
      : fallbackSection;
  const fieldType = rawQuestion.fieldType;

  if (
    fieldType !== "text" &&
    fieldType !== "textarea" &&
    fieldType !== "checkbox" &&
    fieldType !== "select"
  ) {
    return null;
  }

  if (!id || !label) {
    return null;
  }

  return {
    id,
    section,
    label,
    helperText:
      typeof rawQuestion.helperText === "string" ? rawQuestion.helperText.trim() : "",
    placeholder:
      typeof rawQuestion.placeholder === "string" ? rawQuestion.placeholder.trim() : "",
    fieldType,
    required: Boolean(rawQuestion.required),
    order:
      Number.isFinite(rawQuestion.order) && Number(rawQuestion.order) > 0
        ? Math.floor(Number(rawQuestion.order))
        : fallbackOrder,
    example: typeof rawQuestion.example === "string" ? rawQuestion.example.trim() : "",
    isActive: rawQuestion.isActive !== false,
    options: Array.isArray(rawQuestion.options)
      ? rawQuestion.options
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  };
}

function normalizeSection(
  rawSection: Partial<BrandPersonaSection>,
  fallbackOrder: number,
): BrandPersonaSection | null {
  const key = typeof rawSection.key === "string" ? rawSection.key.trim() : "";
  const title = typeof rawSection.title === "string" ? rawSection.title.trim() : "";
  const id =
    typeof rawSection.id === "string" && rawSection.id.trim()
      ? rawSection.id.trim()
      : key || `section_${fallbackOrder}`;

  if (!key || !title) {
    return null;
  }

  const questions = Array.isArray(rawSection.questions)
    ? rawSection.questions
        .map((question, index) => normalizeQuestion(question, key, index + 1))
        .filter((question): question is BrandPersonaQuestion => question !== null)
        .sort((left, right) => left.order - right.order)
    : [];

  return {
    id,
    key,
    title,
    description:
      typeof rawSection.description === "string" ? rawSection.description.trim() : "",
    order:
      Number.isFinite(rawSection.order) && Number(rawSection.order) > 0
        ? Math.floor(Number(rawSection.order))
        : fallbackOrder,
    isActive: rawSection.isActive !== false,
    questions,
  };
}

export function normalizeBrandPersonaConfig(
  rawConfig: Partial<BrandPersonaConfig> | null | undefined,
): BrandPersonaConfig {
  const fallback = getDefaultBrandPersonaConfig();

  if (!rawConfig) {
    return fallback;
  }

  const sections = Array.isArray(rawConfig.sections)
    ? rawConfig.sections
        .map((section, index) => normalizeSection(section, index + 1))
        .filter((section): section is BrandPersonaSection => section !== null)
        .sort((left, right) => left.order - right.order)
    : fallback.sections;

  return {
    version:
      Number.isFinite(rawConfig.version) && Number(rawConfig.version) > 0
        ? Math.floor(Number(rawConfig.version))
        : fallback.version,
    isActive: rawConfig.isActive !== false,
    summaryCtaLabel:
      typeof rawConfig.summaryCtaLabel === "string" && rawConfig.summaryCtaLabel.trim()
        ? rawConfig.summaryCtaLabel.trim()
        : fallback.summaryCtaLabel,
    sections: sections.length > 0 ? sections : fallback.sections,
  };
}

export function getSerializedBrandPersonaOptions(config: BrandPersonaConfig) {
  return [
    `${BRAND_PERSONA_CONFIG_PREFIX}${encodeURIComponent(
      JSON.stringify(normalizeBrandPersonaConfig(config)),
    )}`,
  ];
}

export function parseStoredBrandPersonaConfig(rawOptions: string[]) {
  const rawConfig = rawOptions.find((option) =>
    option.startsWith(BRAND_PERSONA_CONFIG_PREFIX),
  );

  if (!rawConfig) {
    return getDefaultBrandPersonaConfig();
  }

  try {
    const parsed = JSON.parse(
      decodeURIComponent(rawConfig.slice(BRAND_PERSONA_CONFIG_PREFIX.length)),
    ) as Partial<BrandPersonaConfig>;
    return normalizeBrandPersonaConfig(parsed);
  } catch {
    return getDefaultBrandPersonaConfig();
  }
}

export function isBrandPersonaOptions(rawOptions: string[]) {
  return rawOptions.some((option) => option.startsWith(BRAND_PERSONA_CONFIG_PREFIX));
}

export function getActiveBrandPersonaSections(config: BrandPersonaConfig) {
  return config.sections
    .filter((section) => section.isActive)
    .map((section) => ({
      ...section,
      questions: section.questions.filter((question) => question.isActive),
    }))
    .filter((section) => section.questions.length > 0);
}

export function getBrandPersonaFields(config: BrandPersonaConfig) {
  return getActiveBrandPersonaSections(config).flatMap((section) =>
    section.questions.map((question) => ({
      ...question,
      sectionId: section.id,
      sectionKey: section.key,
      sectionTitle: section.title,
      sectionDescription: section.description,
    })),
  );
}
