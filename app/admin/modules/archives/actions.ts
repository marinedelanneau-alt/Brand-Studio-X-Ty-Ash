"use server";
import { getAuthenticatedAdmin } from "@/lib/session";
import { updateAdminQuestionnaireStructure } from "@/lib/training";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function changeQuestionnaireStructure(form: FormData) {
  const account = await getAuthenticatedAdmin();
  const number = (name: string) => form.has(name) ? Number(form.get(name)) : undefined;
  await updateAdminQuestionnaireStructure(account.id, { moduleId: Number(form.get("moduleId")), submoduleId: number("submoduleId"), questionId: number("questionId"), targetSubmoduleId: number("targetSubmoduleId"), expectedRevision: String(form.get("revision")), restore: true });
  revalidatePath("/admin/modules");
  revalidatePath("/admin/modules/archives");
  redirect("/admin/modules/archives");
}
