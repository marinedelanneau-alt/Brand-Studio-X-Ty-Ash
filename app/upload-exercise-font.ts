"use server";

import { getAuthenticatedAccount } from "@/lib/session";
import { getWorkspaceData, uploadProjectExerciseFont } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

const FONT_EXTENSIONS = new Set(["woff", "woff2", "ttf", "otf"]);

export async function uploadExerciseFont(formData: FormData) {
  try {
    const account = await getAuthenticatedAccount();
    const moduleId = Number(formData.get("moduleId"));
    const exerciseId = Number(formData.get("exerciseId"));
    const file = formData.get("font");
    if (!(file instanceof File) || !file.size) return { status: "error" as const, message: "Choisis un fichier de police." };
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!FONT_EXTENSIONS.has(extension) || file.size > 5 * 1024 * 1024) {
      return { status: "error" as const, message: "Utilise un fichier WOFF, WOFF2, TTF ou OTF de moins de 5 Mo." };
    }
    const workspace = await getWorkspaceData(account.id);
    const targetModule = workspace.modules.find((item) => item.id === moduleId);
    const exercise = targetModule?.exercises.find((item) => item.id === exerciseId);
    if (!workspace.project || !exercise || exercise.type !== "typography") {
      return { status: "error" as const, message: "Cet exercice n’est pas disponible." };
    }
    const url = await uploadProjectExerciseFont({ projectId: workspace.project.id, exerciseId, file });
    return { status: "success" as const, url, fileName: file.name };
  } catch (error) {
    return { status: "error" as const, message: getUserFacingDataErrorMessage(error) };
  }
}
