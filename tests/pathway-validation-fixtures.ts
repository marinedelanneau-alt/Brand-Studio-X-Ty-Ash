import { getDefaultSpectrumConfig, getSerializedSpectrumOptions } from "../lib/spectrum";
import { getSerializedGroupOpenOptions, getSerializedTableOptions } from "../lib/exercise-types";

export const canonicalPathway = [{
  id: -10, stableKey: "tyash_v1_fixture_module", position: 1, title: "Fixture",
  submodules: [{ id: -11, module_id: -10, stableKey: "tyash_v1_fixture_submodule", position: 1, title: "Fixture", content_html: "", exercises: [{
    id: -12, module_id: -10, submodule_id: -11, stableKey: "tyash_v1_fixture_question", position: 1, type: "open", question: "Fixture?", options: [] as string[],
  }] }],
}];

type Fixture = typeof canonicalPathway;
type RecordValue = Record<string, unknown>;
function invalid(name: string, modify: (m: Fixture, e: RecordValue) => void) {
  const modules = structuredClone(canonicalPathway);
  modify(modules, modules[0].submodules[0].exercises[0]);
  return { name, valid: false, modules };
}
function valid(name: string, modify: (e: RecordValue) => void) {
  const modules = structuredClone(canonicalPathway);
  modify(modules[0].submodules[0].exercises[0]);
  return { name, valid: true, modules };
}

export const pathwayValidationCases = [
  { name: "canonical open", valid: true, modules: canonicalPathway },
  valid("choices and help", e => { e.type = "multiple"; e.options = ["A", "B"]; e.explanation = "Help"; }),
  valid("spectrum config", e => { e.type = "spectrum"; e.options = getSerializedSpectrumOptions(getDefaultSpectrumConfig()); }),
  valid("optional exercise", e => { e.completion = { required: false }; }),
  valid("optional group field", e => { e.type = "group_open"; e.options = getSerializedGroupOpenOptions(["A", "B"], { columns: 1 }); e.completion = { optionalFields: [1] }; }),
  valid("optional table row and cell", e => { e.type = "table"; e.options = getSerializedTableOptions({ rows: 3, columns: 2, rowLabels: [], columnLabels: [] }); e.completion = { optionalRows: [1], optionalCells: [5] }; }),
  invalid("missing module title", m => { delete (m[0] as RecordValue).title; }),
  invalid("empty submodules", m => { m[0].submodules = []; }),
  invalid("missing questions array", m => { delete (m[0].submodules[0] as RecordValue).exercises; }),
  invalid("missing ID", (_, e) => { delete e.id; }),
  invalid("unsafe numeric ID", (_, e) => { e.id = -9007199254740992; }),
  invalid("wrong key namespace", (_, e) => { e.stableKey = "exercise_legacy"; }),
  invalid("wrong parent", (_, e) => { e.module_id = -999; }),
  invalid("wrong position", (_, e) => { e.position = 0; }),
  invalid("duplicate IDs", (m, e) => { e.id = m[0].id; }),
  invalid("duplicate keys", (m, e) => { e.stableKey = m[0].stableKey; }),
  invalid("duplicate question positions", m => { const e = { ...m[0].submodules[0].exercises[0], id: -13, stableKey: "tyash_v1_other_question" }; m[0].submodules[0].exercises.push(e); }),
  invalid("unsupported type", (_, e) => { e.type = "unknown"; }),
  invalid("nonstring question", (_, e) => { e.question = {}; }),
  invalid("nonarray options", (_, e) => { e.options = {}; }),
  invalid("nonstring option", (_, e) => { e.options = [42]; }),
  invalid("nonstring help", (_, e) => { e.explanation = {}; }),
  invalid("malformed media alias", m => { (m[0] as RecordValue).videoUrl = {}; }),
  invalid("malformed feedback", (_, e) => { e.feedback_config = { rules: 42 }; }),
  invalid("missing spectrum config", (_, e) => { e.type = "spectrum"; }),
  invalid("broken spectrum config", (_, e) => { e.type = "spectrum"; e.options = ["__spectrum_config__:%ZZ"]; }),
  invalid("bad spectrum values", (_, e) => { e.type = "spectrum"; e.options = ["__spectrum_config__:" + encodeURIComponent(JSON.stringify({ leftLabel: "A", rightLabel: "B", defaultValue: 101 }))]; }),
  invalid("invalid optional boolean", (_, e) => { e.completion = { required: "false" }; }),
  invalid("optional index out of range", (_, e) => { e.type = "group_open"; e.options = getSerializedGroupOpenOptions(["A", "B"], { columns: 1 }); e.completion = { optionalFields: [2] }; }),
  invalid("optional rows on open", (_, e) => { e.completion = { optionalRows: [] }; }),
  invalid("duplicate optional indexes", (_, e) => { e.type = "table"; e.completion = { optionalCells: [0, 0] }; }),
  invalid("excessive table allocation", (_, e) => { e.type = "table"; e.options = ["__table_rows__:100000000", "__table_columns__:100000000"]; }),
];
