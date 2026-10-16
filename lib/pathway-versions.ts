import { validateReleaseModules, assertReleaseAnswerCompatibility } from "./release-content-validation";
import { allocateReleaseNumericIdentities } from "./release-numeric-identities";
import { validateIndependentAdminModules, validatePathwayNumericOptions } from "./pathway-snapshot-validation";

export type PathwayRelease = {
  id: string;
  pathway_root_id?: string | null;
  published_at?: string | null;
};

export function samePathway(a: PathwayRelease, b: PathwayRelease) {
  return (a.pathway_root_id ?? null) === (b.pathway_root_id ?? null);
}

export function prepareIndependentPathway(input: unknown[], retained: unknown[][]) {
  for (const m of input as Array<{ submodules?: Array<{ exercises?: Array<{ options?: unknown }> }> }>) {
    for (const s of m?.submodules ?? []) for (const e of s?.exercises ?? []) {
      if (Array.isArray(e?.options) && e.options.every(o => typeof o === "string")) validatePathwayNumericOptions(e.options);
    }
  }
  const modules = validateReleaseModules(input);
  const groupKeys = new Map<string, string>();
  const fresh = (entity: { id: number; stableKey?: string }, kind: string) => {
    const value = { ...entity } as Record<string, unknown>;
    delete value.id;
    delete value.legacyId;
    delete value.editorKey;
    delete value.editorRevision;
    value.stableKey = `tyash_v1_${kind}_${crypto.randomUUID()}`;
    const group = value.exercise_group_id;
    if (typeof group === "string" && group) {
      if (!groupKeys.has(group)) groupKeys.set(group, `tyash_v1_group_${crypto.randomUUID()}`);
      value.exercise_group_id = groupKeys.get(group);
    }
    return value;
  };
  const independent = modules.map(m => ({
    ...fresh(m, "module"),
    submodules: m.submodules.map(s => ({
      ...fresh(s, "submodule"),
      exercises: s.exercises.map(e => fresh(e, "question")),
    })),
  }));
  const reserved = retained.filter(s => s.length).map(validateReleaseModules);
  const allocated = allocateReleaseNumericIdentities(
    independent as Parameters<typeof allocateReleaseNumericIdentities>[0],
    reserved as Parameters<typeof allocateReleaseNumericIdentities>[1],
  );
  assertIndependentPathway(allocated, retained);
  return validateIndependentAdminModules(allocated);
}

export function assertIndependentPathway(modules: unknown[], otherSnapshots: unknown[][]) {
  const next = validateIndependentAdminModules(modules);
  const entities = (items: ReturnType<typeof validateReleaseModules>) => items.flatMap(m => [
    m, ...m.submodules.flatMap(s => [s, ...s.exercises]),
  ]);
  const previous = otherSnapshots.flatMap(snapshot => snapshot.length ? entities(validateReleaseModules(snapshot)) : []);
  const ids = new Set(previous.map(e => e.id));
  const keys = new Set(previous.map(e => e.stableKey));
  for (const entity of entities(next)) {
    if (!entity.stableKey?.startsWith("tyash_v1_") || entity.id >= 0 || ids.has(entity.id) || keys.has(entity.stableKey)) {
      throw new Error("Un nouveau parcours exige des identités Ty Ash indépendantes de tout l’historique.");
    }
  }
}

export function assertPathwaySave(
  modules: unknown[], release: PathwayRelease,
  history: Array<{ release: PathwayRelease; modules: unknown[] }>,
) {
  if (!release.pathway_root_id) throw new Error("Identité de version de parcours absente.");
  assertIndependentPathway(modules, history.filter(h => !samePathway(h.release, release)).map(h => h.modules));
  // Preserve every previously published answer slot within this pathway,
  // including when another pathway is currently the official one.
  for (const entry of history.filter(h => samePathway(h.release, release) && h.release.published_at)) {
    if (entry.modules.length) assertReleaseAnswerCompatibility(entry.modules, modules);
  }
}
