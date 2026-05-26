import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import {
  generateGuideFromAnswers,
  saveBrandGuideSnapshot,
} from "@/lib/brand-guide";
import { renderBrandGuidePdf } from "@/lib/brand-guide-pdf";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import { getWorkspaceData } from "@/lib/training";

export const runtime = "nodejs";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "marque";
}

export async function GET() {
  try {
    const account = await getAuthenticatedAccount();
    if (!(await hasActiveAccess(account.id))) {
      return NextResponse.redirect(
        new URL("/pricing", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
      );
    }
    const workspace = await getWorkspaceData(account.id);

    if (!workspace.project) {
      return NextResponse.json(
        { message: "Creez d'abord votre projet de marque." },
        { status: 400 },
      );
    }

    const guide = generateGuideFromAnswers({
      project: workspace.project,
      modules: workspace.modules,
    });
    const pdfBuffer = await renderBrandGuidePdf(guide);

    await saveBrandGuideSnapshot({
      projectId: workspace.project.id,
      guide,
    }).catch(() => undefined);

    const filename = `guide-de-marque-${slugify(guide.brandName)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    unstable_rethrow(error);
    return NextResponse.json(
      { message: "Le PDF n'a pas pu etre genere." },
      { status: 500 },
    );
  }
}
