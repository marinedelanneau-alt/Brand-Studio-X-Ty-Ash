import type { WorkspaceModule } from "./training-types";
export const TYASH_QUESTIONNAIRE_REVISION = "julien-2026-11-04";
export type TyashQuestionnaireRule = {
  status: "active" | "archived" | "merged";
  prefill?: boolean;
  displayModuleKey?: string;
  displaySubmoduleKey?: string;
  mergeSources?: string[];
  keepTogether?: boolean;
  optionAliases?: Record<string, string>;
};

export function tyashRefonteEnabled(module: { tyashQuestionnaireRevision?: string }) {
  return module.tyashQuestionnaireRevision === TYASH_QUESTIONNAIRE_REVISION;
}

type ProjectableModule = Omit<WorkspaceModule, "progress"> & { progress?: WorkspaceModule["progress"]; isManuallyCompleted?: boolean };

// Generic visibility and historical answer reconciliation. Editorial content
// and the actual hierarchy come from the selected release snapshot.
export function projectTyashQuestionnaire<T extends ProjectableModule>(input: T[]): T[] {
  if (!input.some(tyashRefonteEnabled)) return input;
  const originals = new Map(input.flatMap(m => m.exercises.map(e => [e.stableKey!, { m, e }] as const)));
  return input.filter(m => !m.archived).map(module => {
    if (!tyashRefonteEnabled(module)) return module;
    const answers: Record<number, string[]> = {};
    const answerVersions: WorkspaceModule["answerVersions"] = {};
    const submodules = module.submodules.filter(s => !s.archived).map(submodule => {
      const exercises = [...originals.values()].flatMap(({ m, e }) => {
        const rule = e.tyashQuestionnaire ?? { status: "active" };
        if (rule.status !== "active" || (rule.displayModuleKey ?? m.stableKey) !== module.stableKey || (rule.displaySubmoduleKey ?? m.submodules.find(s => s.id === e.submodule_id)?.stableKey) !== submodule.stableKey) return [];
        let values = m.answers[e.id] ?? [];
        if (["single", "multiple", "boolean", "color"].includes(e.type)) values = values.map(value => rule.optionAliases?.[value] ?? value);
        const sources = [e.stableKey!, ...(rule.mergeSources ?? [])];
        // A saved current response (even cleared) wins over archived source answers.
        if (rule.mergeSources?.length && (!m.answerVersions[e.id] || m.answerVersions[e.id].updatedAt < Date.parse(m.tyashQuestionnairePreparedAt ?? ""))) {
          values = sources.flatMap(key => {
            const original = originals.get(key);
            return original ? (original.m.answers[original.e.id] ?? []).filter(v => v.trim()).map(v => `${original.e.question}\n${v}`) : [];
          });
          if (values.length) values = [values.join("\n\n")];
        }
        answers[e.id] = values;
        if (m.answerVersions[e.id]) answerVersions[e.id] = m.answerVersions[e.id];
        const projected = { ...e, module_id: module.id, submodule_id: submodule.id, answerModuleStableKey: e.answerModuleStableKey ?? m.stableKey, answerSubmoduleStableKey: e.answerSubmoduleStableKey ?? m.submodules.find(s => s.id === e.submodule_id)?.stableKey };
        return [projected];
      });
      return { ...submodule, exercises };
    }).filter(s => s.exercises.length);
    return { ...module, submodules, exercises: submodules.flatMap(s => s.exercises), answers, answerVersions };
  });
}

export function validateTyashQuestionnaireMetadata(modules: Array<{ stableKey?: string; tyashQuestionnaireRevision?: string; submodules: Array<{ stableKey?: string; exercises: Array<{ stableKey?: string; tyashQuestionnaire?: TyashQuestionnaireRule }> }> }>) {
  if (!modules.some(tyashRefonteEnabled)) return;
  const all = modules.flatMap(m => m.submodules.flatMap(s => s.exercises));
  const keys = new Set(all.map(e => e.stableKey));
  for (const e of all) {
    const rule = e.tyashQuestionnaire;
    if (!rule) continue; // Newly added Admin questions default to active.
    if (!["active", "archived", "merged"].includes(rule.status) || rule.mergeSources?.some(k => k === e.stableKey || !keys.has(k))) throw new Error("Métadonnées de questionnaire TYASH invalides.");
    if (rule.displayModuleKey || rule.displaySubmoduleKey) {
      const target = modules.find(m => m.stableKey === rule.displayModuleKey);
      if (!target?.submodules.some(s => s.stableKey === rule.displaySubmoduleKey)) throw new Error("Destination de question TYASH invalide.");
    }
  }
}
