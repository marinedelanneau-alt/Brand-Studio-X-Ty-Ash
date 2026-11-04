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

  it("reuses the history hierarchy with only the short instruction in the pink panel", () => {
    const result = renderToStaticMarkup(<SubmoduleIntroduction contentHtml="<p>Consigne modifiable</p>" exerciseCount={2} introduction={{ layout: "brand_video", headline: "Accroche modifiable", paragraphs: ["Premier paragraphe", "Deuxième paragraphe"], keyPhrase: "Phrase clé modifiable" }} />);
    expect(result).toContain('class="mb-7 max-w-3xl space-y-4 border-b');
    expect(result).toContain('sm:text-3xl');
    expect(result).toContain('border-l-2');
    expect(result.indexOf("Accroche modifiable")).toBeLessThan(result.indexOf('class="submodule-introduction"'));
    expect(result.indexOf("Phrase clé modifiable")).toBeLessThan(result.indexOf('class="submodule-introduction"'));
    expect(result).toContain('<p>Consigne modifiable</p>');
  });
});
