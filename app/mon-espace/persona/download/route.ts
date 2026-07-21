import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { getAuthenticatedAccount } from "@/lib/session";
import { getWorkspaceData } from "@/lib/training";
import { buildPersonaCv } from "@/lib/persona-summary";
import { PersonaPdf } from "@/lib/persona-pdf";

export async function GET() {
  const account = await getAuthenticatedAccount();
  const workspace = await getWorkspaceData(account.id);
  const match = workspace.modules.flatMap((module) => module.exercises.map((exercise) => ({ module, exercise })))
    .find(({ exercise }) => exercise.type === "brand_persona");
  if (!workspace.project || !match) return new Response("Fiche persona introuvable.", { status: 404 });
  const personaAnswers = match.module.answers as Record<number, string[]>;
  const persona = buildPersonaCv(match.exercise, personaAnswers[match.exercise.id] ?? []);
  const document = createElement(PersonaPdf, { persona, projectName: workspace.project.name }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(document);
  const slug = (persona.firstName || "persona").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="brand-studio-persona-${slug}.pdf"`, "Cache-Control": "private, no-store" } });
}
