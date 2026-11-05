import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceModule } from "../lib/training-types";
vi.mock("server-only", () => ({}));
vi.mock("../app/upload-exercise-font", () => ({ uploadExerciseFont: vi.fn() }));
vi.mock("../app/generate-module-answer-assistance", () => ({ requestModuleAnswerAssistance: vi.fn() }));
vi.mock("../app/save-module-answers", () => ({ saveModuleAnswers: vi.fn(), saveModuleDraft: vi.fn() }));
vi.mock("../app/upload-exercise-images", () => ({ uploadExerciseImages: vi.fn() }));
vi.mock("../hooks/usePersistentAnswers", () => ({ usePersistentAnswers: ({ initialAnswers }: { initialAnswers: unknown }) => ({ answers: initialAnswers, setAnswers: vi.fn(), hasHydrated: true, markUserInteraction: vi.fn(), syncStatus: "saved", syncError: null, retrySync: vi.fn() }) }));
import ModuleAnswerForm from "../app/ui/module-answer-form";

afterEach(() => vi.unstubAllEnvs());

function render(tyash: boolean) {
  const exercise = { id: 1, module_id: 1, submodule_id: 1, stableKey: tyash ? "tyash_v1_question" : "original_question", position: 1, type: "open", question: "Votre réponse personnelle ?", options: [], explanation: "", answer_placeholder: "" };
  const currentModule = { id: 1, stableKey: tyash ? "tyash_v1_module" : "original_module", title: "Module", position: 1,
    exercises: [exercise], submodules: [{ id: 1, title: "Sous-module", position: 1, exercises: [exercise] }],
    answers: { 1: ["Réponse déjà enregistrée."] }, progress: { answeredCount: 1, exerciseCount: 1, completionPercent: 100 },
  } as unknown as WorkspaceModule;
  const before = structuredClone(currentModule);
  const html = renderToStaticMarkup(<ModuleAnswerForm module={currentModule} persistenceScope={{ userId: 1, projectId: 1, moduleId: 1 }} />);
  expect(currentModule).toEqual(before);
  return html;
}

describe("exercise assistance visibility", () => {
  it("removes the tool, popup and buttons from TYASH while retaining answers and fields", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cplzwnlstcpqqzqeawgs.supabase.co");
    const html = render(true);
    expect(html).not.toContain("Outils IA"); expect(html).not.toContain("Suggère"); expect(html).not.toContain("Ameliore");
    expect(html).toContain("textarea"); expect(html).toContain("Réponse déjà enregistrée.");
  });
  it("keeps original Brand Studio's tools intact", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://original.supabase.co");
    const html = render(false);
    expect(html).toContain("Outils IA"); expect(html).toContain("Suggère"); expect(html).toContain("Ameliore");
  });
});
