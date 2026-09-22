import { describe, expect, it } from "vitest";
import { buildModuleSummaryCard } from "../lib/module-summary";
import { serializeIndexedAnswerItem } from "../lib/exercise-types";
import type { ModuleExercise, WorkspaceModule } from "../lib/training-types";

function summarize(rows: Array<{ question: string; values: string[]; type?: ModuleExercise["type"]; options?: string[] }>, title = "Vision & marque") {
  const exercises = rows.map((row, id) => ({ id, position: id, question: row.question, type: row.type ?? "open", options: row.options ?? [] }) as ModuleExercise);
  const workspaceModule = { title, position: 1, exercises, answers: Object.fromEntries(rows.map((row, id) => [id, row.values])), submodules: [{ id: 1, title: "Mission et vision", position: 1, exercises }] } as unknown as WorkspaceModule;
  return buildModuleSummaryCard({ projectName: "Voix Vive", module: workspaceModule });
}

describe("module summary answer attribution", () => {
  it("removes table configuration and placeholders throughout the document", () => {
    const summary = summarize([{ question: "Mes valeurs", type: "table", options: ["__table_rows__:2", "__table_columns__:2", "__table_column__:Valeur", "__table_column__:Application"], values: ["__table_rows__:3", "__table_placeholder__:Écoute", "Authenticité saisie", "Des échanges transparents"] }]);
    const document = JSON.stringify(summary);
    expect(document).not.toContain("__table");
    expect(document).not.toContain("Écoute");
    expect(document).toContain("Authenticité saisie");
    expect(document).toContain("Des échanges transparents");
    expect(summary.submoduleRecaps[0].highlights[0].value).toContain("Valeur : Authenticité saisie");
    expect(summary.submoduleRecaps[0].highlights[0].table).toEqual({ columns: ["Valeur", "Application"], rows: [["Authenticité saisie", "Des échanges transparents"]] });
  });

  it("does not turn configuration-only data into a completed answer", () => {
    const summary = summarize([{ question: "Mes valeurs", type: "table", values: ["__table_rows__:3", "__table_placeholder__:Écoute"] }]);
    expect(summary.submoduleRecaps[0].highlights[0].value).toBe("À compléter");
    expect(summary.quickRecap.find((item) => item.label === "Tes valeurs")?.value).toBe("À compléter");
  });
  it("renders rich question labels and answers without HTML", () => {
    const summary = summarize([{ question: "<p>Ta mission doit guider tes offres.</p><p>Test : est-elle alignée ?</p>", values: ["<p>Je pense que mes offres sont alignées avec mes missions</p>"] }]);
    expect(summary.submoduleRecaps[0].highlights[0]).toMatchObject({ label: "Ta mission doit guider tes offres. Test : est-elle alignée ?", value: "Je pense que mes offres sont alignées avec mes missions" });
  });
  it("uses Ma mission instead of the final phrase in the same submodule", () => {
    const summary = summarize([
      { question: "Ma mission", values: ["Former à la prise de parole"] },
      { question: "Ma vision", values: ["Rajeunir le métier"] },
      { question: "Ma promesse", values: ["Prendre la parole avec confiance"] },
      { question: "Mes valeurs", values: ["Écoute, Respect"] },
      { question: "Phrase essentielle / version finale", values: ["Voix Vive, chaque voix est unique !"], type: "prompt_open" },
    ]);
    const expected = ["Former à la prise de parole", "Rajeunir le métier", "Prendre la parole avec confiance", "Écoute, Respect"];
    expect(summary.quickRecap.map((item) => item.value)).toEqual(expected);
    expect(summary.keyTakeaways.map((item) => item.value)).toEqual(expected);
  });

  it("does not substitute another question for an unanswered mission", () => {
    const summary = summarize([
      { question: "Comment imagines-tu ta mission ?", values: ["Brouillon"] },
      { question: "Ma mission", values: [] },
      { question: "Phrase finale", values: ["Slogan"] },
    ]);
    expect(summary.keyTakeaways.find((item) => item.label === "Ta mission")?.value).toBe("À compléter");
  });

  it("keeps grouped questions separate even when an indexed answer is missing", () => {
    const summary = summarize([{ question: "Fondations", type: "group_open", options: ["__question_item__:Ma mission", "__question_item__:Ma vision", "__question_item__:Ma promesse"], values: [serializeIndexedAnswerItem(2, 0, "Promesse"), serializeIndexedAnswerItem(0, 0, "Mission")] }]);
    expect(summary.quickRecap.slice(0, 3).map((item) => item.value)).toEqual(["Mission", "À compléter", "Promesse"]);
  });

  it("does not mistake an unrelated table for values", () => {
    const summary = summarize([{ question: "Mes concurrents", type: "table", values: ["Concurrent"] }, { question: "Mes valeurs", values: ["Respect"] }]);
    expect(summary.quickRecap.find((item) => item.label === "Tes valeurs")?.value).toBe("Respect");
  });

  it("maps positioning decisions to their individual questions", () => {
    const summary = summarize([
      { question: "Contexte client", values: ["Contexte"] },
      { question: "Ma cible", values: ["Cible"] },
      { question: "Ma différence", values: ["Différence"] },
      { question: "Mon positionnement", values: ["Positionnement"] },
      { question: "Phrase finale", values: ["Autre phrase"] },
    ], "Positionnement");
    expect(summary.keyTakeaways.find((item) => item.label === "La situation de ton client")?.value).toBe("Contexte");
    expect(summary.keyTakeaways.find((item) => item.label === "Ta cible principale")?.value).toBe("Cible");
    expect(summary.keyTakeaways.find((item) => item.label === "Ta différence")?.value).toBe("Différence");
    expect(summary.keyTakeaways.find((item) => item.label === "Ton positionnement formulé")?.value).toBe("Positionnement");
  });
});
