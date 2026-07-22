"use server";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { getAuthenticatedAccount } from "@/lib/session";
import {
  getWorkspaceData,
  uploadProjectExerciseImage,
} from "@/lib/training";
import {
  parseStoredImageUploadConfig,
  parseStoredMoodboardConfig,
} from "@/lib/exercise-types";
import { getMoodboardImageCount, parseStoredMoodboardAnswer } from "@/lib/moodboard";

type UploadExerciseImagesResult =
  | {
      status: "success";
      urls: string[];
    }
  | {
      status: "error";
      message: string;
    };

const MAX_IMAGE_FILE_SIZE = 8 * 1024 * 1024;
const MAX_DATA_URL_SIZE = 1.4 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isImageUploadValue(value: string) {
  const trimmedValue = value.trim();

  return (
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://") ||
    trimmedValue.startsWith("/") ||
    trimmedValue.startsWith("data:image/")
  );
}

async function fileToDataUrl(file: File) {
  if (file.size > MAX_DATA_URL_SIZE) {
    throw new Error(
      "L'image reste trop lourde après optimisation. Essaie une image plus légère.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
}

export async function uploadExerciseImages(
  formData: FormData,
): Promise<UploadExerciseImagesResult> {
  try {
    const account = await getAuthenticatedAccount();
    const moduleId = Number(formData.get("moduleId"));
    const exerciseId = Number(formData.get("exerciseId"));
    const currentCount = Math.max(Number(formData.get("currentCount")) || 0, 0);
    const isPictogram = formData.get("assetKind") === "pictogram";
    const files = formData
      .getAll("images")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (!Number.isFinite(moduleId) || !Number.isFinite(exerciseId)) {
      return {
        status: "error",
        message: "Exercice introuvable.",
      };
    }

    if (files.length === 0) {
      return {
        status: "error",
        message: "Ajoutez au moins une image.",
      };
    }

    if (files.some((file) => !ACCEPTED_IMAGE_TYPES.has(file.type))) {
      return {
        status: "error",
        message: "Cette image n’a pas pu être ajoutée. Vérifie son format ou son poids.",
      };
    }

    if (isPictogram && files.some((file) => file.type !== "image/png")) {
      return {
        status: "error",
        message: "Le pictogramme doit être un fichier PNG.",
      };
    }

    if (files.some((file) => file.size > MAX_IMAGE_FILE_SIZE)) {
      return {
        status: "error",
        message:
          "Cette image n’a pas pu être ajoutée. Vérifie son format ou son poids.",
      };
    }

    const workspace = await getWorkspaceData(account.id);

    if (!workspace.project) {
      return {
        status: "error",
        message: "Crée d'abord ton projet de marque.",
      };
    }

    const targetModule = workspace.modules.find((item) => item.id === moduleId);
    const exercise = targetModule?.exercises.find((item) => item.id === exerciseId);

    if (!targetModule || !exercise || (exercise.type !== "image_upload" && exercise.type !== "moodboard")) {
      return {
        status: "error",
        message: "Cet exercice n'est pas disponible.",
      };
    }

    const config =
      exercise.type === "moodboard"
        ? parseStoredMoodboardConfig(exercise.options)
        : parseStoredImageUploadConfig(exercise.options);
    const persistedCount =
      exercise.type === "image_upload"
        ? (targetModule.answers[exercise.id] ?? []).filter(isImageUploadValue).length
        : getMoodboardImageCount(
            parseStoredMoodboardAnswer(targetModule.answers[exercise.id] ?? []),
          );
    const remainingSlots = isPictogram
      ? 1
      : Math.max(config.maxImages - Math.max(currentCount, persistedCount), 0);

    if (remainingSlots <= 0) {
      return {
        status: "error",
        message: `La limite de ${config.maxImages} image${config.maxImages > 1 ? "s" : ""} est déjà atteinte.`,
      };
    }

    if (files.length > remainingSlots) {
      return {
        status: "error",
        message: `Tu peux encore ajouter ${remainingSlots} image${remainingSlots > 1 ? "s" : ""}.`,
      };
    }

    const urls = await Promise.all(
      files.map(async (file) => {
        try {
          return await uploadProjectExerciseImage({
            projectId: workspace.project!.id,
            exerciseId,
            file,
          });
        } catch {
          return fileToDataUrl(file);
        }
      }),
    );

    return {
      status: "success",
      urls,
    };
  } catch (error) {
    return {
      status: "error",
      message: getUserFacingDataErrorMessage(error),
    };
  }
}
