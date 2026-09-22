import { describe, expect, it } from "vitest";
import { toPlainText } from "../lib/plain-text";

describe("editor content displayed as plain text", () => {
  it("never prints stored metadata or its placeholder payload", () => {
    expect(toPlainText("__table_rows__:3, __table_placeholder__:Écoute, __table_placeholder__:Authenticité")).toBe("");
    expect(toPlainText(encodeURIComponent("__table_placeholder__:Exemple"))).toBe("");
    expect(toPlainText("Réponse réelle | __table_placeholder__:Exemple")).toBe("Réponse réelle");
  });
  it("removes markup and preserves paragraph and list boundaries", () => {
    expect(toPlainText("<p>Ta <strong>mission</strong> doit guider tes offres.</p><p>Test : est-elle alignée ?</p><ul><li>Oui</li><li>Non</li></ul>")).toBe("Ta mission doit guider tes offres. Test : est-elle alignée ? Oui Non");
  });
  it("decodes legacy encoded markup and French punctuation", () => {
    expect(toPlainText("&amp;lt;p&amp;gt;L&rsquo;écoute&nbsp;&amp;&nbsp;la clarté &#233; &#xE0;&amp;lt;/p&amp;gt;")).toBe("L’écoute & la clarté é à");
  });
  it("preserves literal comparisons and removes non-display elements", () => {
    expect(toPlainText('Prix < 100 € et 5 > 3<script>alert(1)</script><!-- note -->')).toBe("Prix < 100 € et 5 > 3");
    expect(toPlainText('Texte &#99999999;')).toBe('Texte &#99999999;');
  });
});
