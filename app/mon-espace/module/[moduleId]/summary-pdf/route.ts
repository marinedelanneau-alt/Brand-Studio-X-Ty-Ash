import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { generateModulePdf } from "@/lib/generate-module-pdf";
import {
  getModuleShareData,
  slugifyFilePart,
} from "@/lib/get-module-share-data";
import { buildModuleSummaryCard } from "@/lib/module-summary";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import { getWorkspaceData } from "@/lib/training";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  try {
    const account = await getAuthenticatedAccount();
    if (!(await hasActiveAccess(account.id))) {
      return NextResponse.json(
        { message: "Debloque Brand Studio pour telecharger ce resume." },
        { status: 403 },
      );
    }

    const { moduleId } = await params;
    const numericModuleId = Number(moduleId);
    if (!Number.isFinite(numericModuleId) || numericModuleId <= 0) {
      return NextResponse.json({ message: "Module introuvable." }, { status: 404 });
    }

    const workspace = await getWorkspaceData(account.id);
    if (!workspace.project) {
      return NextResponse.json(
        { message: "Cree d'abord ton projet de marque." },
        { status: 400 },
      );
    }

    const currentModule = workspace.modules.find((item) => item.id === numericModuleId);
    if (!currentModule) {
      return NextResponse.json({ message: "Module introuvable." }, { status: 404 });
    }

    const brandName = account.company_name?.trim() || workspace.project.name;
    const summary = buildModuleSummaryCard({ projectName: brandName, module: currentModule });
    const shareData = getModuleShareData({ brandName, module: currentModule, summary });
    const pdfBuffer = await generateModulePdf({ summary, shareData });
    const filename = `brand-studio-${shareData.moduleKey}-${slugifyFilePart(brandName)}.pdf`;

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
      { message: "Le resume PDF n'a pas pu etre genere." },
      { status: 500 },
    );
  }
}
