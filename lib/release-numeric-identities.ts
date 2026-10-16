type Entity = { stableKey: string; id?: number; legacyId?: number };
type Exercise = Entity & { module_id?: number; submodule_id?: number };
type Submodule = Entity & { module_id?: number; exercises: Exercise[] };
type Module = Entity & { submodules: Submodule[]; exercises?: Exercise[] };

// Pure preparation only. Persist the returned IDs in the future draft snapshot.
// Supply every retained snapshot to reserve existing IDs and preserve known keys.
export function allocateReleaseNumericIdentities<T extends Module>(input: T[], retained: Module[][]): Module[] {
  const known = new Map<string, number>();
  const reserved = new Set<number>();
  const visit = (modules: Module[], fn: (e: Entity, kind: string) => void) => {
    for (const m of modules) {
      fn(m, "module");
      for (const s of m.submodules) { fn(s, "submodule"); for (const e of s.exercises) fn(e, "exercise"); }
    }
  };
  for (const snapshot of retained) visit(snapshot, (e, kind) => {
    const id = e.id ?? e.legacyId;
    if (id === undefined) return;
    if (!Number.isSafeInteger(id) || id === 0) throw new Error("Invalid retained identity.");
    reserved.add(id);
    const key = `${kind}:${e.stableKey}`;
    if (known.has(key) && known.get(key) !== id) throw new Error("Unstable retained identity.");
    known.set(key, id);
  });
  const result = structuredClone(input);
  const seen = new Set<string>();
  let next = -1;
  visit(result, (e, kind) => {
    if (!e.stableKey?.startsWith("tyash_v1_")) throw new Error("Explicit Ty Ash stable key required.");
    const key = `${kind}:${e.stableKey}`;
    if (seen.has(key)) throw new Error("Duplicate stable key.");
    seen.add(key);
    const previous = known.get(key);
    if (previous !== undefined) {
      if (e.id !== undefined && e.id !== previous) throw new Error("Existing identity cannot change.");
      e.id = previous;
    } else {
      if (e.id !== undefined || e.legacyId !== undefined) throw new Error("Do not reuse numeric IDs for new keys.");
      while (reserved.has(next)) next--;
      if (!Number.isSafeInteger(next)) throw new Error("Numeric identity range exhausted.");
      e.id = next--; reserved.add(e.id);
    }
  });
  for (const m of result) {
    for (const s of m.submodules) {
      s.module_id = m.id;
      for (const e of s.exercises) { e.module_id = m.id; e.submodule_id = s.id; }
    }
    m.exercises = m.submodules.flatMap(s => s.exercises);
  }
  return result;
}
