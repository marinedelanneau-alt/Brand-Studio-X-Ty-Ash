import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getCommunicationActions } from "@/lib/communication-actions";
import { renderCommunicationActionPdf } from "@/lib/communication-action-pdf";
import { slugifyFilePart } from "@/lib/get-module-share-data";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import { getWorkspaceData } from "@/lib/training";

export const runtime = "nodejs";

export async function GET() {
  try {
    const account = await getAuthenticatedAccount();
    if (!(await hasActiveAccess(account.id))) {
      return NextResponse.json(
        { message: "Débloque Brand Studio pour télécharger ta feuille de route." },
        { status: 403 },
      );
    }

    const workspace = await getWorkspaceData(account.id);
    if (!workspace.project) {
      return NextResponse.json(
        { message: "Crée d'abord ton projet de marque." },
        { status: 400 },
      );
    }

    const actions = await getCommunicationActions(workspace.project.id);
    const brandName = account.company_name?.trim() || workspace.project.name;
    const pdfBuffer = await renderCommunicationActionPdf({ brandName, actions });
    const filename = `feuille-de-route-communication-${slugifyFilePart(brandName)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    unstable_rethrow(error);
    return NextResponse.json(
      { message: "La feuille de route PDF n'a pas pu être générée." },
      { status: 500 },
    );
  }
}
