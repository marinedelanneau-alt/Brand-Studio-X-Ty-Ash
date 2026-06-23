import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBrandPersonaFields, parseStoredBrandPersonaConfig } from "@/lib/brand-persona";
import { groupExercisesByGroupId } from "@/lib/exercise-groups";
import { getCompletedModuleIdsFromCookie } from "@/lib/module-completion-fallback";
import type {
  AdminAccountSummary,
  AdminOverview,
  BrandModule,
  BrandProject,
  BrandSubmodule,
  ModuleExercise,
  ModuleExerciseGroup,
  ModuleProgress,
  WorkspaceModule,
} from "@/lib/training-types";
import {
  appendExerciseGroupIdOption,
  appendExplanationOption,
  appendAnswerPlaceholderOption,
  appendAnswerPlaceholderToQuestion,
  getEditorExerciseQuestion,
  getFillBlankCount,
  getStoredExerciseGroupId,
  getStoredExplanation,
  getPersistedExerciseType,
  getStoredAnswerPlaceholderFromQuestion,
  getStoredAnswerPlaceholder,
  getTableCellCount,
  isAnswerableExerciseType,
  parseIndexedAnswerItems,
  serializeIndexedAnswerItem,
  parseStoredExerciseQuestionConfig,
  parseStoredTableConfig,
  resolveStoredExerciseOptions,
  resolveExerciseType,
  type ExerciseType,
} from "@/lib/exercise-types";
import {
  parseStoredSpectrumAnswer,
  parseStoredSpectrumConfig,
} from "@/lib/spectrum";
import {
  isColorPaletteComplete,
  parseStoredColorPaletteAnswer,
  parseStoredColorPaletteConfig,
} from "@/lib/color-palette";
import { isEditorialCalendarComplete } from "@/lib/editorial-calendar";
import {
  getSerializedSmartFeedbackOption,
  parseStoredSmartFeedbackConfig,
  type SmartFeedbackConfig,
} from "@/lib/smart-feedback";

type ProjectExerciseAnswerRecord = {
  id: number;
  project_id: number;
  module_id: number;
  exercise_id: number;
  answer_text: string | null;
  selected_options: unknown;
};

type ProjectModuleStateRecord = {
  id: number;
  project_id: number;
  module_id: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type {
  AdminAccountSummary,
  AdminOverview,
  BrandModule,
  BrandProject,
  BrandSubmodule,
  ModuleExercise,
  ModuleExerciseGroup,
  ModuleProgress,
  WorkspaceModule,
};

function isMissingDatabaseObject(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("could not find the column") ||
    message.includes("schema cache")
  );
}

function normalizeOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

const AUDIO_URL_OPTION_PREFIX = "__audio_url__:";
const AUDIO_TRANSCRIPT_OPTION_PREFIX = "__audio_transcript__:";
const AUDIO_URL_HTML_MARKER_PREFIX = "<!-- brand-studio-audio-url:";
const AUDIO_URL_HTML_MARKER_SUFFIX = " -->";
const AUDIO_TRANSCRIPT_HTML_MARKER_PREFIX = "<!-- brand-studio-audio-transcript:";
const AUDIO_TRANSCRIPT_HTML_MARKER_SUFFIX = " -->";
const AUDIO_URL_HTML_MARKER_PATTERN =
  /<!--\s*brand-studio-audio-url:([^]*?)\s*-->/;
const ALL_AUDIO_URL_HTML_MARKERS_PATTERN =
  /<!--\s*brand-studio-audio-url:[^]*?\s*-->/g;
const AUDIO_TRANSCRIPT_HTML_MARKER_PATTERN =
  /<!--\s*brand-studio-audio-transcript:([^]*?)\s*-->/;
const ALL_AUDIO_TRANSCRIPT_HTML_MARKERS_PATTERN =
  /<!--\s*brand-studio-audio-transcript:[^]*?\s*-->/g;

function getStoredAudioUrl(options: string[]) {
  const marker = options.find((option) => option.startsWith(AUDIO_URL_OPTION_PREFIX));
  return marker?.slice(AUDIO_URL_OPTION_PREFIX.length).trim() || "";
}

function removeStoredAudioUrlOptions(options: string[]) {
  return options.filter((option) => !option.startsWith(AUDIO_URL_OPTION_PREFIX));
}

function getStoredAudioTranscript(options: string[]) {
  const marker = options.find((option) =>
    option.startsWith(AUDIO_TRANSCRIPT_OPTION_PREFIX),
  );
  return marker?.slice(AUDIO_TRANSCRIPT_OPTION_PREFIX.length).trim() || "";
}

function removeStoredAudioTranscriptOptions(options: string[]) {
  return options.filter(
    (option) => !option.startsWith(AUDIO_TRANSCRIPT_OPTION_PREFIX),
  );
}

function appendAudioUrlOption(options: string[], audioUrl: string) {
  const cleanOptions = removeStoredAudioUrlOptions(options);
  const trimmedAudioUrl = audioUrl.trim();

  return trimmedAudioUrl
    ? [...cleanOptions, `${AUDIO_URL_OPTION_PREFIX}${trimmedAudioUrl}`]
    : cleanOptions;
}

function appendAudioTranscriptOption(options: string[], audioTranscript: string) {
  const cleanOptions = removeStoredAudioTranscriptOptions(options);
  const trimmedAudioTranscript = audioTranscript.trim();

  return trimmedAudioTranscript
    ? [...cleanOptions, `${AUDIO_TRANSCRIPT_OPTION_PREFIX}${trimmedAudioTranscript}`]
    : cleanOptions;
}

function decodeStoredMarkerValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getStoredAudioUrlFromHtml(contentHtml: string) {
  const match = contentHtml.match(AUDIO_URL_HTML_MARKER_PATTERN);
  const encodedAudioUrl = match?.[1]?.trim();

  if (!encodedAudioUrl) {
    return "";
  }

  return decodeStoredMarkerValue(encodedAudioUrl);
}

function getStoredAudioTranscriptFromHtml(contentHtml: string) {
  const match = contentHtml.match(AUDIO_TRANSCRIPT_HTML_MARKER_PATTERN);
  const encodedAudioTranscript = match?.[1]?.trim();

  if (!encodedAudioTranscript) {
    return "";
  }

  return decodeStoredMarkerValue(encodedAudioTranscript);
}

function stripStoredAudioUrlFromHtml(contentHtml: string) {
  return contentHtml.replace(ALL_AUDIO_URL_HTML_MARKERS_PATTERN, "").trim();
}

function stripStoredAudioTranscriptFromHtml(contentHtml: string) {
  return contentHtml
    .replace(ALL_AUDIO_TRANSCRIPT_HTML_MARKERS_PATTERN, "")
    .trim();
}

function stripStoredAudioMetadataFromHtml(contentHtml: string) {
  return stripStoredAudioTranscriptFromHtml(stripStoredAudioUrlFromHtml(contentHtml));
}

function appendAudioMetadataToHtml(
  contentHtml: string,
  audioUrl: string,
  audioTranscript = "",
) {
  const cleanContentHtml = stripStoredAudioMetadataFromHtml(contentHtml);
  const trimmedAudioUrl = audioUrl.trim();
  const trimmedAudioTranscript = audioTranscript.trim();
  const markers = [
    trimmedAudioUrl
      ? `${AUDIO_URL_HTML_MARKER_PREFIX}${encodeURIComponent(trimmedAudioUrl)}${AUDIO_URL_HTML_MARKER_SUFFIX}`
      : "",
    trimmedAudioTranscript
      ? `${AUDIO_TRANSCRIPT_HTML_MARKER_PREFIX}${encodeURIComponent(trimmedAudioTranscript)}${AUDIO_TRANSCRIPT_HTML_MARKER_SUFFIX}`
      : "",
  ].join("");

  if (!markers) {
    return cleanContentHtml;
  }

  return `${markers}${cleanContentHtml}`;
}

function appendAudioUrlToHtml(contentHtml: string, audioUrl: string) {
  return appendAudioMetadataToHtml(
    contentHtml,
    audioUrl,
    getStoredAudioTranscriptFromHtml(contentHtml),
  );
}

export function groupModuleExercises(exercises: ModuleExercise[]) {
  return groupExercisesByGroupId(exercises) as ModuleExerciseGroup[];
}

function computeModuleAnswerMap(
  exercises: ModuleExercise[],
  answers: ProjectExerciseAnswerRecord[],
) {
  const answerByExercise = new Map<number, string[]>();
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  function sanitizeLoadedAnswers(
    exercise: ModuleExercise | undefined,
    values: string[],
  ) {
    if (!exercise) {
      return values;
    }

    const placeholder = exercise.answer_placeholder.trim();

    if (!placeholder) {
      return values;
    }

    if (exercise.type === "open" || exercise.type === "prompt_open") {
      return values.length === 1 && values[0]?.trim() === placeholder ? [] : values;
    }

    if (exercise.type === "fill_blank" || exercise.type === "table") {
      return values.map((value) => (value.trim() === placeholder ? "" : value));
    }

    if (exercise.type === "group_open") {
      const indexedAnswers = parseIndexedAnswerItems(values);

      if (indexedAnswers.length > 0) {
        return indexedAnswers
          .map((item) => ({
            ...item,
            value: item.value.trim() === placeholder ? "" : item.value,
          }))
          .filter((item) => item.value.trim().length > 0)
          .sort((left, right) =>
            left.questionIndex === right.questionIndex
              ? left.valueIndex - right.valueIndex
              : left.questionIndex - right.questionIndex,
          )
          .map((item) =>
            serializeIndexedAnswerItem(item.questionIndex, item.valueIndex, item.value),
          );
      }

      return values.map((value) => (value.trim() === placeholder ? "" : value));
    }

    return values;
  }

  for (const answer of answers) {
    const exercise = exerciseById.get(answer.exercise_id);

    if (answer.answer_text && answer.answer_text.trim()) {
      answerByExercise.set(
        answer.exercise_id,
        sanitizeLoadedAnswers(exercise, [answer.answer_text]),
      );
      continue;
    }

    const selectedOptions = normalizeOptions(answer.selected_options);
    answerByExercise.set(
      answer.exercise_id,
      sanitizeLoadedAnswers(exercise, selectedOptions),
    );
  }

  const exerciseIds = new Set(exercises.map((exercise) => exercise.id));
  const scopedEntries = [...answerByExercise.entries()].filter(([exerciseId]) =>
    exerciseIds.has(exerciseId),
  );

  return Object.fromEntries(scopedEntries);
}

const ALWAYS_UNLOCK_MODULE_KEYWORDS = [
  "positionnement",
  "personnalité",
  "ton de la marque",
];

function isAlwaysUnlockedModule(module: BrandModule) {
  const title = module.title.toLowerCase();
  return ALWAYS_UNLOCK_MODULE_KEYWORDS.some((keyword) => title.includes(keyword));
}

function getModuleProgress(
  module: BrandModule,
  exercises: ModuleExercise[],
  answerMap: Record<number, string[]>,
  unlockedUntilPosition: number,
  hasManualCompletion: boolean,
) {
  const answerableExercises = exercises.filter((exercise) =>
    isAnswerableExerciseType(exercise.type),
  );
  const exerciseCount = answerableExercises.length;
  const answeredCount = answerableExercises.filter((exercise) => {
    const answer = answerMap[exercise.id] ?? [];
    const questionConfig = parseStoredExerciseQuestionConfig(
      exercise.type,
      exercise.options,
    );

    if (questionConfig.items.length > 0) {
      const indexedAnswers = parseIndexedAnswerItems(answer);

      return questionConfig.items.every((item, questionIndex) => {
        const questionValues = indexedAnswers
          .filter((entry) => entry.questionIndex === questionIndex)
          .sort((left, right) => left.valueIndex - right.valueIndex)
          .map((entry) => entry.value);

        if (exercise.type === "fill_blank") {
          const expectedCount = getFillBlankCount(item);
          return (
            questionValues.length === expectedCount &&
            questionValues.every((value) => value.trim().length > 0)
          );
        }

        if (exercise.type === "table") {
          const expectedCount = getTableCellCount(
            parseStoredTableConfig(exercise.options),
          );
          return (
            questionValues.length === expectedCount &&
            questionValues.every((value) => value.trim().length > 0)
          );
        }

        return questionValues.some((value) => value.trim().length > 0);
      });
    }

    if (exercise.type === "fill_blank") {
      const expectedCount = getFillBlankCount(exercise.question);
      return (
        answer.length === expectedCount &&
        answer.every((item) => item.trim().length > 0)
      );
    }

    if (exercise.type === "group_open") {
      return (
        answer.length === exercise.options.length &&
        answer.every((item) => item.trim().length > 0)
      );
    }

    if (exercise.type === "brand_persona") {
      const config = parseStoredBrandPersonaConfig(exercise.options);
      const fields = getBrandPersonaFields(config);
      const requiredFields = fields.filter((field) => field.required);
      const indexedAnswers = parseIndexedAnswerItems(answer);

      if (requiredFields.length === 0) {
        return indexedAnswers.length > 0;
      }

      return requiredFields.every((field) =>
        indexedAnswers
          .filter((entry) => entry.questionIndex === fields.findIndex((item) => item.id === field.id))
          .some((entry) => entry.value.trim().length > 0),
      );
    }

    if (exercise.type === "spectrum") {
      const config = parseStoredSpectrumConfig(exercise.options);
      const parsedAnswer = parseStoredSpectrumAnswer(answerMap[exercise.id] ?? []);

      if (!parsedAnswer) {
        return false;
      }

      if (config.enableJustification && config.requireJustification) {
        return parsedAnswer.justification.trim().length > 0;
      }

      return true;
    }

    if (exercise.type === "color_palette") {
      return isColorPaletteComplete(
        parseStoredColorPaletteAnswer(answerMap[exercise.id] ?? []),
        parseStoredColorPaletteConfig(exercise.options),
      );
    }

    if (exercise.type === "editorial_calendar") {
      return isEditorialCalendarComplete(answerMap[exercise.id] ?? []);
    }

    if (exercise.type === "table") {
      const expectedCount = getTableCellCount(
        parseStoredTableConfig(exercise.options),
      );
      return (
        answer.length === expectedCount &&
        answer.every((item) => item.trim().length > 0)
      );
    }

    return answer.some((item) => item.trim().length > 0);
  }).length;
  const isCompleted =
    hasManualCompletion || (exerciseCount > 0 && answeredCount === exerciseCount);

  const isUnlocked = true;

  const completionPercent =
    exerciseCount === 0 ? 0 : Math.round((answeredCount / exerciseCount) * 100);

  return {
    answeredCount,
    exerciseCount,
    isCompleted,
    isUnlocked,
    completionPercent,
  };
}

export async function getProjectByAccountId(accountId: number) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brand_projects")
    .select("*")
    .eq("account_id", accountId)
    .maybeSingle<BrandProject>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createProjectForAccount(
  accountId: number,
  name: string,
  logoUrl?: string,
) {
  const supabase = createSupabaseServerClient();
  const existingProject = await getProjectByAccountId(accountId);

  if (existingProject) {
    return existingProject;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("brand_projects")
    .insert({
      account_id: accountId,
      name,
      logo_url: logoUrl ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single<BrandProject>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function uploadProjectLogo(input: {
  accountId: number;
  file: File;
}) {
  const supabase = createSupabaseServerClient();
  const extension = input.file.name.includes(".")
    ? input.file.name.split(".").pop()?.toLowerCase() || "png"
    : "png";
  const filePath = `projects/${input.accountId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const arrayBuffer = await input.file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("project-assets")
    .upload(filePath, arrayBuffer, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("project-assets").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadProjectExerciseImage(input: {
  projectId: number;
  exerciseId: number;
  file: File;
}) {
  const supabase = createSupabaseServerClient();
  const extension = input.file.name.includes(".")
    ? input.file.name.split(".").pop()?.toLowerCase() || "png"
    : "png";
  const filePath = `exercise-images/${input.projectId}/${input.exerciseId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const arrayBuffer = await input.file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("project-assets")
    .upload(filePath, arrayBuffer, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("project-assets").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadAdminVoiceNote(file: File) {
  const isMp3 =
    file.type === "audio/mpeg" ||
    file.type === "audio/mp3" ||
    file.name.toLowerCase().endsWith(".mp3");

  if (!isMp3) {
    throw new Error("Le fichier de note vocale doit etre au format MP3.");
  }

  const maxSize = 24 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("La note vocale MP3 doit peser moins de 24 Mo.");
  }

  const supabase = createSupabaseServerClient();
  const filePath = `admin-voice-notes/${Date.now()}-${crypto.randomUUID()}.mp3`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("project-assets")
    .upload(filePath, arrayBuffer, {
      contentType: file.type || "audio/mpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("project-assets").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function createAdminVoiceNoteUploadTarget() {
  const supabase = createSupabaseServerClient();
  const filePath = `admin-voice-notes/${Date.now()}-${crypto.randomUUID()}.mp3`;

  const { data, error } = await supabase.storage
    .from("project-assets")
    .createSignedUploadUrl(filePath, { upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  const publicUrlData = supabase.storage
    .from("project-assets")
    .getPublicUrl(filePath);

  return {
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: publicUrlData.data.publicUrl,
  };
}

export async function persistSubmoduleVoiceNote(input: {
  moduleId: number;
  submoduleId: number;
  audioUrl: string;
}) {
  const audioUrl = input.audioUrl.trim();

  if (
    !audioUrl ||
    !Number.isFinite(input.moduleId) ||
    input.moduleId <= 0 ||
    !Number.isFinite(input.submoduleId)
  ) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();
  const supportsAudioOnModules = await supportsModuleAudio(supabase);
  const supportsAudioOnSubmodules = await supportsSubmoduleAudio(supabase);

  if (Number.isFinite(input.submoduleId) && input.submoduleId > 0) {
    const { data: submodule, error: submoduleError } = await supabase
      .from("brand_submodules")
      .select("content_html")
      .eq("id", input.submoduleId)
      .maybeSingle<{ content_html: string }>();

    if (submoduleError) {
      throw new Error(submoduleError.message);
    }

    if (submodule) {
      const updatePayload = {
        content_html: appendAudioUrlToHtml(submodule.content_html, audioUrl),
        updated_at: now,
        ...(supportsAudioOnSubmodules ? { audio_url: audioUrl } : {}),
      };
      const { error } = await supabase
        .from("brand_submodules")
        .update(updatePayload)
        .eq("id", input.submoduleId);

      if (error) {
        throw new Error(error.message);
      }

      return;
    }
  }

  const { data: module, error: moduleError } = await supabase
    .from("brand_modules")
    .select("content_html")
    .eq("id", input.moduleId)
    .maybeSingle<{ content_html: string }>();

  if (moduleError) {
    throw new Error(moduleError.message);
  }

  if (!module) {
    return;
  }

  const updatePayload = {
    content_html: appendAudioUrlToHtml(module.content_html, audioUrl),
    updated_at: now,
    ...(supportsAudioOnModules ? { audio_url: audioUrl } : {}),
  };
  const { error } = await supabase
    .from("brand_modules")
    .update(updatePayload)
    .eq("id", input.moduleId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function persistExerciseVoiceNote(input: {
  exerciseId: number;
  audioUrl: string;
}) {
  const audioUrl = input.audioUrl.trim();

  if (!audioUrl || !Number.isFinite(input.exerciseId) || input.exerciseId <= 0) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const supportsAudioOnExercises = await supportsExerciseAudio(supabase);
  const { data: exercise, error: exerciseError } = await supabase
    .from("module_exercises")
    .select("options")
    .eq("id", input.exerciseId)
    .maybeSingle<{ options: unknown }>();

  if (exerciseError) {
    throw new Error(exerciseError.message);
  }

  if (!exercise) {
    return;
  }

  const updatePayload = {
    options: appendAudioUrlOption(normalizeOptions(exercise.options), audioUrl),
    ...(supportsAudioOnExercises ? { audio_url: audioUrl } : {}),
  };
  const { error } = await supabase
    .from("module_exercises")
    .update(updatePayload)
    .eq("id", input.exerciseId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateProjectLogoForAccount(input: {
  accountId: number;
  logoUrl: string;
}) {
  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("brand_projects")
    .update({
      logo_url: input.logoUrl,
      updated_at: now,
    })
    .eq("account_id", input.accountId)
    .select("*")
    .maybeSingle<BrandProject>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getModulesWithExercises({
  includeUnpublished = false,
  includeInactiveBrandPersona = false,
}: {
  includeUnpublished?: boolean;
  includeInactiveBrandPersona?: boolean;
} = {}) {
  const supabase = createSupabaseServerClient();
  let modulesQuery = supabase
    .from("brand_modules")
    .select("*")
    .order("position", { ascending: true });

  if (!includeUnpublished) {
    modulesQuery = modulesQuery.eq("is_published", true);
  }

  const [{ data: modules, error: modulesError }, submodulesResult, exercisesResult] =
    await Promise.all([
    modulesQuery.returns<BrandModule[]>(),
    supabase
      .from("brand_submodules")
      .select("*")
      .order("position", { ascending: true })
      .returns<BrandSubmodule[]>(),
    supabase
      .from("module_exercises")
      .select("*")
      .order("position", { ascending: true })
      .returns<
        Array<
          Omit<ModuleExercise, "options"> & {
            options: unknown;
          }
        >
      >(),
    ]);

  let submodules = submodulesResult.data;
  let submodulesError = submodulesResult.error;
  let exercises = exercisesResult.data;
  let exercisesError = exercisesResult.error;

  if (modulesError) {
    throw new Error(modulesError.message);
  }

  const shouldFallbackToLegacySubmodules =
    isMissingDatabaseObject(submodulesError) || isMissingDatabaseObject(exercisesError);

  if (shouldFallbackToLegacySubmodules) {
    submodules = [];
    submodulesError = null;
    const legacyExercisesResult = await supabase
      .from("module_exercises")
      .select("id,module_id,position,type,question,options")
      .order("position", { ascending: true })
      .returns<
        Array<
          Omit<
            ModuleExercise,
            "options" | "submodule_id" | "audio_url" | "audio_transcript"
          > & {
            options: unknown;
          }
        >
      >();

    exercises = (legacyExercisesResult.data ?? []).map((exercise) => ({
      ...exercise,
      audio_url: null,
      audio_transcript: null,
      submodule_id: null,
    }));
    exercisesError = legacyExercisesResult.error;
  }

  if (submodulesError) {
    throw new Error(submodulesError.message);
  }

  if (exercisesError) {
    throw new Error(exercisesError.message);
  }

  const submoduleMap = new Map<number, BrandSubmodule[]>();
  const exerciseMap = new Map<number, ModuleExercise[]>();

  for (const submodule of submodules ?? []) {
    const bucket = submoduleMap.get(submodule.module_id) ?? [];
    bucket.push(submodule);
    submoduleMap.set(submodule.module_id, bucket);
  }

  for (const exercise of exercises ?? []) {
    const bucket = exerciseMap.get(exercise.module_id) ?? [];
    const normalizedExerciseOptions = normalizeOptions(exercise.options);
    const storedAudioUrl = getStoredAudioUrl(normalizedExerciseOptions);
    const storedAudioTranscript = getStoredAudioTranscript(normalizedExerciseOptions);
    const exerciseOptionsWithoutAudio = removeStoredAudioTranscriptOptions(
      removeStoredAudioUrlOptions(normalizedExerciseOptions),
    );
    const resolvedType = resolveExerciseType(
      exercise.type,
      exercise.question,
      exerciseOptionsWithoutAudio,
    );
    const resolvedOptions = resolveStoredExerciseOptions(
      resolvedType,
      exerciseOptionsWithoutAudio,
    );

    if (
      resolvedType === "brand_persona" &&
      !includeInactiveBrandPersona &&
      !parseStoredBrandPersonaConfig(resolvedOptions).isActive
    ) {
      exerciseMap.set(exercise.module_id, bucket);
      continue;
    }

    bucket.push({
      ...exercise,
      exercise_group_id: getStoredExerciseGroupId(exerciseOptionsWithoutAudio) || null,
      feedback_config: parseStoredSmartFeedbackConfig(exerciseOptionsWithoutAudio),
      type: resolvedType,
      explanation:
        "explanation" in exercise && typeof exercise.explanation === "string"
          ? exercise.explanation
          : getStoredExplanation(exerciseOptionsWithoutAudio),
      answer_placeholder:
        "answer_placeholder" in exercise &&
        typeof exercise.answer_placeholder === "string" &&
        exercise.answer_placeholder.trim().length > 0
          ? exercise.answer_placeholder
          : getStoredAnswerPlaceholder(exerciseOptionsWithoutAudio) ||
            getStoredAnswerPlaceholderFromQuestion(exercise.question),
      audio_url:
        "audio_url" in exercise &&
        typeof exercise.audio_url === "string" &&
        exercise.audio_url.trim().length > 0
          ? exercise.audio_url
          : storedAudioUrl || null,
      audio_transcript:
        "audio_transcript" in exercise &&
        typeof exercise.audio_transcript === "string" &&
        exercise.audio_transcript.trim().length > 0
          ? exercise.audio_transcript
          : storedAudioTranscript || null,
      question: getEditorExerciseQuestion(resolvedType, exercise.question),
      options: resolvedOptions,
    });
    exerciseMap.set(exercise.module_id, bucket);
  }

  return (modules ?? []).map((module) => ({
    ...module,
    exercises: exerciseMap.get(module.id) ?? [],
    submodules: buildModuleSubmodules(
      module,
      submoduleMap.get(module.id) ?? [],
      exerciseMap.get(module.id) ?? [],
    ),
  }));
}

export async function getWorkspaceData(accountId: number) {
  const project = await getProjectByAccountId(accountId);
  const modules = await getModulesWithExercises();

  if (!project) {
    return {
      project: null,
      modules: [] as WorkspaceModule[],
      progressPercent: 0,
      completedModulesCount: 0,
      totalModulesCount: modules.length,
    };
  }

  const supabase = createSupabaseServerClient();
  const completedModuleIdsFromCookie = new Set(
    await getCompletedModuleIdsFromCookie(project.id),
  );
  const [answersResult, moduleStatesResult] = await Promise.all([
    supabase
      .from("project_exercise_answers")
      .select("*")
      .eq("project_id", project.id)
      .returns<ProjectExerciseAnswerRecord[]>(),
    supabase
      .from("project_module_states")
      .select("*")
      .eq("project_id", project.id)
      .returns<ProjectModuleStateRecord[]>(),
  ]);

  if (answersResult.error) {
    throw new Error(answersResult.error.message);
  }

  if (
    moduleStatesResult.error &&
    !isMissingDatabaseObject(moduleStatesResult.error)
  ) {
    throw new Error(moduleStatesResult.error.message);
  }

  const answers = answersResult.data ?? [];
  const moduleStates = isMissingDatabaseObject(moduleStatesResult.error)
    ? []
    : (moduleStatesResult.data ?? []);

  const groupedAnswers = new Map<number, ProjectExerciseAnswerRecord[]>();

  for (const answer of answers) {
    const bucket = groupedAnswers.get(answer.module_id) ?? [];
    bucket.push(answer);
    groupedAnswers.set(answer.module_id, bucket);
  }

  const completionStateByModuleId = new Map(
    moduleStates.map((state) => [state.module_id, state.is_completed]),
  );

  const draftModules = modules.map((module) => {
    const moduleAnswers = groupedAnswers.get(module.id) ?? [];
    const answersMap = computeModuleAnswerMap(module.exercises, moduleAnswers);
    const isCompletedFromDatabase = completionStateByModuleId.get(module.id) ?? false;

    return {
      ...module,
      answers: answersMap,
      isManuallyCompleted:
        isCompletedFromDatabase || completedModuleIdsFromCookie.has(module.id),
    };
  });

  let unlockedUntilPosition = 1;

  for (const currentModule of draftModules) {
    const progress = getModuleProgress(
      currentModule,
      currentModule.exercises,
      currentModule.answers,
      unlockedUntilPosition,
      currentModule.isManuallyCompleted,
    );

    if (progress.isCompleted && currentModule.position >= unlockedUntilPosition) {
      unlockedUntilPosition = currentModule.position + 1;
    }
  }

  const workspaceModules = draftModules.map((module) => ({
    ...module,
    progress: getModuleProgress(
      module,
      module.exercises,
      module.answers,
      unlockedUntilPosition,
      module.isManuallyCompleted,
    ),
  }));

  const totalModulesCount = workspaceModules.length;
  const completedModulesCount = workspaceModules.filter(
    (module) => module.progress.isCompleted,
  ).length;
  const progressPercent =
    totalModulesCount === 0
      ? 0
      : Math.round((completedModulesCount / totalModulesCount) * 100);

  return {
    project,
    modules: workspaceModules,
    progressPercent,
    completedModulesCount,
    totalModulesCount,
  };
}

export async function replaceModuleAnswers(input: {
  projectId: number;
  moduleId: number;
  answers: Array<{
    exerciseId: number;
    answerText: string | null;
    selectedOptions: string[];
  }>;
}) {
  const supabase = createSupabaseServerClient();

  const { error: deleteError } = await supabase
    .from("project_exercise_answers")
    .delete()
    .eq("project_id", input.projectId)
    .eq("module_id", input.moduleId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const now = new Date().toISOString();
  const rows = input.answers
    .filter(
      (answer) =>
        (answer.answerText?.trim().length ?? 0) > 0 || answer.selectedOptions.length > 0,
    )
    .map((answer) => ({
      project_id: input.projectId,
      module_id: input.moduleId,
      exercise_id: answer.exerciseId,
      answer_text: answer.answerText,
      selected_options: answer.selectedOptions,
      created_at: now,
      updated_at: now,
    }));

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("project_exercise_answers")
    .insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function setProjectModuleCompletion(input: {
  projectId: number;
  moduleId: number;
  isCompleted: boolean;
}) {
  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("project_module_states").upsert(
    {
      project_id: input.projectId,
      module_id: input.moduleId,
      is_completed: input.isCompleted,
      completed_at: input.isCompleted ? now : null,
      updated_at: now,
    },
    {
      onConflict: "project_id,module_id",
    },
  );

  if (error) {
    if (isMissingDatabaseObject(error)) {
      return;
    }

    throw new Error(error.message);
  }
}

export async function saveModuleDefinition(input: {
  moduleId?: number;
  title: string;
  position: number;
  isPublished: boolean;
  submodules: Array<{
    title: string;
    position: number;
    videoUrl: string;
    audioUrl: string;
    audioTranscript: string;
    contentHtml: string;
    exerciseGroups: Array<{
      groupId: string;
      questions: Array<{
        type: ExerciseType;
        explanation: string;
        answerPlaceholder: string;
        audioUrl: string;
        audioTranscript: string;
        question: string;
        options: string[];
        feedbackConfig: SmartFeedbackConfig;
      }>;
    }>;
  }>;
}) {
  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();
  const firstSubmodule = input.submodules[0];
  const supportsSubmodules = await supportsSubmoduleStorage(supabase);
  const supportsModuleAudioColumn = await supportsModuleAudio(supabase);
  const supportsModuleAudioTranscriptColumn =
    await supportsModuleAudioTranscript(supabase);
  const supportsSubmoduleAudioColumn =
    supportsSubmodules && (await supportsSubmoduleAudio(supabase));
  const supportsSubmoduleAudioTranscriptColumn =
    supportsSubmodules && (await supportsSubmoduleAudioTranscript(supabase));
  const supportsExerciseExplanationColumn = await supportsExerciseExplanation(supabase);
  const supportsExerciseAnswerPlaceholderColumn =
    await supportsExerciseAnswerPlaceholder(supabase);
  const supportsExerciseAudioColumn = await supportsExerciseAudio(supabase);
  const supportsExerciseAudioTranscriptColumn =
    await supportsExerciseAudioTranscript(supabase);
  const moduleAudioUrl = firstSubmodule?.audioUrl?.trim() || null;
  const moduleAudioTranscript = firstSubmodule?.audioTranscript?.trim() || null;
  const moduleContentHtml = appendAudioMetadataToHtml(
    firstSubmodule?.contentHtml ?? "<p>Ajoutez ici le contenu du sous-module.</p>",
    moduleAudioUrl ?? "",
    moduleAudioTranscript ?? "",
  );

  if (input.moduleId) {
    const moduleUpdate = {
      title: input.title,
      position: input.position,
      video_url: firstSubmodule?.videoUrl?.trim() || "",
      content_html: moduleContentHtml,
      is_published: input.isPublished,
      updated_at: now,
      ...(supportsModuleAudioColumn ? { audio_url: moduleAudioUrl } : {}),
      ...(supportsModuleAudioTranscriptColumn
        ? { audio_transcript: moduleAudioTranscript }
        : {}),
    };
    const { error: updateError } = await supabase
      .from("brand_modules")
      .update(moduleUpdate)
      .eq("id", input.moduleId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (!supportsSubmodules) {
      const { error: deleteExercisesError } = await supabase
        .from("module_exercises")
        .delete()
        .eq("module_id", input.moduleId);

      if (deleteExercisesError) {
        throw new Error(deleteExercisesError.message);
      }

      await insertExercisesLegacy(
        supabase,
        input.moduleId,
        input.submodules,
        supportsExerciseExplanationColumn,
        supportsExerciseAnswerPlaceholderColumn,
        supportsExerciseAudioColumn,
        supportsExerciseAudioTranscriptColumn,
      );
      return;
    }

    const { data: existingSubmodules, error: existingSubmodulesError } = await supabase
      .from("brand_submodules")
      .select("id")
      .eq("module_id", input.moduleId)
      .returns<Array<{ id: number }>>();

    if (existingSubmodulesError) {
      throw new Error(existingSubmodulesError.message);
    }

    if ((existingSubmodules ?? []).length > 0) {
      const existingSubmoduleIds = (existingSubmodules ?? []).map((item) => item.id);
      const { error: deleteSubmoduleExercisesError } = await supabase
        .from("module_exercises")
        .delete()
        .in("submodule_id", existingSubmoduleIds);

      if (deleteSubmoduleExercisesError) {
        throw new Error(deleteSubmoduleExercisesError.message);
      }
    }

    const { error: deleteExercisesError } = await supabase
      .from("module_exercises")
      .delete()
      .eq("module_id", input.moduleId)
      .is("submodule_id", null);

    if (deleteExercisesError) {
      throw new Error(deleteExercisesError.message);
    }

    const { error: deleteSubmodulesError } = await supabase
      .from("brand_submodules")
      .delete()
      .eq("module_id", input.moduleId);

    if (deleteSubmodulesError) {
      throw new Error(deleteSubmodulesError.message);
    }

    await insertSubmodulesAndExercises(
      supabase,
      input.moduleId,
      input.submodules,
      now,
      supportsSubmoduleAudioColumn,
      supportsSubmoduleAudioTranscriptColumn,
      supportsExerciseExplanationColumn,
      supportsExerciseAnswerPlaceholderColumn,
      supportsExerciseAudioColumn,
      supportsExerciseAudioTranscriptColumn,
    );

    if (!firstSubmodule) {
      return;
    }

    return;
  }

  const moduleInsert = {
    title: input.title,
    position: input.position,
    video_url: firstSubmodule?.videoUrl?.trim() || "",
    content_html: moduleContentHtml,
    is_published: input.isPublished,
    created_at: now,
    updated_at: now,
    ...(supportsModuleAudioColumn ? { audio_url: moduleAudioUrl } : {}),
    ...(supportsModuleAudioTranscriptColumn
      ? { audio_transcript: moduleAudioTranscript }
      : {}),
  };
  const { data: moduleData, error: insertModuleError } = await supabase
    .from("brand_modules")
    .insert(moduleInsert)
    .select("id")
    .single<{ id: number }>();

  if (insertModuleError) {
    throw new Error(insertModuleError.message);
  }

  if (input.submodules.length === 0) {
    return;
  }

  if (!supportsSubmodules) {
    await insertExercisesLegacy(
      supabase,
      moduleData.id,
      input.submodules,
      supportsExerciseExplanationColumn,
      supportsExerciseAnswerPlaceholderColumn,
      supportsExerciseAudioColumn,
      supportsExerciseAudioTranscriptColumn,
    );
    return;
  }

  await insertSubmodulesAndExercises(
    supabase,
    moduleData.id,
    input.submodules,
    now,
    supportsSubmoduleAudioColumn,
    supportsSubmoduleAudioTranscriptColumn,
    supportsExerciseExplanationColumn,
    supportsExerciseAnswerPlaceholderColumn,
    supportsExerciseAudioColumn,
    supportsExerciseAudioTranscriptColumn,
  );
}

function buildModuleSubmodules(
  module: BrandModule,
  submodules: BrandSubmodule[],
  exercises: ModuleExercise[],
) {
  if (submodules.length === 0) {
    const moduleAudioUrl =
      module.audio_url ?? (getStoredAudioUrlFromHtml(module.content_html) || null);
    const moduleAudioTranscript =
      module.audio_transcript ??
      (getStoredAudioTranscriptFromHtml(module.content_html) || null);

    return [
      {
        id: -module.id,
        module_id: module.id,
        title: module.title,
        position: 1,
        video_url: module.video_url,
        audio_url: moduleAudioUrl,
        audio_transcript: moduleAudioTranscript,
        content_html: stripStoredAudioMetadataFromHtml(module.content_html),
        created_at: module.created_at,
        updated_at: module.updated_at,
        exercises,
      },
    ];
  }

  return submodules.map((submodule) => {
    const submoduleAudioUrl =
      submodule.audio_url ??
      (getStoredAudioUrlFromHtml(submodule.content_html) || null);
    const submoduleAudioTranscript =
      submodule.audio_transcript ??
      (getStoredAudioTranscriptFromHtml(submodule.content_html) || null);

    return {
      ...submodule,
      audio_url: submoduleAudioUrl,
      audio_transcript: submoduleAudioTranscript,
      content_html: stripStoredAudioMetadataFromHtml(submodule.content_html),
      exercises: exercises.filter((exercise) => exercise.submodule_id === submodule.id),
    };
  });
}

async function insertSubmodulesAndExercises(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  moduleId: number,
  submodules: Array<{
    title: string;
    position: number;
    videoUrl: string;
    audioUrl: string;
    audioTranscript: string;
    contentHtml: string;
    exerciseGroups: Array<{
      groupId: string;
      questions: Array<{
        type: ExerciseType;
        explanation: string;
        answerPlaceholder: string;
        audioUrl: string;
        audioTranscript: string;
        question: string;
        options: string[];
        feedbackConfig: SmartFeedbackConfig;
      }>;
    }>;
  }>,
  now: string,
  supportsSubmoduleAudioColumn: boolean,
  supportsSubmoduleAudioTranscriptColumn: boolean,
  supportsExerciseExplanationColumn: boolean,
  supportsExerciseAnswerPlaceholderColumn: boolean,
  supportsExerciseAudioColumn: boolean,
  supportsExerciseAudioTranscriptColumn: boolean,
) {
  if (submodules.length === 0) {
    return;
  }

  const { data: insertedSubmodules, error: insertSubmodulesError } = await supabase
    .from("brand_submodules")
    .insert(
      submodules.map((submodule, index) => ({
        module_id: moduleId,
        title: submodule.title,
        position: index + 1,
        video_url: submodule.videoUrl.trim(),
        ...(supportsSubmoduleAudioColumn
          ? { audio_url: submodule.audioUrl.trim() || null }
          : {}),
        ...(supportsSubmoduleAudioTranscriptColumn
          ? { audio_transcript: submodule.audioTranscript.trim() || null }
          : {}),
        content_html: appendAudioMetadataToHtml(
          submodule.contentHtml,
          submodule.audioUrl,
          submodule.audioTranscript,
        ),
        created_at: now,
        updated_at: now,
      })),
    )
    .select("id, position")
    .returns<Array<{ id: number; position: number }>>();

  if (insertSubmodulesError) {
    throw new Error(insertSubmodulesError.message);
  }

  const submoduleIdByPosition = new Map(
    (insertedSubmodules ?? []).map((submodule) => [submodule.position, submodule.id]),
  );

  let globalExercisePosition = 1;
  const exerciseRows = submodules.flatMap((submodule, submoduleIndex) =>
    submodule.exerciseGroups.flatMap((exerciseGroup) =>
      exerciseGroup.questions.map((exercise) => {
      const baseRow = {
        module_id: moduleId,
        submodule_id: submoduleIdByPosition.get(submoduleIndex + 1) ?? null,
        position: globalExercisePosition++,
        type: getPersistedExerciseType(exercise.type),
        question: appendAnswerPlaceholderToQuestion(
          exercise.question,
          exercise.answerPlaceholder,
        ),
        options: appendAudioUrlOption(
          appendExplanationOption(
            appendAnswerPlaceholderOption(
              appendExerciseGroupIdOption(
                [
                  ...exercise.options,
                  getSerializedSmartFeedbackOption(exercise.feedbackConfig),
                ],
                exerciseGroup.groupId,
              ),
              exercise.answerPlaceholder,
            ),
            supportsExerciseExplanationColumn ? "" : exercise.explanation,
          ),
          exercise.audioUrl,
        ),
      };

      const rowWithExplanation = supportsExerciseExplanationColumn
        ? {
            ...baseRow,
            explanation: exercise.explanation,
          }
        : baseRow;

      const rowWithAnswerPlaceholder = supportsExerciseAnswerPlaceholderColumn
        ? {
            ...rowWithExplanation,
            answer_placeholder: exercise.answerPlaceholder,
          }
        : rowWithExplanation;

      const rowWithAudio = supportsExerciseAudioColumn
        ? {
            ...rowWithAnswerPlaceholder,
            audio_url: exercise.audioUrl.trim() || null,
          }
        : rowWithAnswerPlaceholder;

      return rowWithAudio;
      }),
    ),
  );

  if (exerciseRows.length === 0) {
    return;
  }

  const { error: insertExercisesError } = await supabase
    .from("module_exercises")
    .insert(exerciseRows);

  if (!insertExercisesError) {
    return;
  }

  if (
    (supportsExerciseExplanationColumn ||
      supportsExerciseAnswerPlaceholderColumn ||
      supportsExerciseAudioColumn ||
      supportsExerciseAudioTranscriptColumn) &&
    isMissingDatabaseObject(insertExercisesError)
  ) {
    const fallbackRows = exerciseRows.map((row) => {
      const fallbackRow = {
        ...row,
      } as typeof row & {
        explanation?: string;
        answer_placeholder?: string;
        audio_url?: string | null;
        audio_transcript?: string | null;
      };
      fallbackRow.options = appendExplanationOption(
        appendAnswerPlaceholderOption(
          normalizeOptions(fallbackRow.options),
          fallbackRow.answer_placeholder ?? "",
        ),
        fallbackRow.explanation ?? "",
      );
      delete fallbackRow.explanation;
      delete fallbackRow.answer_placeholder;
      delete fallbackRow.audio_url;
      delete fallbackRow.audio_transcript;
      return fallbackRow;
    });
    const { error: fallbackInsertExercisesError } = await supabase
      .from("module_exercises")
      .insert(fallbackRows);

    if (fallbackInsertExercisesError) {
      throw new Error(fallbackInsertExercisesError.message);
    }

    return;
  }

  throw new Error(insertExercisesError.message);
}

async function supportsSubmoduleStorage(
  supabase: ReturnType<typeof createSupabaseServerClient>,
) {
  const [submodulesProbe, exercisesProbe] = await Promise.all([
    supabase.from("brand_submodules").select("id").limit(1),
    supabase.from("module_exercises").select("submodule_id").limit(1),
  ]);

  return (
    !isMissingDatabaseObject(submodulesProbe.error) &&
    !isMissingDatabaseObject(exercisesProbe.error)
  );
}

async function supportsModuleAudio(
  supabase: ReturnType<typeof createSupabaseServerClient>,
) {
  const probe = await supabase.from("brand_modules").select("audio_url").limit(1);
  return !isMissingDatabaseObject(probe.error);
}

async function supportsModuleAudioTranscript(
  supabase: ReturnType<typeof createSupabaseServerClient>,
) {
  const probe = await supabase
    .from("brand_modules")
    .select("audio_transcript")
    .limit(1);
  return !isMissingDatabaseObject(probe.error);
}

async function supportsSubmoduleAudio(
  supabase: ReturnType<typeof createSupabaseServerClient>,
) {
  const probe = await supabase.from("brand_submodules").select("audio_url").limit(1);
  return !isMissingDatabaseObject(probe.error);
}

async function supportsSubmoduleAudioTranscript(
  supabase: ReturnType<typeof createSupabaseServerClient>,
) {
  const probe = await supabase
    .from("brand_submodules")
    .select("audio_transcript")
    .limit(1);
  return !isMissingDatabaseObject(probe.error);
}

async function supportsExerciseExplanation(
  supabase: ReturnType<typeof createSupabaseServerClient>,
) {
  const probe = await supabase.from("module_exercises").select("explanation").limit(1);
  return !isMissingDatabaseObject(probe.error);
}

async function supportsExerciseAnswerPlaceholder(
  supabase: ReturnType<typeof createSupabaseServerClient>,
) {
  const probe = await supabase
    .from("module_exercises")
    .select("answer_placeholder")
    .limit(1);
  return !isMissingDatabaseObject(probe.error);
}

async function supportsExerciseAudio(
  supabase: ReturnType<typeof createSupabaseServerClient>,
) {
  const probe = await supabase.from("module_exercises").select("audio_url").limit(1);
  return !isMissingDatabaseObject(probe.error);
}

async function supportsExerciseAudioTranscript(
  supabase: ReturnType<typeof createSupabaseServerClient>,
) {
  const probe = await supabase
    .from("module_exercises")
    .select("audio_transcript")
    .limit(1);
  return !isMissingDatabaseObject(probe.error);
}

async function insertExercisesLegacy(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  moduleId: number,
  submodules: Array<{
    exerciseGroups: Array<{
      groupId: string;
      questions: Array<{
        type: ExerciseType;
        explanation: string;
        answerPlaceholder: string;
        audioUrl: string;
        audioTranscript: string;
        question: string;
        options: string[];
        feedbackConfig: SmartFeedbackConfig;
      }>;
    }>;
  }>,
  supportsExerciseExplanationColumn: boolean,
  supportsExerciseAnswerPlaceholderColumn: boolean,
  supportsExerciseAudioColumn: boolean,
  supportsExerciseAudioTranscriptColumn: boolean,
) {
  let globalExercisePosition = 1;
  const exerciseRows = submodules.flatMap((submodule) =>
    submodule.exerciseGroups.flatMap((exerciseGroup) =>
      exerciseGroup.questions.map((exercise) => {
      const baseRow = {
        module_id: moduleId,
        position: globalExercisePosition++,
        type: getPersistedExerciseType(exercise.type),
        question: appendAnswerPlaceholderToQuestion(
          exercise.question,
          exercise.answerPlaceholder,
        ),
        options: appendAudioTranscriptOption(
          appendAudioUrlOption(
            appendExplanationOption(
              appendAnswerPlaceholderOption(
                appendExerciseGroupIdOption(
                  [
                    ...exercise.options,
                    getSerializedSmartFeedbackOption(exercise.feedbackConfig),
                  ],
                  exerciseGroup.groupId,
                ),
                exercise.answerPlaceholder,
              ),
              supportsExerciseExplanationColumn ? "" : exercise.explanation,
            ),
            exercise.audioUrl,
          ),
          supportsExerciseAudioTranscriptColumn ? "" : exercise.audioTranscript,
        ),
      };

      const rowWithExplanation = supportsExerciseExplanationColumn
        ? {
            ...baseRow,
            explanation: exercise.explanation,
          }
        : baseRow;

      const rowWithAnswerPlaceholder = supportsExerciseAnswerPlaceholderColumn
        ? {
            ...rowWithExplanation,
            answer_placeholder: exercise.answerPlaceholder,
          }
        : rowWithExplanation;

      const rowWithAudio = supportsExerciseAudioColumn
        ? {
            ...rowWithAnswerPlaceholder,
            audio_url: exercise.audioUrl.trim() || null,
          }
        : rowWithAnswerPlaceholder;

      const rowWithAudioTranscript = supportsExerciseAudioTranscriptColumn
        ? {
            ...rowWithAudio,
            audio_transcript: exercise.audioTranscript.trim() || null,
          }
        : rowWithAudio;

      return rowWithAudioTranscript;
      }),
    ),
  );

  if (exerciseRows.length === 0) {
    return;
  }

  const { error } = await supabase.from("module_exercises").insert(exerciseRows);

  if (!error) {
    return;
  }

  if (
    (supportsExerciseExplanationColumn ||
      supportsExerciseAnswerPlaceholderColumn ||
      supportsExerciseAudioColumn) &&
    isMissingDatabaseObject(error)
  ) {
    const fallbackRows = exerciseRows.map((row) => {
      const fallbackRow = {
        ...row,
      } as typeof row & {
        explanation?: string;
        answer_placeholder?: string;
        audio_url?: string | null;
        audio_transcript?: string | null;
      };
      fallbackRow.options = appendExplanationOption(
        appendAnswerPlaceholderOption(
          normalizeOptions(fallbackRow.options),
          fallbackRow.answer_placeholder ?? "",
        ),
        fallbackRow.explanation ?? "",
      );
      delete fallbackRow.explanation;
      delete fallbackRow.answer_placeholder;
      delete fallbackRow.audio_url;
      delete fallbackRow.audio_transcript;
      return fallbackRow;
    });
    const { error: fallbackError } = await supabase
      .from("module_exercises")
      .insert(fallbackRows);

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    return;
  }

  throw new Error(error.message);
}

export async function deleteModuleDefinition(moduleId: number) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("brand_modules").delete().eq("id", moduleId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAdminOverview() {
  const supabase = createSupabaseServerClient();
  const [
    { count: accountCount, error: accountsError },
    { count: adminCount, error: adminsError },
    { count: projectCount, error: projectsError },
    { count: moduleCount, error: modulesError },
    { count: publishedModuleCount, error: publishedModulesError },
    { count: answerCount, error: answersError },
  ] = await Promise.all([
    supabase.from("client_access_codes").select("*", { count: "exact", head: true }),
    supabase
      .from("client_access_codes")
      .select("*", { count: "exact", head: true })
      .eq("is_admin", true),
    supabase.from("brand_projects").select("*", { count: "exact", head: true }),
    supabase.from("brand_modules").select("*", { count: "exact", head: true }),
    supabase
      .from("brand_modules")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("project_exercise_answers")
      .select("*", { count: "exact", head: true }),
  ]);

  const errors = [
    accountsError,
    adminsError,
    projectsError,
    modulesError,
    publishedModulesError,
    answersError,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? "Unable to load admin overview");
  }

  return {
    accountCount: accountCount ?? 0,
    adminCount: adminCount ?? 0,
    projectCount: projectCount ?? 0,
    moduleCount: moduleCount ?? 0,
    publishedModuleCount: publishedModuleCount ?? 0,
    answerCount: answerCount ?? 0,
  } satisfies AdminOverview;
}

export async function getAdminAccounts() {
  const supabase = createSupabaseServerClient();
  const [{ data: accounts, error: accountsError }, { data: projects, error: projectsError }] =
    await Promise.all([
      supabase
        .from("client_access_codes")
        .select("id,email,client_name,company_name,is_active,is_admin,created_at")
        .order("created_at", { ascending: false })
        .returns<
          Array<
            Omit<AdminAccountSummary, "project_name">
          >
        >(),
      supabase
        .from("brand_projects")
        .select("account_id,name")
        .returns<Array<{ account_id: number; name: string }>>(),
    ]);

  if (accountsError) {
    throw new Error(accountsError.message);
  }

  if (projectsError) {
    throw new Error(projectsError.message);
  }

  const projectByAccountId = new Map(
    (projects ?? []).map((project) => [project.account_id, project.name]),
  );

  return (accounts ?? []).map((account) => ({
    ...account,
    project_name: projectByAccountId.get(account.id) ?? null,
  })) satisfies AdminAccountSummary[];
}
