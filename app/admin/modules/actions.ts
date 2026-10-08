"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  getFillBlankCount,
  getPersistedExerciseQuestion,
  getStoredAnswerPlaceholderFromQuestion,
  type ExerciseType,
} from "@/lib/exercise-types";
import {
  normalizeSmartFeedbackConfig,
  type SmartFeedbackConfig,
} from "@/lib/smart-feedback";
import {
  createAdminVoiceNoteUploadTarget,
  deleteAdminModuleDefinitionDraft,
  saveAdminModuleDefinitionDraft,
  saveAdminVoiceNoteToDraft,
} from "@/lib/training";
import { getAuthenticatedAdmin } from "@/lib/session";
import { publishCurrentAdminRelease } from "@/lib/admin-content-release";

type EditorExercise = {
  clientId: string;
  type: ExerciseType;
  explanation: string;
  answerPlaceholder: string;
  audioUrl: string;
  audioTranscript: string;
  question: string;
  options: string[];
  feedbackConfig: SmartFeedbackConfig;
};

type EditorExerciseGroup = {
  groupId: string;
  questions: EditorExercise[];
};

type EditorSubmodule = {
  clientId: string;
  title: string;
  position: number;
  videoUrl: string;
  audioUrl: string;
  audioTranscript: string;
  contentHtml: string;
  exerciseGroups: EditorExerciseGroup[];
};

function revalidateTrainingExperience(moduleId?: number) {
  revalidatePath("/admin/modules");
  revalidatePath("/mon-espace");
  revalidatePath("/mon-espace", "layout");
  revalidatePath("/brand-guide");
  revalidatePath("/mon-espace/module/[moduleId]", "page");
  revalidatePath("/mon-espace/module/[moduleId]/summary-pdf", "page");
  revalidatePath("/mon-espace/module/[moduleId]/complete", "page");
  revalidatePath("/brand-guide/download");

  if (moduleId && Number.isFinite(moduleId) && moduleId > 0) {
    revalidatePath(`/mon-espace/module/${moduleId}`);
    revalidatePath(`/mon-espace/module/${moduleId}/summary-pdf`);
    revalidatePath(`/mon-espace/module/${moduleId}/complete`);
  }
}

async function publishSavedAdminChanges() {
  const notes = `Publication ADMIN du ${new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris",
  }).format(new Date())}`;
  await publishCurrentAdminRelease(notes);
}

export async function publishFinalVersionForAllUsers() {
  await getAuthenticatedAdmin();
  await publishSavedAdminChanges();
  revalidateTrainingExperience();
  revalidatePath("/admin/releases");
  redirect("/admin/modules?status=published");
}

function parseQuestion(rawQuestion: unknown) {
  const item = rawQuestion as Partial<EditorExercise>;
    const clientId =
      typeof item.clientId === "string" && item.clientId.trim()
        ? item.clientId.trim()
        : crypto.randomUUID();
    const type = item.type;
    const explanation =
      typeof item.explanation === "string" ? item.explanation.trim() : "";
    const question = typeof item.question === "string" ? item.question.trim() : "";
    const answerPlaceholder =
      typeof item.answerPlaceholder === "string" && item.answerPlaceholder.trim()
        ? item.answerPlaceholder.trim()
        : getStoredAnswerPlaceholderFromQuestion(question);
    const audioUrl =
      typeof item.audioUrl === "string" ? item.audioUrl.trim() : "";
    const audioTranscript =
      typeof item.audioTranscript === "string" ? item.audioTranscript.trim() : "";
    const options = Array.isArray(item.options)
      ? item.options
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

    if (
      type !== "static_text" &&
      type !== "open" &&
      type !== "single" &&
      type !== "multiple" &&
      type !== "popup_message" &&
      type !== "image_upload" &&
      type !== "editorial_calendar" &&
      type !== "moodboard" &&
      type !== "checklist" &&
      type !== "table" &&
      type !== "boolean" &&
      type !== "color" &&
      type !== "fill_blank" &&
      type !== "prompt_open" &&
      type !== "group_open" &&
      type !== "brand_persona" &&
      type !== "spectrum" &&
      type !== "color_palette"
      && type !== "typography"
    ) {
      throw new Error("Un type de question n’est pas reconnu. Aucune modification n’a été enregistrée.");
    }

    const normalizedOptions = options;
    if (!question) {
      throw new Error("Une question est vide. Complète-la avant d’enregistrer le module.");
    }

    if (type === "fill_blank") {
      if (getFillBlankCount(question) === 0) {
        throw new Error("Une question à trous doit contenir au moins un emplacement ___ à compléter.");
      }
    }

    if (type !== "open" && normalizedOptions.length < 2) {
      if (
        type !== "static_text" &&
        type !== "popup_message" &&
          type !== "image_upload" &&
          type !== "editorial_calendar" &&
          type !== "moodboard" &&
          type !== "fill_blank" &&
        type !== "checklist" &&
        type !== "table" &&
        type !== "prompt_open" &&
        type !== "group_open" &&
        type !== "brand_persona" &&
        type !== "spectrum" &&
          type !== "color_palette"
          && type !== "typography"
      ) {
        throw new Error(`La question « ${question.slice(0, 80)} » doit proposer au moins deux choix. Aucune question n’a été supprimée.`);
      }
    }

    return {
      clientId,
      type,
      explanation,
      answerPlaceholder,
      audioUrl,
      audioTranscript,
      question: getPersistedExerciseQuestion(type, question),
      options: normalizedOptions,
      feedbackConfig: normalizeSmartFeedbackConfig(item.feedbackConfig),
    } satisfies EditorExercise;
}

function parseExerciseGroups(rawValue: unknown) {
  if (!Array.isArray(rawValue)) {
    throw new Error("Invalid exercise groups payload");
  }

  return rawValue.flatMap((exerciseGroup) => {
    const item = exerciseGroup as Partial<EditorExerciseGroup>;
    const groupId =
      typeof item.groupId === "string" && item.groupId.trim()
        ? item.groupId.trim()
        : crypto.randomUUID();
    const questions = Array.isArray(item.questions)
      ? item.questions
          .map((question) => parseQuestion(question))
          .filter((question): question is EditorExercise => question !== null)
      : [];

    if (questions.length === 0) {
      return [];
    }

    return [{
      groupId,
      questions,
    } satisfies EditorExerciseGroup];
  });
}

function parseSubmodules(rawValue: FormDataEntryValue | null) {
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return [] as EditorSubmodule[];
  }

  const parsed = JSON.parse(rawValue) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid submodules payload");
  }

  return parsed.map((submodule, index) => {
    const item = submodule as Partial<EditorSubmodule>;
    const clientId =
      typeof item.clientId === "string" && item.clientId.trim()
        ? item.clientId.trim()
        : crypto.randomUUID();
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const videoUrl =
      typeof item.videoUrl === "string" ? item.videoUrl.trim() : "";
    const audioUrl =
      typeof item.audioUrl === "string" ? item.audioUrl.trim() : "";
    const audioTranscript =
      typeof item.audioTranscript === "string" ? item.audioTranscript.trim() : "";
    const contentHtml =
      typeof item.contentHtml === "string" ? item.contentHtml.trim() : "";
    const exerciseGroups = parseExerciseGroups(item.exerciseGroups);

    if (!title || !contentHtml) {
      throw new Error("Invalid submodule");
    }

    return {
      clientId,
      title,
      position: index + 1,
      videoUrl,
      audioUrl,
      audioTranscript,
      contentHtml,
      exerciseGroups,
    };
  });
}

export async function saveAdminModule(formData: FormData) {
  try {
    const account = await getAuthenticatedAdmin();

    const moduleId = Number(formData.get("moduleId"));
    const title =
      typeof formData.get("title") === "string"
        ? String(formData.get("title")).trim()
        : "";
    const position = Number(formData.get("position"));
    const isPublished = formData.get("isPublished") === "on";

    if (!title || !Number.isFinite(position) || position <= 0) {
      redirect("/admin/modules?status=error");
    }

    let submodules: EditorSubmodule[] = [];

    try {
      submodules = parseSubmodules(formData.get("submodulesJson"));
    } catch {
      redirect("/admin/modules?status=error");
    }

    if (submodules.length === 0) {
      redirect("/admin/modules?status=error");
    }

    await saveAdminModuleDefinitionDraft(account.id, {
      moduleId: Number.isFinite(moduleId) && moduleId !== 0 ? moduleId : undefined,
      title,
      position,
      isPublished,
      submodules,
    }, { expectedModuleUpdatedAt: String(formData.get("expectedModuleUpdatedAt") ?? "") });

    revalidatePath("/admin/modules");
    revalidatePath("/admin/releases");
    redirect("/admin/modules?status=saved");
  } catch (error) {
    unstable_rethrow(error);
    redirect(`/admin/modules?${new URLSearchParams({ status: "error", message: error instanceof Error ? error.message : "Sauvegarde impossible." })}`);
  }
}

export async function saveAdminModuleDraft(formData: FormData) {
  try {
    const account = await getAuthenticatedAdmin();

    const moduleId = Number(formData.get("moduleId"));
    const title =
      typeof formData.get("title") === "string"
        ? String(formData.get("title")).trim()
        : "";
    const position = Number(formData.get("position"));
    const isPublished = formData.get("isPublished") === "on";

    if (!title || !Number.isFinite(position) || position <= 0) {
      return {
        status: "error",
        message: "Le titre et la position du module sont obligatoires.",
      };
    }

    let submodules: EditorSubmodule[] = [];

    try {
      submodules = parseSubmodules(formData.get("submodulesJson"));
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Le contenu du module n'est pas valide.",
      };
    }

    if (submodules.length === 0) {
      return {
        status: "error",
        message: "Ajoute au moins un sous-module avant d'enregistrer.",
      };
    }

    const savedModule = await saveAdminModuleDefinitionDraft(account.id, {
      moduleId: Number.isFinite(moduleId) && moduleId !== 0 ? moduleId : undefined,
      title,
      position,
      isPublished,
      submodules,
    }, {
      preserveOmittedContent: formData.get("saveMode") !== "manual",
      expectedModuleUpdatedAt: String(formData.get("expectedModuleUpdatedAt") ?? ""),
    });

    revalidatePath("/admin/modules");
    revalidatePath("/admin/releases");

    return {
      status: "success",
      message: "Brouillon enregistré. Les utilisateurs conservent la version publiée.",
      updatedAt: savedModule.editorRevision ?? savedModule.updated_at,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer le module.",
    };
  }
}

export async function createAdminVoiceNoteUpload() {
  try {
    await getAuthenticatedAdmin();
    const uploadTarget = await createAdminVoiceNoteUploadTarget();

    return {
      status: "success",
      message: "Pret pour l'import.",
      ...uploadTarget,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "La note vocale n'a pas pu etre preparee.",
      path: "",
      token: "",
      signedUrl: "",
      publicUrl: "",
    };
  }
}

export async function persistAdminVoiceNoteUrl(formData: FormData) {
  try {
    const account = await getAuthenticatedAdmin();
    const url =
      typeof formData.get("audioUrl") === "string"
        ? String(formData.get("audioUrl")).trim()
        : "";

    if (!url) {
      return {
        status: "error",
        message: "La note vocale n'a pas pu etre sauvegardee.",
        url: "",
      };
    }

    const moduleId = Number(formData.get("moduleId"));
    const modulePosition = Number(formData.get("modulePosition"));
    const target = String(formData.get("target") ?? "");
    const submoduleId = Number(formData.get("submoduleId"));
    const submodulePosition = Number(formData.get("submodulePosition"));
    const exerciseId = Number(formData.get("exerciseId"));
    const isSubmoduleTarget =
      target === "submodule" &&
      (Number.isFinite(submoduleId) || Number.isFinite(submodulePosition));
    const isQuestionTarget = target === "question" && Number.isFinite(exerciseId);

    if (Number.isFinite(moduleId) && moduleId > 0 && (isSubmoduleTarget || isQuestionTarget)) {
      await saveAdminVoiceNoteToDraft({
        accountId: account.id,
        moduleId,
        modulePosition: Number.isFinite(modulePosition) ? modulePosition : undefined,
        target: isSubmoduleTarget ? "submodule" : "question",
        targetId: isSubmoduleTarget ? submoduleId : exerciseId,
        targetPosition:
          isSubmoduleTarget && Number.isFinite(submodulePosition)
            ? submodulePosition
            : undefined,
        audioUrl: url,
      });
    }

    revalidatePath("/admin/modules");
    revalidatePath("/admin/releases");

    return {
      status: "success",
      message: "Note vocale importee.",
      url,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "La note vocale n'a pas pu etre importee.",
      url: "",
    };
  }
}

export async function saveAdminSubmoduleContent(formData: FormData) {
  void formData;
  try {
    await getAuthenticatedAdmin();
    revalidatePath("/admin/modules");
    revalidatePath("/admin/releases");

    return {
      status: "success",
      message: "Le brouillon admin sera enregistre avec le module.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Le contenu n'a pas pu etre sauvegarde automatiquement.",
    };
  }
}

export async function deleteAdminModule(formData: FormData) {
  try {
    const account = await getAuthenticatedAdmin();

    const moduleId = Number(formData.get("moduleId"));

    if (!Number.isFinite(moduleId) || moduleId === 0) {
      redirect("/admin/modules?status=error");
    }

    await deleteAdminModuleDefinitionDraft(account.id, moduleId);
    revalidatePath("/admin/modules");
    revalidatePath("/admin/releases");
    redirect("/admin/modules?status=deleted");
  } catch (error) {
    unstable_rethrow(error);
    redirect(`/admin/modules?${new URLSearchParams({ status: "error", message: error instanceof Error ? error.message : "Suppression impossible." })}`);
  }
}

export type AdminDeploymentState = {
  status: "idle" | "success" | "error";
  message: string;
  completedAt?: string;
};

export async function publishAdminDraftToAllUsers(
  _previousState: AdminDeploymentState,
): Promise<AdminDeploymentState> {
  void _previousState;
  try {
    await getAuthenticatedAdmin();
    await publishSavedAdminChanges();
    revalidateTrainingExperience();
    revalidatePath("/admin/releases");
    return { status: "success", message: "La nouvelle version officielle est publiée.", completedAt: new Date().toISOString() };
  } catch (error) {
    unstable_rethrow(error);
    return { status: "error", message: error instanceof Error ? error.message : "Publication impossible." };
  }
}

export async function scheduleAdminDraftDeployment(_formData: FormData) {
  void _formData;
  await getAuthenticatedAdmin();
  redirect("/admin/releases");
}

export async function cancelAdminDraftDeployment() {
  await getAuthenticatedAdmin();
  redirect("/admin/releases");
}
