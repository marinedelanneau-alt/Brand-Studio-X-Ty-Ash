import { describe, expect, it } from "vitest";
import { assertIndependentPathway, assertPathwaySave, prepareIndependentPathway } from "../lib/pathway-versions";
import { validateIndependentAdminModules } from "../lib/pathway-snapshot-validation";
import { pathwayValidationCases } from "./pathway-validation-fixtures";

const legacy = [{ id: 1, stableKey: "module_1", title: "Old", position: 1, submodules: [{
  id: 2, stableKey: "submodule_2", title: "Old", position: 1, content_html: "", exercises: [{
    id: 3, stableKey: "exercise_3", position: 1, type: "open", question: "Old?", options: [],
  }],
}] }];

describe("independent pathway versions", () => {
  it.each(pathwayValidationCases)("canonical admin boundary: $name", fixture => {
    if (fixture.valid) expect(() => validateIndependentAdminModules(fixture.modules)).not.toThrow();
    else expect(() => validateIndependentAdminModules(fixture.modules)).toThrow();
  });
  it("allocates fresh keys and IDs against all retained snapshots", () => {
    const first = prepareIndependentPathway(legacy, [legacy]);
    const second = prepareIndependentPathway(legacy, [legacy, first]);
    expect(() => assertIndependentPathway(second, [legacy, first])).not.toThrow();
    expect(second[0].stableKey).not.toBe(first[0].stableKey);
    expect(second[0].id).not.toBe(first[0].id);
    expect(legacy[0].id).toBe(1);
  });

  it("allows a draft replacement without merging legacy modules", () => {
    const next = prepareIndependentPathway(legacy, [legacy]);
    expect(() => assertPathwaySave(next, { id: "new", pathway_root_id: "new" }, [
      { release: { id: "old", published_at: "2026-01-01" }, modules: legacy },
    ])).not.toThrow();
    expect(next).toHaveLength(1);
  });

  it("keeps published identities protected inside a pathway", () => {
    const published = prepareIndependentPathway(legacy, [legacy]);
    const changed = structuredClone(published);
    changed[0].submodules[0].exercises[0].type = "multiple";
    const history = [{ release: { id: "v2", pathway_root_id: "root", published_at: "2026-01-01" }, modules: published }];
    expect(() => assertPathwaySave(changed, { id: "v3", pathway_root_id: "root" }, history)).toThrow();
    changed[0].submodules[0].exercises[0].type = "open";
    expect(() => assertPathwaySave(changed, { id: "v3", pathway_root_id: "root" }, history)).not.toThrow();
    changed[0].submodules[0].exercises = [];
    expect(() => assertPathwaySave(changed, { id: "v3", pathway_root_id: "root" }, history)).toThrow();
  });
});
