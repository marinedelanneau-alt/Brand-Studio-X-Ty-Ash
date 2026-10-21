import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SubmoduleIntroduction from "../app/ui/submodule-introduction";

describe("submodule editorial introduction", () => {
  it("preserves legacy rich content without adding replacement copy", () => {
    const html = "<p>Votre introduction.</p><ul><li>Votre repère</li></ul>";
    const result = renderToStaticMarkup(<SubmoduleIntroduction contentHtml={html} exerciseCount={5} />);
    expect(result).toContain(html);
    expect(result).not.toContain("submodule-introduction__headline");
  });

  it.each(["", "<p><br></p>", "<p>&nbsp;</p>"])("omits empty rich text: %s", contentHtml => {
    expect(renderToStaticMarkup(<SubmoduleIntroduction contentHtml={contentHtml} exerciseCount={0} />)).toBe("");
  });

  it.each([[1, "1 exercice"], [7, "7 exercices"]])("uses the current exercise count %s", (exerciseCount, text) => {
    const result = renderToStaticMarkup(<SubmoduleIntroduction
      contentHtml="<p>Contenu historique</p>"
      introduction={{ label: "Votre direction", headline: "Votre cap", paragraphs: ["Votre première idée.", "Votre deuxième idée."], transition: "{exercises} pour préciser votre direction." }}
      exerciseCount={exerciseCount as number}
    />);
    expect(result).toContain(`${text} pour préciser votre direction.`);
    expect(result).toContain("<h3");
    expect(result).toContain("Votre deuxième idée.");
    expect(result).not.toContain("Contenu historique");
    expect(result).not.toContain("Ce qui vous anime");
  });

  it("preserves media-only introductions", () => {
    const result = renderToStaticMarkup(<SubmoduleIntroduction contentHtml='<img src="/example.png" alt="Votre exemple" />' exerciseCount={2} />);
    expect(result).toContain('alt="Votre exemple"');
  });
});
