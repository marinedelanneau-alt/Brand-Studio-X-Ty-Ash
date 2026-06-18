const INFO_BOX_TYPES = new Set(["tip", "example", "warning", "remember", "note"]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}

function renderMarkdownBlocks(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let index = 0;

  const consumeList = (ordered: boolean) => {
    const items: string[] = [];

    while (index < lines.length) {
      const line = lines[index] ?? "";
      const match = ordered ? line.match(/^\s*\d+\.\s+(.+)$/) : line.match(/^\s*[-*]\s+(.+)$/);

      if (!match) {
        break;
      }

      items.push(`<li>${applyInlineMarkdown(match[1] ?? "")}</li>`);
      index += 1;
    }

    html.push(`<${ordered ? "ol" : "ul"}>${items.join("")}</${ordered ? "ol" : "ul"}>`);
  };

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    const fenceMatch = trimmedLine.match(/^```([a-zA-Z]+)\s*$/);
    if (fenceMatch && INFO_BOX_TYPES.has((fenceMatch[1] ?? "").toLowerCase())) {
      const type = (fenceMatch[1] ?? "note").toLowerCase();
      const contentLines: string[] = [];
      index += 1;

      while (index < lines.length && (lines[index] ?? "").trim() !== "```") {
        contentLines.push(lines[index] ?? "");
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      html.push(
        `<div data-info-box="${type}">${renderMarkdownBlocks(contentLines.join("\n"))}</div>`,
      );
      continue;
    }

    if (/^---+$/.test(trimmedLine)) {
      html.push("<hr />");
      index += 1;
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1]?.length ?? 2;
      html.push(`<h${level}>${applyInlineMarkdown(headingMatch[2] ?? "")}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      consumeList(false);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      consumeList(true);
      continue;
    }

    if (trimmedLine.startsWith(">")) {
      const quoteLines: string[] = [];

      while (index < lines.length && (lines[index] ?? "").trim().startsWith(">")) {
        quoteLines.push((lines[index] ?? "").replace(/^\s*>\s?/, ""));
        index += 1;
      }

      html.push(`<blockquote>${renderMarkdownBlocks(quoteLines.join("\n"))}</blockquote>`);
      continue;
    }

    const paragraphLines = [trimmedLine];
    index += 1;

    while (
      index < lines.length &&
      (lines[index] ?? "").trim() &&
      !/^(#{1,3})\s+/.test((lines[index] ?? "").trim()) &&
      !/^---+$/.test((lines[index] ?? "").trim()) &&
      !/^\s*[-*]\s+/.test(lines[index] ?? "") &&
      !/^\s*\d+\.\s+/.test(lines[index] ?? "") &&
      !(lines[index] ?? "").trim().startsWith(">") &&
      !/^```([a-zA-Z]+)\s*$/.test((lines[index] ?? "").trim())
    ) {
      paragraphLines.push((lines[index] ?? "").trim());
      index += 1;
    }

    html.push(`<p>${applyInlineMarkdown(paragraphLines.join(" "))}</p>`);
  }

  return html.join("");
}

function looksLikeHtml(value: string) {
  return /<[^>]+>/.test(value);
}

export function renderPedagogicalContent(value: string | null | undefined) {
  const content = String(value ?? "").trim();

  if (!content) {
    return "";
  }

  return looksLikeHtml(content) ? content : renderMarkdownBlocks(content);
}
