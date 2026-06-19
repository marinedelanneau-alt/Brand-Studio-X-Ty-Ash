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
  deleteModuleDefinition,
  saveModuleDefinition,
  uploadAdminVoiceNote,
} from "@/lib/training";
import { getAuthenticatedAdmin } from "@/lib/session";

type EditorExercise = {
  clientId: string;
  type: ExerciseType;
  explanation: string;
  answerPlaceholder: string;
  audioUrl: string;
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
  contentHtml: string;
  exerciseGroups: EditorExerciseGroup[];
};

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
    ) {
      return null;
    }

    const normalizedOptions = options;
    if (!question) {
      return null;
    }

    if (type === "fill_blank") {
      if (getFillBlankCount(question) === 0) {
        return null;
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
      ) {
        return null;
      }
    }

    return {
      clientId,
      type,
      explanation,
      answerPlaceholder,
      audioUrl,
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
      contentHtml,
      exerciseGroups,
    };
  });
}

function getUploadedFile(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

async function attachUploadedVoiceNotes(
  formData: FormData,
  submodules: EditorSubmodule[],
) {
  for (const submodule of submodules) {
    const submoduleFile = getUploadedFile(
      formData,
      `submoduleAudioFile-${submodule.clientId}`,
    );

    if (submoduleFile) {
      submodule.audioUrl = await uploadAdminVoiceNote(submoduleFile);
    }

    for (const exerciseGroup of submodule.exerciseGroups) {
      for (const question of exerciseGroup.questions) {
        const questionFile = getUploadedFile(
          formData,
          `questionAudioFile-${question.clientId}`,
        );

        if (questionFile) {
          question.audioUrl = await uploadAdminVoiceNote(questionFile);
        }
      }
    }
  }
}

export async function saveAdminModule(formData: FormData) {
  try {
    await getAuthenticatedAdmin();

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

    try {
      await attachUploadedVoiceNotes(formData, submodules);
    } catch {
      redirect("/admin/modules?status=error");
    }

    await saveModuleDefinition({
      moduleId: Number.isFinite(moduleId) && moduleId > 0 ? moduleId : undefined,
      title,
      position,
      isPublished,
      submodules,
    });

    revalidatePath("/admin/modules");
    revalidatePath("/mon-espace");
    redirect("/admin/modules?status=saved");
  } catch (error) {
    unstable_rethrow(error);
    redirect("/admin/modules?status=error");
  }
}

export async function deleteAdminModule(formData: FormData) {
  try {
    await getAuthenticatedAdmin();

    const moduleId = Number(formData.get("moduleId"));

    if (!Number.isFinite(moduleId) || moduleId <= 0) {
      redirect("/admin/modules?status=error");
    }

    await deleteModuleDefinition(moduleId);
    revalidatePath("/admin/modules");
    revalidatePath("/mon-espace");
    redirect("/admin/modules?status=deleted");
  } catch (error) {
    unstable_rethrow(error);
    redirect("/admin/modules?status=error");
  }
}
