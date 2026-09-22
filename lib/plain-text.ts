/** Convert editor markup to display text without changing stored rich text. */
export function toPlainText(value: string): string {
  const entities: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    laquo: "«", raquo: "»", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
    ndash: "–", mdash: "—", hellip: "…", eacute: "é", egrave: "è", agrave: "à", ccedil: "ç",
  };
  let text = value;
  // Configuration and placeholders are not user answers. Never expose their
  // payload as text, even when an old export joined several metadata entries.
  try {
    const decoded = decodeURIComponent(text);
    if (/^\s*__[a-z0-9_]+__\s*:/i.test(decoded)) text = decoded;
  } catch {
    // Ordinary text can contain a literal percent sign.
  }
  text = text.replace(/(?:^|\s*[,|•·]?\s+)__[a-z0-9_]+__\s*:[\s\S]*$/i, "");
  for (let pass = 0; pass < 4; pass += 1) {
    const decoded = text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, key: string) => {
      if (!key.startsWith("#")) return entities[key] ?? entity;
      const code = key[1]?.toLowerCase() === "x" ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : entity;
    });
    text = decoded
      .replace(/<!--[^]*?-->/g, "")
      .replace(/<(script|style)\b[^>]*>[^]*?<\/\1\s*>/gi, "")
      .replace(/<\/?(?:p|div|br|li|ul|ol|h[1-6]|section|blockquote|tr|td|th)\b[^>]*>/gi, " ")
      .replace(/<\/?[a-z][a-z0-9:-]*(?:\s+[^<>]*?)?\s*\/?>/gi, "");
    if (text === decoded && !text.includes("&")) break;
  }
  return text.replace(/\s+/g, " ").trim();
}
