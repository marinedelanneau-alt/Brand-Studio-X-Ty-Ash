import type { ModuleExercise, WorkspaceModule } from "./training-types";

// Reviewed editorial copy only. Never apply this function to answers, company
// names, saved option values, identities, URLs, or Admin editor source content.
const REPLACEMENTS = ([
  ["TON ENTREPRISE", "VOTRE ENTREPRISE"],
  ["TON HISTOIRE", "VOTRE HISTOIRE"],
  ["TA PERSONNALITÉ", "VOTRE PERSONNALITÉ"],
  ["TES AMBITIONS", "VOS AMBITIONS"],
  ["TES PUBLICS", "VOS PUBLICS"],
  ["TA COMMUNICATION", "VOTRE COMMUNICATION"],
  ["TON BESOIN", "VOTRE BESOIN"],
  ["TON PROJET VIDÉO", "VOTRE PROJET VIDÉO"],
  ["DE TA PERSONNALITÉ À TON UNIVERS VIDÉO", "DE VOTRE PERSONNALITÉ À VOTRE UNIVERS VIDÉO"],
  ["Que fait ton entreprise ?", "Que fait votre entreprise ?"],
  ["Présente ton entreprise", "Présentez votre entreprise"],
  ["Présente-nous ton entreprise simplement.", "Présentez-nous votre entreprise simplement."],
  ["Ta réponse est encore courte. Tu peux préciser qui tu aides, ce que tu apportes et comment.", "Votre réponse est encore courte. Vous pouvez préciser qui vous aidez, ce que vous apportez et comment."],
  ["Certains mots sont encore génériques. Essaie de rendre ta réponse plus concrète.", "Certains mots sont encore génériques. Essayez de rendre votre réponse plus concrète."],
  ["C'est clair. Tu peux encore renforcer ta réponse avec un exemple ou un bénéfice concret.", "C'est clair. Vous pouvez encore renforcer votre réponse avec un exemple ou un bénéfice concret."],
  ["Excellent. Ta réponse est claire, spécifique et exploitable.", "Excellent. Votre réponse est claire, spécifique et exploitable."],
  ["Bonne base. Tu peux préciser davantage pour rendre la réponse plus exploitable.", "Bonne base. Vous pouvez préciser davantage pour rendre la réponse plus exploitable."],
  ["C'est clair, tu peux encore ajouter un exemple.", "C'est clair, vous pouvez encore ajouter un exemple."],
  ["Ta réponse est encore un peu floue. Essaie d'ajouter un résultat concret.", "Votre réponse est encore un peu floue. Essayez d'ajouter un résultat concret."],
  ["Quels produits ou services proposes-tu aujourd'hui ?", "Quels produits ou services proposez-vous aujourd'hui ?"],
  ["Quel a été le tien ?", "Quel a été le vôtre ?"],
  ["un problème que tu voulais résoudre", "un problème que vous vouliez résoudre"],
  ["Imagine : ton entreprise entre dans une pièce remplie de monde.", "Imaginez : votre entreprise entre dans une pièce remplie de monde."],
  ["Si ton entreprise était une personne...", "Si votre entreprise était une personne..."],
  ["Et qu'aimerais-tu que les gens disent d'elle une fois qu'elle est partie ?", "Et qu'aimeriez-vous que les gens disent d'elle une fois qu'elle est partie ?"],
  ["Si tu ne pouvais garder que 3 mots pour décrire la personnalité de ton entreprise, lesquels choisirais-tu ?", "Si vous ne pouviez garder que 3 mots pour décrire la personnalité de votre entreprise, lesquels choisiriez-vous ?"],
  ["Si ton entreprise prenait la parole, comment parlerait-elle ?", "Si votre entreprise prenait la parole, comment parlerait-elle ?"],
  ["Dans un an, qu'aimerais-tu avoir fait évoluer ?", "Dans un an, qu'aimeriez-vous avoir fait évoluer ?"],
  ["Pour ce projet, qui veux-tu toucher en priorité ?", "Pour ce projet, qui voulez-vous toucher en priorité ?"],
  ["Aujourd'hui, ta communication...", "Aujourd'hui, votre communication..."],
  ["fait comprendre clairement ton activité", "fait comprendre clairement votre activité"],
  ["Quand tu regardes ta communication actuelle, retrouves-tu vraiment la personnalité que tu viens de décrire ?", "Quand vous regardez votre communication actuelle, retrouvez-vous vraiment la personnalité que vous venez de décrire ?"],
  ["Comment penses-tu que les autres perçoivent ton entreprise aujourd'hui ?", "Comment pensez-vous que les autres perçoivent votre entreprise aujourd'hui ?"],
  ["Comment voudrais-tu qu'ils la perçoivent demain ?", "Comment voudriez-vous qu'ils la perçoivent demain ?"],
  ["Si cette communication fonctionne parfaitement, qu'est-ce qui aura changé pour ton entreprise ?", "Si cette communication fonctionne parfaitement, qu'est-ce qui aura changé pour votre entreprise ?"],
  ["Quels changements recherches-tu ?", "Quels changements recherchez-vous ?"],
  ["Quel problème concret aimerais-tu résoudre en priorité ?", "Quel problème concret aimeriez-vous résoudre en priorité ?"],
  ["Comment saurais-tu que le projet a vraiment fonctionné ?", "Comment sauriez-vous que le projet a vraiment fonctionné ?"],
  ["As-tu déjà un indicateur ou un résultat chiffré en tête ?", "Avez-vous déjà un indicateur ou un résultat chiffré en tête ?"],
  ["Maintenant, voyons comment la personnalité de ta marque pourrait prendre vie à l'écran.", "Maintenant, voyons comment la personnalité de votre marque pourrait prendre vie à l'écran."],
  ["Qu'aimerais-tu que l'on ressente en regardant votre vidéo ?", "Qu'aimeriez-vous que l'on ressente en regardant votre vidéo ?"],
  ["Y a-t-il des vidéos, campagnes, films, marques ou univers qui t'inspirent ?", "Y a-t-il des vidéos, campagnes, films, marques ou univers qui vous inspirent ?"],
  ["Qu'est-ce que tu aimes dedans ?", "Qu'est-ce que vous aimez dedans ?"],
  ["Traduisons ta personnalité en images", "Traduisons votre personnalité en images"],
  ["Qu'est-ce que tu ne veux surtout pas voir dans cette vidéo ?", "Qu'est-ce que vous ne voulez surtout pas voir dans cette vidéo ?"],
  ["As-tu déjà imaginé un format ou préfères-tu être conseillé ?", "Avez-vous déjà imaginé un format ou préférez-vous être conseillé ?"],
  ["As-tu déjà quelque chose en tête ?", "Avez-vous déjà quelque chose en tête ?"],
  ["Le format doit servir ton objectif", "Le format doit servir votre objectif"],
  ["Que souhaites-tu que la personne fasse après avoir regardé ?", "Que souhaitez-vous que la personne fasse après avoir regardé ?"],
  ["Décris-nous une seule personne ou catégorie de personnes.", "Décrivez-nous une seule personne ou catégorie de personnes."],
] satisfies Array<[string, string]>).sort((a, b) => b[0].length - a[0].length);

export function formalizeClientCopy(value: string): string {
  if (!value) return value;
  // Preserve markup and its attributes. Only known editorial text is replaced.
  return value.split(/(<[a-z/][^>]*>)/gi).map((part, index) => {
    if (index % 2) return part;
    for (const [source, target] of REPLACEMENTS) {
      for (const apostrophe of ["'", "’", "&#x27;", "&#39;", "&apos;"]) {
        part = part.split(source.replaceAll("'", apostrophe)).join(target.replaceAll("'", apostrophe));
      }
    }
    return part;
  }).join("");
}

// A selected predefined label can be presented formally without rewriting its
// saved value. Free-text answers, including identical-looking prose, stay intact.
export function clientOptionAnswerLabel(exercise: ModuleExercise, value: string): string {
  return exercise.stableKey?.startsWith("tyash_v1_")
    && ["single", "multiple", "boolean", "color"].includes(exercise.type)
    && exercise.options.includes(value)
    ? formalizeClientCopy(value)
    : value;
}

function formalExercise(exercise: ModuleExercise): ModuleExercise {
  const feedback = exercise.feedback_config;
  return {
    ...exercise,
    question: formalizeClientCopy(exercise.question),
    explanation: formalizeClientCopy(exercise.explanation),
    answer_placeholder: formalizeClientCopy(exercise.answer_placeholder),
    audio_transcript: exercise.audio_transcript ? formalizeClientCopy(exercise.audio_transcript) : exercise.audio_transcript,
    // options are persisted answer values: retain them byte-for-byte.
    feedback_config: feedback ? {
      ...feedback,
      positiveMessage: formalizeClientCopy(feedback.positiveMessage),
      neutralMessage: formalizeClientCopy(feedback.neutralMessage),
      improvementMessage: formalizeClientCopy(feedback.improvementMessage),
      excellentMessage: formalizeClientCopy(feedback.excellentMessage),
      rules: feedback.rules.map(rule => ({ ...rule, message: formalizeClientCopy(rule.message) })),
    } : feedback,
  };
}

export function withFormalClientCopy(module: WorkspaceModule): WorkspaceModule {
  if (!module.stableKey?.startsWith("tyash_v1_")) return module;
  return {
    ...module,
    title: formalizeClientCopy(module.title),
    content_html: formalizeClientCopy(module.content_html),
    audio_transcript: module.audio_transcript ? formalizeClientCopy(module.audio_transcript) : module.audio_transcript,
    exercises: module.exercises.map(formalExercise),
    submodules: module.submodules.map(submodule => ({
      ...submodule,
      title: formalizeClientCopy(submodule.title),
      content_html: formalizeClientCopy(submodule.content_html),
      audio_transcript: submodule.audio_transcript ? formalizeClientCopy(submodule.audio_transcript) : submodule.audio_transcript,
      exercises: submodule.exercises.map(formalExercise),
    })),
  };
}
