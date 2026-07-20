"use server";

import { revalidatePath } from "next/cache";
import { clearCompletedModulesCookie } from "@/lib/module-completion-fallback";
import { getAuthenticatedAccount } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProjectByAccountId } from "@/lib/training";
import { isMissingDatabaseObject } from "@/lib/database-errors";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";

export type ResetAnswersState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function resetCurrentUserAnswers(): Promise<ResetAnswersState> {
  try {
    const account = await getAuthenticatedAccount();
    const project = await getProjectByAccountId(account.id);

    if (!project) {
      return { status: "error", message: "Projet introuvable." };
    }

    const supabase = createSupabaseServerClient();
    const answersResult = await supabase
      .from("project_exercise_answers")
      .delete()
      .eq("project_id", project.id);

    if (answersResult.error) {
      throw new Error(answersResult.error.message);
    }

    const statesResult = await supabase
      .from("project_module_states")
      .delete()
      .eq("project_id", project.id);

    if (statesResult.error && !isMissingDatabaseObject(statesResult.error)) {
      throw new Error(statesResult.error.message);
    }

    await clearCompletedModulesCookie(project.id);
    revalidatePath("/mon-espace");

    return {
      status: "success",
      message: "Tes réponses et ta progression ont été réinitialisées.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }
}
