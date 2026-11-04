import { renderToBuffer } from "@react-pdf/renderer";
import { getAdminUser } from "@/lib/admin-user-insights";
import { TyashQuestionnairePdf } from "@/lib/tyash-questionnaire-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return Response.json({ error: "Utilisateur introuvable." }, { status: 404 });
  // getAdminUser checks the verified Supabase identity and client-reader permission.
  const user = await getAdminUser(id);
  if (!user) return Response.json({ error: "Utilisateur introuvable." }, { status: 404 });
  const pdf = await renderToBuffer(TyashQuestionnairePdf({ user }));
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="brief-video-tyash-${id}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
