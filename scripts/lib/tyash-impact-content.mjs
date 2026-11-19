import assert from "node:assert/strict";

export const IMPACT_CONTENT = {
  module: { id: -65, key: "tyash_v1_module_d48f8c27-79ba-4e8a-b0d2-e978a461f7d9", title: "L'IMPACT DE TON PROJET" },
  submodule: { id: -66, key: "tyash_v1_submodule_1c046537-f890-4444-803e-bffc7a6635ba", title: "L'IMPACT RECHERCHÉ" },
  questions: [
    { id: -69, key: "tyash_v1_question_6637b86b-46e7-424b-98e6-7187b0d07a17", previous: "Pourquoi ce sujet devient-il important aujourd'hui ?", text: "Qu'aimerais-tu faire évoluer ou changer grâce à ce projet ?" },
    { id: -70, key: "tyash_v1_question_a4f523a3-f56b-4343-8544-5336dab5bb58", previous: "Quel problème concret aimerais-tu résoudre en priorité ?", text: "Quel impact concret aimerais-tu que cette vidéo ait sur ton activité, ton public ou ton environnement ?" },
  ],
  moduleIntroduction: "<p>Découvrez le contexte préparé par TYASH et précisez l’impact que vous souhaitez produire grâce à votre projet vidéo.</p>",
  submoduleIntroduction: "<p>Découvrez le contexte préparé par TYASH, puis précisez ce que vous souhaitez faire évoluer et l’impact concret que votre projet vidéo doit produire.</p>",
  headline: "Avant de penser à la vidéo, posons-nous la bonne question : quel impact souhaitons-nous créer ?",
  paragraphs: [
    "Vous avez peut-être déjà une idée de vidéo en tête. Cette démarche peut avoir plusieurs intentions : faire évoluer la perception de votre activité, créer une prise de conscience, renforcer la confiance de votre public ou donner envie de passer à l’action.",
    "Définir l’impact recherché, c’est préciser le changement que vous souhaitez susciter. Votre vidéo prend ainsi une direction claire : produire un effet concret sur votre activité, votre public ou votre environnement.",
    "Pour TYASH, cette étape permet de comprendre l’évolution ou le résultat que vous visez. Elle prépare le choix d’une priorité, puis du message et des éléments à raconter pour donner du sens à votre projet vidéo.",
  ],
};

const normalize = text => text.replaceAll("’", "'");

function unique(items, key, id) {
  const matches = items.filter(item => item.stableKey === key);
  assert.equal(matches.length, 1, `Unique identity required: ${key}`);
  assert.equal(matches[0].id, id, `Unexpected numeric identity: ${key}`);
  return matches[0];
}

export function findImpactModule(modules) {
  return unique(modules, IMPACT_CONTENT.module.key, IMPACT_CONTENT.module.id);
}

/** @template T @param {T[]} source @param {string} revision @returns {T[]} */
export function reviseImpactContent(source, revision) {
  assert.ok(revision, "Editor revision required");
  const modules = structuredClone(source);
  const targetModule = findImpactModule(modules);
  assert.equal(targetModule.title, "TON BESOIN", "Module already edited; review before applying");
  const section = unique(targetModule.submodules, IMPACT_CONTENT.submodule.key, IMPACT_CONTENT.submodule.id);
  assert.equal(section.title, "LE PROBLÈME À RÉSOUDRE", "Submodule already edited; review before applying");
  assert.equal(section.editorialIntroduction?.layout, "brand_video");
  assert.equal(section.editorialIntroduction.paragraphs.length, 3);
  for (const definition of IMPACT_CONTENT.questions) {
    // Both representations are persisted by the Admin editor. Retain their
    // types, keys, positions, prefills and historical answer identities.
    for (const items of [section.exercises, targetModule.exercises]) {
      const exercise = unique(items, definition.key, definition.id);
      assert.equal(exercise.type, "open");
      assert.equal(normalize(exercise.question), definition.previous, "Question already edited; review before applying");
      exercise.question = definition.text;
    }
  }
  targetModule.title = IMPACT_CONTENT.module.title;
  targetModule.content_html = IMPACT_CONTENT.moduleIntroduction;
  targetModule.editorRevision = revision;
  section.title = IMPACT_CONTENT.submodule.title;
  section.content_html = IMPACT_CONTENT.submoduleIntroduction;
  section.editorialIntroduction.headline = IMPACT_CONTENT.headline;
  section.editorialIntroduction.paragraphs = [...IMPACT_CONTENT.paragraphs];
  assertOnlyImpactChanges(source, modules);
  return modules;
}

export function assertOnlyImpactChanges(source, revised) {
  const restored = structuredClone(revised);
  const original = findImpactModule(source);
  const targetModule = findImpactModule(restored);
  const oldSection = unique(original.submodules, IMPACT_CONTENT.submodule.key, IMPACT_CONTENT.submodule.id);
  const section = unique(targetModule.submodules, IMPACT_CONTENT.submodule.key, IMPACT_CONTENT.submodule.id);
  assert.equal(targetModule.title, IMPACT_CONTENT.module.title);
  assert.equal(targetModule.content_html, IMPACT_CONTENT.moduleIntroduction);
  assert.equal(section.title, IMPACT_CONTENT.submodule.title);
  assert.equal(section.content_html, IMPACT_CONTENT.submoduleIntroduction);
  assert.equal(section.editorialIntroduction.headline, IMPACT_CONTENT.headline);
  assert.deepEqual(section.editorialIntroduction.paragraphs, IMPACT_CONTENT.paragraphs);
  for (const field of ["title", "content_html", "editorRevision"]) targetModule[field] = original[field];
  for (const field of ["title", "content_html"]) section[field] = oldSection[field];
  for (const field of ["headline", "paragraphs"]) section.editorialIntroduction[field] = structuredClone(oldSection.editorialIntroduction[field]);
  for (const definition of IMPACT_CONTENT.questions) {
    for (const [items, oldItems] of [[section.exercises, oldSection.exercises], [targetModule.exercises, original.exercises]]) {
      const exercise = unique(items, definition.key, definition.id);
      assert.equal(exercise.question, definition.text);
      exercise.question = unique(oldItems, definition.key, definition.id).question;
    }
  }
  // Includes every other targetModule/submodule, media, options, metadata and setting
  // within modules. Nothing is hidden behind a general text replacement.
  assert.deepEqual(restored, source, "Unexpected change outside the impact copy");
}
