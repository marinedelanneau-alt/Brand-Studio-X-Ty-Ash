import { getCurrentAccount } from "@/lib/session";
import { isLegalReleaseEnabled } from "@/lib/legal-release";
import { getWorkspaceData } from "@/lib/training";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!isLegalReleaseEnabled()) return Response.json({ error: "Service non activé." }, { status: 404 });
  const account = await getCurrentAccount();
  if (!account) return Response.json({ error: "Connexion requise." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const workspace = await getWorkspaceData(account.id);
  const db = createSupabaseServerClient();
  const { data: requests, error } = await db.from("privacy_requests").select("id,request_type,message,status,created_at,due_at,completed_at").eq("account_id", account.id);
  if (error) return Response.json({ error: "Export indisponible. Réessayez ultérieurement." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const output = {
    exportedAt: new Date().toISOString(),
    scope: "Compte, projet courant, réponses et demandes de droits. Les fichiers sont référencés par leur URL ; factures et autres archives peuvent être demandées via le formulaire d’accès.",
    account: { email: account.email, name: account.client_name, company: account.company_name, createdAt: account.created_at },
    project: workspace.project,
    answers: workspace.modules.map((module) => {
      const answers = module.answers as Record<number, string[]>;
      return { module: module.title, responses: module.exercises.filter((exercise) => answers[exercise.id]?.length).map((exercise) => ({ question: exercise.question, values: answers[exercise.id] })) };
    }),
    requests,
  };
  return new Response(JSON.stringify(output, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="brand-studio-mes-donnees.json"', "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
