import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
vi.mock("server-only", () => ({}));
import seed from "../content/tyash-v1/pathway.json";
import { prepareTyAshPathway } from "../lib/tyash-pathway-seed";
import { groupExercisesByGroupId } from "../lib/exercise-groups";
import { parseStoredSpectrumConfig } from "../lib/spectrum";

describe("approved Ty Ash content seed", () => {
  it("prepares exactly 4 modules, 15 submodules and 43 native exercise groups", () => {
    const modules = prepareTyAshPathway([]);
    expect(modules.map(m => m.title)).toEqual(["TON ENTREPRISE", "TA COMMUNICATION", "TON BESOIN", "TON PROJET VIDÉO"]);
    expect(modules.map(m => m.submodules.length)).toEqual([5, 3, 3, 4]);
    expect(modules.map(m => groupExercisesByGroupId(m.exercises).length)).toEqual([14, 9, 8, 12]);
    expect(modules.flatMap(m => m.exercises)).toHaveLength(106);
    const second = prepareTyAshPathway([modules]);
    const old = new Set(modules.flatMap(m => [m.id, ...m.submodules.map(s => s.id), ...m.exercises.map(e => e.id)]));
    expect(second.every(m => !old.has(m.id) && m.exercises.every(e => !old.has(e.id)))).toBe(true);
    const firstGroups = new Set(modules.flatMap(m => groupExercisesByGroupId(m.exercises).map(g => g.id)));
    expect(second.flatMap(m => groupExercisesByGroupId(m.exercises)).every(g => !firstGroups.has(g.id))).toBe(true);
  });

  it("preserves every quoted content sentence from the brief, except the explicitly optional dynamic introduction", () => {
    const brief = readFileSync(new URL("../content/tyash-v1/brief.txt", import.meta.url), "utf8");
    const content = brief.slice(brief.indexOf("MODULE 1 —"), brief.indexOf("4. EXPÉRIENCE UTILISATEUR"));
    const strings: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === "string") strings.push(v.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") Object.values(v).forEach(walk);
    };
    walk(seed);
    for (const match of content.matchAll(/^"(.*)"\s*$/gm)) {
      if (match[1].includes("[PERSONNALITÉ")) continue;
      expect(strings.some(s => s.includes(match[1])), match[1]).toBe(true);
    }
  });

  it("contains all twelve requested spectrum axes and the optional final questions", () => {
    const modules = prepareTyAshPathway([]);
    const questions = modules.flatMap(m => m.exercises);
    const axes = questions.filter(e => e.type === "spectrum").map(e => parseStoredSpectrumConfig(e.options));
    expect(axes.map(a => [a.leftLabel, a.rightLabel])).toEqual([
      ["Sérieuse", "Joueuse"], ["Discrète", "Expressive"], ["Institutionnelle", "Spontanée"],
      ["Accessible", "Exclusive"], ["Rassurante", "Audacieuse"], ["Posée", "Énergique"],
      ["Complètement", "Pas du tout"], ["Lumière naturelle", "Lumière très travaillée"],
      ["Observation / documentaire", "Mise en scène"], ["Rythme contemplatif", "Montage dynamique"],
      ["Très humain", "Très produit / savoir-faire"], ["Brut / authentique", "Très esthétique / maîtrisé"],
    ]);
    const groups = modules.flatMap(m => groupExercisesByGroupId(m.exercises));
    expect(groups.at(-1)!.questions).toHaveLength(6);
    expect(groups.at(-1)!.questions.every(q => q.completion?.required === false)).toBe(true);
    expect(questions.find(e => e.question === "Est-ce elle qui prend réellement la décision ?")!.completion?.required).toBe(false);
    expect(questions.find(e => e.question === "As-tu déjà un indicateur ou un résultat chiffré en tête ?")!.completion?.required).toBe(false);
  });
});
