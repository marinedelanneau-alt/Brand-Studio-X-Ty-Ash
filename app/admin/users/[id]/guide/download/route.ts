import { getCurrentAccount } from "@/lib/session";
import { findAccountById } from "@/lib/access-codes";
import { getWorkspaceData } from "@/lib/training";
import { generateGuideFromAnswers } from "@/lib/brand-guide";
import { renderBrandGuidePdf } from "@/lib/brand-guide-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const errorResponse = (message: string, status: number) => Response.json({ message }, { status, headers });
  try {
    const admin = await getCurrentAccount();
    if (!admin) return errorResponse("Connexion requise.", 401);
    if (admin.role !== "admin" && !admin.is_admin) return errorResponse("Accès réservé à l’administration.", 403);

    const rawId = (await params).id;
    const id = Number(rawId);
    if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id <= 0) return errorResponse("Utilisateur introuvable.", 404);
    const user = await findAccountById(id);
    if (!user || user.is_admin || user.role === "admin") return errorResponse("Utilisateur introuvable.", 404);
    // Read the selected participant's workspace, never the admin's draft workspace.
    const workspace = await getWorkspaceData(user.id);
    if (!workspace.project) return errorResponse("Cet utilisateur n’a pas encore de projet de marque.", 404);
    const guide = generateGuideFromAnswers({
      project: workspace.project,
      modules: workspace.modules,
      brandName: user.company_name?.trim() || workspace.project.name,
    });
    // Download only: do not save a snapshot or change participant data.
    const pdf = await renderBrandGuidePdf(guide);
    const slug = guide.brandName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "marque";
    return new Response(new Uint8Array(pdf), { headers: {
      ...headers,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="guide-de-marque-${slug}-${user.id}.pdf"`,
    } });
  } catch {
    return errorResponse("Le PDF n’a pas pu être généré. Réessayez dans quelques instants.", 500);
  }
}
