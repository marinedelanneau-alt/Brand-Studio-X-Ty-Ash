import { getAdminUser } from "@/lib/admin-user-insights";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser(Number((await params).id));
  if (!user) return new Response("Utilisateur introuvable", { status: 404 });
  const rows = [["Utilisateur", "Entreprise", "Module", "Sous-module", "Exercice", "Réponse", "Dernière modification"], ...user.answers.map((answer) => [user.name, user.company, answer.moduleTitle, answer.submoduleTitle, answer.exerciseTitle, answer.values.join(" | "), answer.updatedAt ?? ""])];
  const body = `\uFEFF${rows.map((row) => row.map(csv).join(";")).join("\r\n")}`;
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="reponses-${user.id}.csv"`, "Cache-Control": "private, no-store" } });
}
