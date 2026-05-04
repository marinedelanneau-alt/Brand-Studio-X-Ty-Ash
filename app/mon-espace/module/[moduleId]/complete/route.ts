import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { updateCompletedModuleCookie } from "@/lib/module-completion-fallback";
import { getAuthenticatedAccount } from "@/lib/session";
import { getProjectByAccountId, setProjectModuleCompletion } from "@/lib/training";

async function markModuleAsCompleted(moduleId: number) {
  const account = await getAuthenticatedAccount();
  const project = await getProjectByAccountId(account.id);

  if (!project) {
    return false;
  }

  await setProjectModuleCompletion({
    projectId: project.id,
    moduleId,
    isCompleted: true,
  });
  await updateCompletedModuleCookie({
    projectId: project.id,
    moduleId,
    isCompleted: true,
  });

  return true;
}

function getRedirectTarget(request: NextRequest) {
  const nextTarget = request.nextUrl.searchParams.get("next");

  if (!nextTarget || !nextTarget.startsWith("/")) {
    return "/mon-espace";
  }

  return nextTarget;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  try {
    const { moduleId } = await params;
    const numericModuleId = Number(moduleId);

    if (!Number.isFinite(numericModuleId) || numericModuleId <= 0) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await markModuleAsCompleted(numericModuleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    unstable_rethrow(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  try {
    const { moduleId } = await params;
    const numericModuleId = Number(moduleId);

    if (Number.isFinite(numericModuleId) && numericModuleId > 0) {
      await markModuleAsCompleted(numericModuleId);
    }

    return NextResponse.redirect(new URL(getRedirectTarget(request), request.url));
  } catch (error) {
    unstable_rethrow(error);
    return NextResponse.redirect(new URL("/mon-espace", request.url));
  }
}
