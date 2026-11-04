"use server";
import { getAuthenticatedAdmin } from "@/lib/session";
import { getAdminReleaseWorkspace, saveAdminReleaseModules } from "@/lib/admin-content-release";
import { prepareTyashQuestionnaireRefonte, tyashRefonteEnabled } from "@/lib/tyash-questionnaire-refonte";
import type { WorkspaceModule } from "@/lib/training-types";
import { revalidatePath } from "next/cache";

export async function prepareTyashRefonteDraft() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://cplzwnlstcpqqzqeawgs.supabase.co") throw new Error("Action réservée au projet TYASH.");
  await getAuthenticatedAdmin();
  const workspace = await getAdminReleaseWorkspace();
  if ((workspace.modules as unknown as WorkspaceModule[]).every(tyashRefonteEnabled)) return;
  if (workspace.state.current_draft_release_id) throw new Error("Un brouillon est déjà ouvert. Conservez-le avant de préparer la refonte TYASH.");
  const modules = prepareTyashQuestionnaireRefonte(workspace.modules as unknown as WorkspaceModule[]);
  await saveAdminReleaseModules(modules, workspace.snapshot.updated_at);
  revalidatePath("/admin/modules");
  revalidatePath("/admin/releases");
}
