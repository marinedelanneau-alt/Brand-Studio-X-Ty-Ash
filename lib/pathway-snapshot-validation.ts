import contract from "./pathway-snapshot.schema.json";
import { validateReleaseModules } from "./release-content-validation";
import { validateCompletionRequirements } from "./exercise-completion";

type Schema = { type?: string | string[]; required?: string[]; properties?: Record<string, Schema>; items?: Schema; minItems?: number; uniqueItems?: boolean; minimum?: number; maximum?: number; minLength?: number; pattern?: string; enum?: unknown[]; additionalProperties?: boolean };

// The same contract is embedded in the SQL migration by sync-pathway-contract.mjs.
export function assertContract(value: unknown, schema: Schema): void {
  const fail = () => { throw new Error("Structure de parcours incompatible avec l’Admin."); };
  const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "number" && Number.isInteger(value) ? "integer" : typeof value;
  if (schema.type && !(Array.isArray(schema.type) ? schema.type : [schema.type]).includes(type)) fail();
  if (schema.enum && !schema.enum.includes(value)) fail();
  if (typeof value === "number" && (!Number.isSafeInteger(value) || (schema.minimum !== undefined && value < schema.minimum) || (schema.maximum !== undefined && value > schema.maximum))) fail();
  if (typeof value === "string" && ((schema.minLength !== undefined && value.length < schema.minLength) || (schema.pattern && !new RegExp(schema.pattern).test(value)))) fail();
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) fail();
    if (schema.uniqueItems && new Set(value.map(v => JSON.stringify(v))).size !== value.length) fail();
    if (schema.items) value.forEach(item => assertContract(item, schema.items!));
  } else if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (schema.required?.some(key => !Object.hasOwn(record, key))) fail();
    for (const [key, item] of Object.entries(record)) {
      // JSON transport omits optional undefined fields emitted by the editor.
      if (item === undefined && !schema.required?.includes(key)) continue;
      const field = schema.properties?.[key];
      if (field) assertContract(item, field);
      else if (schema.additionalProperties === false) fail();
    }
  }
}

export function validateIndependentAdminModules(value: unknown) {
  assertContract(value, contract.modules);
  const raw = value as Array<{ id: number; submodules: Array<{ id: number; module_id: number; exercises: Array<{ module_id: number; submodule_id: number; options: string[] }> }> }>;
  for (const m of raw) for (const s of m.submodules) {
    if (s.module_id !== m.id || s.exercises.some(e => e.module_id !== m.id || e.submodule_id !== s.id)) throw new Error("Parent de contenu invalide.");
    for (const e of s.exercises) validatePathwayNumericOptions(e.options);
  }
  const modules = validateReleaseModules(value);
  const ids = new Set<number>();
  const keys = new Set<string>();
  const check = (e: { id: number; stableKey?: string }) => {
    if (ids.has(e.id) || keys.has(e.stableKey!)) throw new Error("Identités dupliquées.");
    ids.add(e.id); keys.add(e.stableKey!);
  };
  for (const m of modules) {
    check(m);
    for (const s of m.submodules) {
      check(s);
      if ((s as unknown as { module_id: number }).module_id !== m.id) throw new Error("Module parent invalide.");
      for (const e of s.exercises) {
        check(e);
        if (e.module_id !== m.id || e.submodule_id !== s.id) throw new Error("Exercice parent invalide.");
        validateCompletionRequirements(e);
        if (e.type === "spectrum") {
          const configs = e.options.filter(o => o.startsWith("__spectrum_config__:"));
          if (configs.length !== 1) throw new Error("Configuration du curseur absente ou dupliquée.");
          assertContract(JSON.parse(decodeURIComponent(configs[0].slice("__spectrum_config__:".length))), contract.spectrum);
        }
      }
    }
  }
  return modules;
}

export function validatePathwayNumericOptions(options: string[]) {
  for (const [prefix, rule] of Object.entries(contract.numericOptions)) {
    const values = options.filter(o => o.startsWith(prefix));
    if (values.length > 1) throw new Error("Configuration numérique dupliquée.");
    for (const option of values) {
      const raw = option.slice(prefix.length);
      if (!/^[1-9][0-9]*$/.test(raw)) throw new Error("Configuration numérique invalide.");
      assertContract(Number(raw), rule);
    }
  }
}
