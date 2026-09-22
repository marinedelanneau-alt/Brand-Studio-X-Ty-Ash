import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { legalDrafts, legalRoutes } from "../lib/legal-documents";
const directory = resolve("docs/legal-drafts");
mkdirSync(directory, { recursive: true });
for (const draft of legalDrafts) {
  writeFileSync(resolve(directory, `${legalRoutes[draft.type].slice(1)}.md`), `# ${draft.title}\n\nBrouillon de préparation — non publié.\n\n${draft.sections.map(([title, body]) => `## ${title}\n\n${body}`).join("\n\n")}\n`, "utf8");
}
