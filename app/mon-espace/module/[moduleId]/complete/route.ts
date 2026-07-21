import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { updateCompletedModuleCookie } from "@/lib/module-completion-fallback";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import { getWorkspaceData, setProjectModuleCompletion } from "@/lib/training";
import { resolveWorkspaceModule } from "@/lib/module-routing";

export const dynamic = "force-dynamic";

async function markModuleAsCompleted(routeKey: string) {
  const account = await getAuthenticatedAccount();
  if (!(await hasActiveAccess(account.id))) {
    return false;
  }
  const workspace = await getWorkspaceData(account.id);
  const project = workspace.project;
  const selectedModule = resolveWorkspaceModule(workspace.modules, routeKey);

  if (!project || !selectedModule) {
    return false;
  }

  await setProjectModuleCompletion({
    projectId: project.id,
    moduleId: selectedModule.id,
    isCompleted: true,
  });
  await updateCompletedModuleCookie({
    projectId: project.id,
    moduleId: selectedModule.id,
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
    if (!moduleId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const completed = await markModuleAsCompleted(moduleId);
    if (!completed) return NextResponse.json({ ok: false }, { status: 404 });
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
    if (moduleId) await markModuleAsCompleted(moduleId);

    return NextResponse.redirect(new URL(getRedirectTarget(request), request.url));
  } catch (error) {
    unstable_rethrow(error);
    return NextResponse.redirect(new URL("/mon-espace", request.url));
  }
}
