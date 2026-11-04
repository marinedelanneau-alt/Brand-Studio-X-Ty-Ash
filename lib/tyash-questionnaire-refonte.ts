import mapping from "@/content/tyash-refonte/question-map.json";
import { parseStoredSpectrumConfig, getSerializedSpectrumOptions } from "./spectrum";
import type { ModuleExercise } from "./training-types";
import { informalTyashEditorialCopy } from "./client-copy";

export const TYASH_QUESTIONNAIRE_REVISION = "julien-2026-11-04";
export const TYASH_PREFILL_IDS = [1000, 1001, 1002, 1025, 1056, 1066];
export const TYASH_REMOVED_IDS = [1003,1006,1007,1009,1020,1021,1023,1024,1026,1027,1030,1032,1033,1034,1035,1036,1038,1039,1040,1041,1042,1043,1044,1045,1046,1049,1052,1053,1054,1055,1060,1067,1068,1069,1070,1071,1072,1092,1094,1099,1100,1101,1102,1103,1104];
export const TYASH_MERGES: Record<number, number[]> = { 1083: [1065], 1086: [1087,1088,1089,1090], 1095: [1093], 1097: [1096] };
const mergedIds = Object.values(TYASH_MERGES).flat();

export { projectTyashQuestionnaire, tyashRefonteEnabled } from "./tyash-questionnaire";
import type { TyashQuestionnaireRule } from "./tyash-questionnaire";
const questions: Record<number, string> = {
  1000: "Que fait ton entreprise ?", 1001: "Quels produits ou services proposes-tu aujourd’hui ?", 1002: "Depuis quand existe-t-elle ?",
  1004: "Y a-t-il un moment qui raconte particulièrement bien ton histoire ?", 1005: "Au fond, pourquoi fais-tu ce que tu fais ?", 1008: "Qu’est-ce que tu fais à ta manière ?",
  1010: "Imagine : ton entreprise entre dans une pièce remplie de monde. Comment se comporte-t-elle ?", 1011: "Et qu’aimerais-tu que les gens disent d’elle une fois qu’elle est partie ?",
  1018: "Si tu ne pouvais garder que 3 mots pour décrire la personnalité de ton entreprise, lesquels choisirais-tu ?", 1019: "Et quels mots ne doivent surtout PAS te définir ?",
  1022: "Quelles sont tes priorités pour les 6 à 12 prochains mois ?", 1025: "Qui sont tes clients aujourd’hui ?", 1028: "Pour ce projet, qui veux-tu toucher en priorité ?", 1029: "Qu’est-ce qui compte vraiment pour cette personne lorsqu’elle choisit une entreprise comme la tienne ?",
  1031: "Quels canaux et supports utilises-tu vraiment aujourd’hui ?", 1037: "Quels supports as-tu déjà à disposition ?", 1047: "Qu’est-ce qui fonctionne bien et mérite d’être conservé ?", 1048: "À l’inverse, qu’est-ce qui te frustre le plus aujourd’hui ?",
  1050: "Quand tu regardes ta communication actuelle, retrouves-tu vraiment la personnalité que tu viens de décrire ?", 1051: "Qu’est-ce qui manque ou sonne faux ?",
  1056: "Pourquoi ce sujet devient-il important aujourd’hui ?", 1057: "Quel problème concret aimerais-tu résoudre en priorité ?", 1058: "S’il ne fallait en retenir qu’un :", 1059: "Comment saurais-tu que le projet a vraiment fonctionné ?",
  1061: "S’il ne devait rester qu’une seule idée après avoir vu ta communication, laquelle serait-ce ?", 1062: "Quelle partie de ton entreprise mérite d’être montrée mais reste trop souvent invisible ?", 1063: "Qu’est-ce qu’on pourrait montrer pour prouver ce que tu racontes ?", 1064: "Y a-t-il quelque chose que tes clients comprennent souvent mal sur ton entreprise ?",
  1066: "À quoi ce projet est-il lié ?", 1073: "Qu’aimerais-tu que l’on ressente en regardant ta vidéo ?", 1074: "Y a-t-il des vidéos, campagnes, films, marques ou univers qui t’inspirent ?", 1075: "Qu’est-ce que tu aimes dedans ?", 1076: "Je préfère laisser TYASH me proposer une direction.",
  1082: "Le son", 1083: "Qu’est-ce que tu ne veux surtout pas voir dans cette vidéo ? Quels sujets ou formulations faut-il éviter ?", 1084: "Quelles personnes pourraient ou devraient apparaître ?", 1085: "Quels lieux ?", 1086: "Quels gestes, produits ou moments du quotidien ?", 1091: "Parmi tout cela, qu’est-ce qui raconte le mieux qui tu es ?", 1095: "Quelles contraintes de tournage et quelles disponibilités faut-il prendre en compte ?", 1097: "Quelles autorisations et obligations juridiques ou sectorielles faut-il prévoir ?", 1098: "Quels éléments sont imposés ?", 1105: "Que souhaites-tu que la personne fasse après avoir regardé ?",
};
const moduleTitles = ["TON ENTREPRISE", "TA COMMUNICATION", "TON BESOIN", "TON PROJET VIDÉO"];
const submoduleTitles = [["TON HISTOIRE", "CE QUI T’ANIME", "TA PERSONNALITÉ", "TES AMBITIONS", "TES PUBLICS"], ["AUJOURD’HUI", "CE QUI FONCTIONNE… OU PAS", "L’IMAGE PERÇUE"], ["LE PROBLÈME À RÉSOUDRE", "LA PRIORITÉ", "CE QU’IL FAUT RACONTER"], ["LE CONTEXTE", "DE TA PERSONNALITÉ À TON UNIVERS VIDÉO", "LA MATIÈRE À FILMER", "LES FORMATS ENVISAGÉS"]];
const introductions = [
  ["Vérifie les informations préparées par TYASH et partage un moment marquant de ton histoire.", "Explique ce qui te motive et ce qui rend ta façon de travailler singulière.", "Imagine la personnalité de ton entreprise, puis situe-la à l’aide des curseurs.", "Choisis tes priorités pour les prochains mois.", "Vérifie tes publics actuels, puis précise qui tu souhaites toucher avec ce projet."],
  ["Fais le point sur les canaux que tu utilises et les supports disponibles.", "Partage ce que tu souhaites conserver et ce qui te frustre aujourd’hui.", "Compare ta communication actuelle à la personnalité que tu viens de décrire."],
  ["Vérifie le contexte préparé par TYASH et précise le problème à résoudre.", "Choisis la priorité du projet et ce qui te permettra d’en apprécier le résultat.", "Précise l’idée à transmettre, les preuves à montrer et l’action attendue après la vidéo."],
  ["Relis le contexte du projet préparé par TYASH et corrige-le si nécessaire. Les modalités du devis sont déjà fixées.", "Partage les émotions, les références et les choix visuels qui guideront TYASH. Tu peux aussi nous laisser proposer une direction.", "Repère les personnes, les lieux et les moments à filmer, puis précise les contraintes et les autorisations utiles au tournage.", ""],
];

export function prepareTyashQuestionnaireRefonte<T extends { stableKey?: string; title: string; submodules: Array<{ stableKey?: string; title: string; content_html: string; exercises: ModuleExercise[] }> }>(input: T[]): T[] {
  if (input.length !== 4) throw new Error("La refonte exige les quatre modules TYASH audités.");
  const modules = structuredClone(input);
  const all = modules.flatMap(m => m.submodules.flatMap(s => s.exercises));
  if (all.length !== mapping.entries.length) throw new Error("Le questionnaire a changé depuis l’audit. Nouvelle correspondance nécessaire.");
  const entryByKey = new Map(mapping.entries.map(e => [e.stableKey, e]));
  for (const e of all) {
    const reference = entryByKey.get(e.stableKey ?? "");
    if (!reference || reference.id !== e.id || reference.type !== e.type || reference.question !== e.question) throw new Error("Question différente de l’audit TYASH. Actualisez la correspondance avant de préparer le brouillon.");
  }
  const target = mapping.entries.find(e => e.templateId === 1061)!;
  const preparedAt = new Date().toISOString();
  for (const [mi, m] of modules.entries()) {
    Object.assign(m, { editorRevision: crypto.randomUUID(), tyashQuestionnaireRevision: TYASH_QUESTIONNAIRE_REVISION, tyashQuestionnairePreparedAt: preparedAt, title: moduleTitles[mi], content_html: `<p>${introductions[mi][0]}</p>` });
    for (const [si, s] of m.submodules.entries()) {
      s.title = submoduleTitles[mi][si];
      s.content_html = `<p>${introductions[mi][si]}</p>`;
      // Snapshot copy takes precedence over the older local introduction overlay.
      Object.assign(s, { editorialIntroduction: { headline: s.title, paragraphs: introductions[mi][si] ? [introductions[mi][si]] : [], transition: "Continue avec {exercises}." } });
      for (const e of s.exercises) {
        const id = entryByKey.get(e.stableKey!)!.templateId;
        const rule: TyashQuestionnaireRule = { status: TYASH_REMOVED_IDS.includes(id) ? "archived" : mergedIds.includes(id) ? "merged" : "active" };
        if (TYASH_PREFILL_IDS.includes(id)) rule.prefill = true;
        if ([1010, 1011].includes(id)) rule.keepTogether = true;
        if (id === 1105) { rule.displayModuleKey = target.moduleKey; rule.displaySubmoduleKey = target.submoduleKey; }
        if (TYASH_MERGES[id]) rule.mergeSources = TYASH_MERGES[id].map(source => mapping.entries.find(entry => entry.templateId === source)!.stableKey);
        Object.assign(e, { tyashQuestionnaire: rule });
        if (rule.status !== "active") continue;
        if (questions[id]) e.question = questions[id];
        if (id === 1082) e.options = e.options.filter(o => !["Voix off", "Interviews"].includes(o));
        e.explanation = "";
        e.audio_transcript = e.audio_transcript ? informalTyashEditorialCopy(e.audio_transcript) : null;
        if (e.feedback_config) {
          const feedback = e.feedback_config;
          e.feedback_config = { ...feedback, positiveMessage: informalTyashEditorialCopy(feedback.positiveMessage), neutralMessage: informalTyashEditorialCopy(feedback.neutralMessage), improvementMessage: informalTyashEditorialCopy(feedback.improvementMessage), excellentMessage: informalTyashEditorialCopy(feedback.excellentMessage), rules: feedback.rules.map(r => ({ ...r, message: informalTyashEditorialCopy(r.message) })) };
        }
        e.answer_placeholder = id === 1083 ? "Par exemple : une vidéo trop institutionnelle, un sujet confidentiel ou une formulation à éviter." : "";
        if (e.type === "spectrum") {
          const config = parseStoredSpectrumConfig(e.options);
          e.options = [...e.options.filter(o => !o.startsWith("__spectrum_config__:")), ...getSerializedSpectrumOptions({ ...config, enableJustification: false, requireJustification: false, helperText: "Déplace le curseur pour situer ton entreprise." })];
        }
        if ([1074, 1075, 1076].includes(id)) e.completion = { required: false };
      }
    }
  }
  return modules;
}

export const tyashPrefillQuestions = mapping.entries.filter(e => TYASH_PREFILL_IDS.includes(e.templateId)).map(e => ({ ...e, label: questions[e.templateId] }));
