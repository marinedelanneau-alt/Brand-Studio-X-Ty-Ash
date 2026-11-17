import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { prepareAccountBackup, streamAccountBackup } from "@/lib/account-backup";
import { hasActiveAccess } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) redirect("/");
  if (!(await hasActiveAccess(account.id))) return Response.json({ error: "Votre accès aux fonctionnalités payantes est inactif." }, { status: 403 });
  try {
    const backup = await prepareAccountBackup(account);
    return new Response(streamAccountBackup(backup), { headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="brand-studio-sauvegarde.zip"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return Response.json({ error: "Votre sauvegarde est temporairement indisponible. Veuillez réessayer." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
