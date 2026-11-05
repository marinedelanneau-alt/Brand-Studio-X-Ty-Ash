import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { WorkspaceModule } from "../lib/training-types";
import type { ModuleSummaryCard } from "../lib/module-summary";
import type { ModuleShareData } from "../lib/get-module-share-data";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../app/ui/module-answer-form", () => ({ default: () => null }));
vi.mock("../app/ui/share-story-card", () => ({ default: () => <div>Story preview</div> }));

import ModuleCompletionScreen from "../app/ui/module-completion-screen";

function render(stableKey: string) {
  const workspaceModule = { stableKey, exercises: [], submodules: [] } as unknown as WorkspaceModule;
  const summary = {
    title: "Ton entreprise", subtitle: "Projet témoin",
    keyTakeaways: [{ id: "recap", label: "Carte express", value: "Réponse témoin" }],
    submoduleRecaps: [
      { id: 1, position: 1, title: "Ton histoire", highlights: [{ label: "Question témoin", value: "Réponse témoin" }] },
      { id: 2, position: 2, title: "Ce qui t'anime", highlights: [{ label: "Autre question", value: "Autre réponse" }] },
    ],
  } as ModuleSummaryCard;
  const before = JSON.stringify({ workspaceModule, summary });
  const html = renderToStaticMarkup(<ModuleCompletionScreen
    module={workspaceModule} summary={summary} shareData={{ progress: 100, moduleKey: "entreprise", brandName: "Projet" } as ModuleShareData}
    userId={1} projectId={1} modulePosition={1} editHref="/edit" completionHref="/complete" pdfHref="/summary.pdf"
  />);
  expect(JSON.stringify({ workspaceModule, summary })).toBe(before);
  return html;
}

describe("module completion presentation", () => {
  it("uses one existing accordion before sharing in TYASH, without express cards", () => {
    const html = render("tyash_v1_module_entreprise");
    expect(html).not.toContain("Synthese express");
    expect(html).not.toContain("Carte express");
    expect(html.match(/Le détail par sous-module/g)).toHaveLength(1);
    expect(html.indexOf("Le détail par sous-module")).toBeLessThan(html.indexOf("Partager mon avancée"));
    expect(html).toContain("Réponse témoin");
    expect(html).toContain("Ce qui t&#x27;anime");
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('href="/summary.pdf"');
  });

  it("preserves the express cards and section order in original Brand Studio", () => {
    const html = render("original_module_entreprise");
    expect(html).toContain("Synthese express");
    expect(html).toContain("Carte express");
    expect(html.indexOf("Le détail par sous-module")).toBeGreaterThan(html.indexOf("Partager mon avancée"));
  });
});
