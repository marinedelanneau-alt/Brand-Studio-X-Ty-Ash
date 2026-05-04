"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { deleteAdminModule, saveAdminModule } from "../admin/modules/actions";
import {
  EXERCISE_TYPE_LABELS,
  exerciseNeedsOptions,
  getDefaultTableConfig,
  getDefaultImageUploadConfig,
  getEditorExerciseQuestion,
  getEditorOptionsText,
  getExerciseDefaultOptionsText,
  normalizeExerciseOptions,
  parseColorOption,
  parseStoredImageUploadConfig,
  parseStoredTableConfig,
  type ExerciseType,
} from "@/lib/exercise-types";
import {
  getDefaultBrandPersonaConfig,
  getSerializedBrandPersonaOptions,
  parseStoredBrandPersonaConfig,
  type BrandPersonaConfig,
} from "@/lib/brand-persona";
import {
  getDefaultSpectrumConfig,
  getSerializedSpectrumOptions,
  parseStoredSpectrumConfig,
  type SpectrumConfig,
} from "@/lib/spectrum";
import {
  getDefaultColorPaletteConfig,
  getSerializedColorPaletteOptions,
  parseStoredColorPaletteConfig,
  type ColorPaletteConfig,
} from "@/lib/color-palette";
import {
  getDefaultSmartFeedbackConfig,
  type SmartFeedbackConfig,
} from "@/lib/smart-feedback";
import { groupExercisesByGroupId } from "@/lib/exercise-groups";
import BrandPersonaAdminEditor from "./brand-persona-admin-editor";
import ColorPaletteAdminEditor from "./color-palette-admin-editor";
import ExercisePreview from "./exercise-preview";
import RichTextEditor from "./rich-text-editor";
import SmartFeedbackAdminEditor from "./smart-feedback-admin-editor";
import SpectrumAdminEditor from "./spectrum-admin-editor";
import type { BrandSubmodule, ModuleExercise } from "@/lib/training-types";

type EditorQuestion = {
  id: string;
  type: ExerciseType;
  explanation: string;
  answerPlaceholder: string;
  question: string;
  optionsText: string;
  tableRows: number;
  tableColumns: number;
  tableRowLabelsText: string;
  tableColumnLabelsText: string;
  imageUploadMax: number;
  brandPersonaConfig: BrandPersonaConfig;
  spectrumConfig: SpectrumConfig;
  colorPaletteConfig: ColorPaletteConfig;
  smartFeedbackConfig: SmartFeedbackConfig;
};

type EditorExerciseGroup = { id: string; questions: EditorQuestion[] };
type EditorSubmodule = {
  id: string;
  title: string;
  videoUrl: string;
  contentHtml: string;
  exerciseGroups: EditorExerciseGroup[];
};
type EditorModule = {
  id?: number;
  title: string;
  position: number;
  isPublished: boolean;
  submodules: EditorSubmodule[];
};
type AdminModule = {
  id: number;
  title: string;
  position: number;
  video_url: string;
  content_html: string;
  is_published: boolean;
  submodules: Array<BrandSubmodule & { exercises: ModuleExercise[] }>;
  exercises: ModuleExercise[];
};

type ManagedEditorModule = {
  key: string;
  heading: string;
  submitLabel: string;
  defaultOpen: boolean;
  value: EditorModule;
};

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function createEmptyQuestion(type: ExerciseType = "open"): EditorQuestion {
  const tableConfig = getDefaultTableConfig();
  const imageUploadConfig = getDefaultImageUploadConfig();
  const spectrumConfig = getDefaultSpectrumConfig();
  const colorPaletteConfig = getDefaultColorPaletteConfig();

  return {
    id: crypto.randomUUID(),
    type,
    explanation: "",
    answerPlaceholder: "",
    question:
      type === "spectrum"
        ? "Ou se situe ta marque entre sobriete et expression ?"
        : type === "color_palette"
          ? "Construis la palette de couleurs de ta marque"
        : "",
    optionsText: getExerciseDefaultOptionsText(type),
    tableRows: tableConfig.rows,
    tableColumns: tableConfig.columns,
    tableRowLabelsText: tableConfig.rowLabels.join("\n"),
    tableColumnLabelsText: tableConfig.columnLabels.join("\n"),
    imageUploadMax: imageUploadConfig.maxImages,
    brandPersonaConfig: getDefaultBrandPersonaConfig(),
    spectrumConfig,
    colorPaletteConfig,
    smartFeedbackConfig: getDefaultSmartFeedbackConfig(),
  };
}

function createEmptyExerciseGroup(): EditorExerciseGroup {
  return { id: crypto.randomUUID(), questions: [createEmptyQuestion()] };
}

function createEmptySubmodule(position: number): EditorSubmodule {
  return {
    id: crypto.randomUUID(),
    title: `Sous-module ${position}`,
    videoUrl: "",
    contentHtml: "<p>Ajoutez ici le contenu du sous-module.</p>",
    exerciseGroups: [createEmptyExerciseGroup()],
  };
}

function createEmptyModule(position: number): EditorModule {
  return {
    title: "",
    position,
    isPublished: true,
    submodules: [createEmptySubmodule(1)],
  };
}

function toEditorQuestion(exercise: ModuleExercise, fallbackIndex: number): EditorQuestion {
  const tableConfig = parseStoredTableConfig(exercise.options);
  const imageUploadConfig = parseStoredImageUploadConfig(exercise.options);

  return {
    id: String(exercise.id ?? fallbackIndex + 1),
    type: exercise.type,
    explanation: exercise.explanation ?? "",
    answerPlaceholder: exercise.answer_placeholder ?? "",
    question: getEditorExerciseQuestion(exercise.type, exercise.question),
    optionsText: getEditorOptionsText(exercise.type, exercise.options),
    tableRows: tableConfig.rows,
    tableColumns: tableConfig.columns,
    tableRowLabelsText: tableConfig.rowLabels.join("\n"),
    tableColumnLabelsText: tableConfig.columnLabels.join("\n"),
    imageUploadMax: imageUploadConfig.maxImages,
    brandPersonaConfig: parseStoredBrandPersonaConfig(exercise.options),
    spectrumConfig: parseStoredSpectrumConfig(exercise.options),
    colorPaletteConfig: parseStoredColorPaletteConfig(exercise.options),
    smartFeedbackConfig: exercise.feedback_config ?? getDefaultSmartFeedbackConfig(),
  };
}

function toEditorExerciseGroups(exercises: ModuleExercise[]) {
  return groupExercisesByGroupId(exercises).map((group, groupIndex) => ({
    id: group.id || `exercise-group-${groupIndex + 1}`,
    questions: group.questions.map((question, questionIndex) =>
      toEditorQuestion(question, questionIndex),
    ),
  }));
}

function toEditorModule(module: AdminModule): EditorModule {
  return {
    id: module.id,
    title: module.title,
    position: module.position,
    isPublished: module.is_published,
    submodules: module.submodules.map((submodule, index) => ({
      id: String(submodule.id ?? index + 1),
      title: submodule.title,
      videoUrl: submodule.video_url,
      contentHtml: submodule.content_html,
      exerciseGroups: toEditorExerciseGroups(submodule.exercises),
    })),
  };
}

function getQuestionLabel(type: ExerciseType) {
  if (type === "static_text") return "Texte a afficher";
  if (type === "popup_message") return "Message ou citation";
  if (type === "image_upload") return "Question ou intention";
  if (type === "prompt_open") return "Libelle";
  if (type === "brand_persona") return "Titre de l'exercice";
  if (type === "spectrum") return "Question du spectrum";
  if (type === "color_palette") return "Titre de l'exercice";
  return "Question";
}

function getQuestionHint(type: ExerciseType) {
  if (type === "fill_blank") return "Utilisez `___` dans la question pour creer les trous a completer.";
  if (type === "prompt_open") return "Exemple : `Ta Mission`. L'utilisateur verra `Ta Mission :` suivi d'un champ.";
  if (type === "static_text") return "Ce bloc affiche simplement du texte entre deux questions.";
  if (type === "popup_message") return "Ce bloc ouvre une pop-up inspirante avec un message motivant ou une citation que l'utilisateur peut fermer.";
  if (type === "image_upload") return "L'utilisateur pourra importer plusieurs images pour composer un tableau d'inspiration.";
  if (type === "boolean") return "Les choix Oui et Non sont ajoutes automatiquement.";
  if (type === "checklist") return "L'utilisateur pourra ajouter autant d'elements qu'il souhaite.";
  if (type === "brand_persona") return "Configure ici les sections et questions du persona de marque, avec leur ordre, leur type et leurs exemples.";
  if (type === "spectrum") return "Configure un axe entre deux polarites, avec emojis, justification et effets subtils aux extremes.";
  if (type === "color_palette") return "Configure un exercice de palette avec couleurs principales, secondaires, picker visuel, HEX, pipette et eventuels degradés.";
  return "";
}

function usesRichTextEditor(type: ExerciseType) {
  return type === "static_text" || type === "popup_message";
}

function isPassiveContentType(type: ExerciseType) {
  return type === "static_text" || type === "popup_message";
}

function supportsExplanationField(type: ExerciseType) {
  return type !== "static_text";
}

function supportsPlaceholderField(type: ExerciseType) {
  return !isPassiveContentType(type) && type !== "image_upload" && type !== "brand_persona" && type !== "spectrum" && type !== "color_palette";
}

function supportsSmartFeedbackField(type: ExerciseType) {
  return (
    !isPassiveContentType(type) &&
    type !== "image_upload" &&
    type !== "brand_persona" &&
    type !== "spectrum" &&
    type !== "color_palette"
  );
}

function getPlaceholderFieldLabel(type: ExerciseType) {
  if (type === "checklist") {
    return "Exemple d'element (placeholder)";
  }

  if (type === "group_open") {
    return "Exemple de reponse par champ (placeholder)";
  }

  return "Exemple de reponse (placeholder)";
}

function getPlaceholderFieldHint(type: ExerciseType) {
  if (type === "checklist") {
    return "Ex. Palette chaude, Mot cle, Idee de post";
  }

  if (type === "prompt_open") {
    return "Ex. Rayonnante et premium";
  }

  if (type === "group_open") {
    return "Ex. Votre reponse ici";
  }

  if (type === "table") {
    return "Ex. Saisissez votre idee";
  }

  return "Ex. Votre reponse ici";
}

function serializeQuestion(question: EditorQuestion) {
  const options =
    question.type === "table"
      ? [
          `__table_rows__:${Math.max(1, question.tableRows)}`,
          `__table_columns__:${Math.max(1, question.tableColumns)}`,
          ...question.tableRowLabelsText
            .split("\n")
            .map((label) => label.trim())
            .slice(0, Math.max(1, question.tableRows))
            .map((label) => `__table_row__:${label}`),
          ...question.tableColumnLabelsText
            .split("\n")
            .map((label) => label.trim())
            .slice(0, Math.max(1, question.tableColumns))
            .map((label) => `__table_column__:${label}`),
        ]
      : question.type === "image_upload"
        ? [`__image_upload_max__:${Math.max(1, question.imageUploadMax)}`]
      : question.type === "brand_persona"
        ? getSerializedBrandPersonaOptions(question.brandPersonaConfig)
      : question.type === "spectrum"
        ? getSerializedSpectrumOptions(question.spectrumConfig)
      : question.type === "color_palette"
        ? getSerializedColorPaletteOptions(question.colorPaletteConfig)
      : normalizeExerciseOptions(question.type, question.optionsText.split("\n"));

  return {
    type: question.type,
    explanation: question.explanation.trim(),
    answerPlaceholder: question.answerPlaceholder.trim(),
    question: question.question.trim(),
    options,
    feedbackConfig: question.smartFeedbackConfig,
  };
}

function looksLikeHtml(value: string) {
  return /<[^>]+>/.test(value);
}

function toPreviewExercise(question: EditorQuestion) {
  const serializedQuestion = serializeQuestion(question);

  return {
    id: question.id,
    type: serializedQuestion.type,
    explanation: serializedQuestion.explanation,
    answer_placeholder: serializedQuestion.answerPlaceholder,
    question: serializedQuestion.question,
    options: serializedQuestion.options,
  };
}

function updateQuestionInModule(
  module: EditorModule,
  submoduleId: string,
  groupId: string,
  questionId: string,
  updater: (question: EditorQuestion) => EditorQuestion,
) {
  return {
    ...module,
    submodules: module.submodules.map((submodule) =>
      submodule.id === submoduleId
        ? {
            ...submodule,
            exerciseGroups: submodule.exerciseGroups.map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    questions: group.questions.map((question) =>
                      question.id === questionId ? updater(question) : question,
                    ),
                  }
                : group,
            ),
          }
        : submodule,
    ),
  };
}

function updateGroupInModule(
  module: EditorModule,
  submoduleId: string,
  groupId: string,
  updater: (group: EditorExerciseGroup) => EditorExerciseGroup,
) {
  return {
    ...module,
    submodules: module.submodules.map((submodule) =>
      submodule.id === submoduleId
        ? {
            ...submodule,
            exerciseGroups: submodule.exerciseGroups.map((group) =>
              group.id === groupId ? updater(group) : group,
            ),
          }
        : submodule,
    ),
  };
}

function moveExerciseGroupToSubmodule(
  module: EditorModule,
  sourceSubmoduleId: string,
  groupId: string,
  targetSubmoduleId: string,
) {
  if (sourceSubmoduleId === targetSubmoduleId) {
    return module;
  }

  const sourceSubmodule = module.submodules.find((submodule) => submodule.id === sourceSubmoduleId);
  const targetSubmodule = module.submodules.find((submodule) => submodule.id === targetSubmoduleId);
  const movedGroup = sourceSubmodule?.exerciseGroups.find((group) => group.id === groupId);

  if (!sourceSubmodule || !targetSubmodule || !movedGroup) {
    return module;
  }

  return {
    ...module,
    submodules: module.submodules.map((submodule) => {
      if (submodule.id === sourceSubmoduleId) {
        return {
          ...submodule,
          exerciseGroups: submodule.exerciseGroups.filter((group) => group.id !== groupId),
        };
      }

      if (submodule.id === targetSubmoduleId) {
        return {
          ...submodule,
          exerciseGroups: [...submodule.exerciseGroups, movedGroup],
        };
      }

      return submodule;
    }),
  };
}

function moveQuestionToSubmodule(
  module: EditorModule,
  sourceSubmoduleId: string,
  groupId: string,
  questionId: string,
  targetSubmoduleId: string,
) {
  if (sourceSubmoduleId === targetSubmoduleId) {
    return module;
  }

  const sourceSubmodule = module.submodules.find((submodule) => submodule.id === sourceSubmoduleId);
  const targetSubmodule = module.submodules.find((submodule) => submodule.id === targetSubmoduleId);
  const sourceGroup = sourceSubmodule?.exerciseGroups.find((group) => group.id === groupId);
  const movedQuestion = sourceGroup?.questions.find((question) => question.id === questionId);

  if (!sourceSubmodule || !targetSubmodule || !sourceGroup || !movedQuestion) {
    return module;
  }

  return {
    ...module,
    submodules: module.submodules.map((submodule) => {
      if (submodule.id === sourceSubmoduleId) {
        const nextGroups = submodule.exerciseGroups.flatMap((group) => {
          if (group.id !== groupId) {
            return [group];
          }

          const remainingQuestions = group.questions.filter(
            (question) => question.id !== questionId,
          );

          if (remainingQuestions.length === 0) {
            return [];
          }

          return [
            {
              ...group,
              questions: remainingQuestions,
            },
          ];
        });

        return {
          ...submodule,
          exerciseGroups: nextGroups,
        };
      }

      if (submodule.id === targetSubmoduleId) {
        return {
          ...submodule,
          exerciseGroups: [
            ...submodule.exerciseGroups,
            {
              id: crypto.randomUUID(),
              questions: [movedQuestion],
            },
          ],
        };
      }

      return submodule;
    }),
  };
}

function MoveToSubmoduleControl({
  title,
  helper,
  availableTargets,
  buttonLabel,
  onMove,
}: {
  title: string;
  helper: string;
  availableTargets: Array<{ id: string; label: string }>;
  buttonLabel: string;
  onMove: (targetSubmoduleId: string) => void;
}) {
  const [targetSubmoduleId, setTargetSubmoduleId] = useState(
    availableTargets[0]?.id ?? "",
  );
  const resolvedTargetSubmoduleId = availableTargets.some(
    (target) => target.id === targetSubmoduleId,
  )
    ? targetSubmoduleId
    : (availableTargets[0]?.id ?? "");

  if (availableTargets.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-[0.9rem] border border-[#eadfca] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">
        {title}
      </p>
      <p className="mt-1 text-sm leading-6 text-[#8a8077]">{helper}</p>
      <div className="mt-3 flex flex-col gap-3 md:flex-row">
        <select
          value={resolvedTargetSubmoduleId}
          onChange={(event) => setTargetSubmoduleId(event.target.value)}
          className="h-11 flex-1 rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf7] px-4 text-sm text-[#5f544a]"
        >
          {availableTargets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!resolvedTargetSubmoduleId}
          onClick={() => onMove(resolvedTargetSubmoduleId)}
          className="rounded-[0.8rem] border border-[#eadfca] bg-[#fff8f1] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

function PositionControl({
  label,
  value,
  count,
  onChange,
}: {
  label: string;
  value: number;
  count: number;
  onChange: (nextIndex: number) => void;
}) {
  if (count <= 1) {
    return null;
  }

  return (
    <label className="flex items-center gap-3">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#8a8077]">
        {label}
      </span>
      <select
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 min-w-[9rem] rounded-[0.8rem] border border-[#eadfca] bg-white px-3 text-sm text-[#5f544a]"
      >
        {Array.from({ length: count }, (_, index) => (
          <option key={index} value={index}>
            Position {index + 1}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuestionCard({
  question,
  questionIndex,
  questionCount,
  availableSubmoduleTargets,
  onMoveUp,
  onMoveDown,
  onMoveToIndex,
  onMoveToSubmodule,
  onDelete,
  onChange,
}: {
  question: EditorQuestion;
  questionIndex: number;
  questionCount: number;
  availableSubmoduleTargets: Array<{ id: string; label: string }>;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToIndex: (nextIndex: number) => void;
  onMoveToSubmodule: (targetSubmoduleId: string) => void;
  onDelete: () => void;
  onChange: (updater: (question: EditorQuestion) => EditorQuestion) => void;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(question.question.trim().length === 0);
  const questionSummary = question.question.trim() || "Exercice sans titre";

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isPreviewOpen]);

  return (
    <>
      <div className="rounded-[0.95rem] border border-[#eadfca] bg-[#fffdf7] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="min-w-0 flex-1 text-left"
            aria-expanded={isExpanded}
          >
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7a7087]">
              Question {questionIndex + 1}
            </p>
            <p className="mt-2 whitespace-normal break-words text-base font-semibold text-[#4b4550]">
              {questionSummary}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#8a8077]">
              {EXERCISE_TYPE_LABELS[question.type]}
            </p>
          </button>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <PositionControl
              label="Position"
              value={questionIndex}
              count={questionCount}
              onChange={onMoveToIndex}
            />
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="rounded-[0.7rem] border border-[#eadfca] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]"
            >
              {isExpanded ? "Plier" : "Deplier"}
            </button>
            <button
              type="button"
              disabled={questionIndex === 0}
              onClick={onMoveUp}
              className="rounded-[0.7rem] border border-[#eadfca] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Monter
            </button>
            <button
              type="button"
              disabled={questionIndex === questionCount - 1}
              onClick={onMoveDown}
              className="rounded-[0.7rem] border border-[#eadfca] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Descendre
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="text-xs font-black uppercase tracking-[0.12em] text-[#b45247]"
            >
              Supprimer
            </button>
          </div>
        </div>

        {availableSubmoduleTargets.length > 0 ? (
          <MoveToSubmoduleControl
            title="Deplacer cette question"
            helper="La question sera envoyee dans le sous-module cible comme nouvel exercice."
            availableTargets={availableSubmoduleTargets}
            buttonLabel="Deplacer"
            onMove={onMoveToSubmodule}
          />
        ) : null}

        {isExpanded ? (
        <div className="mt-4 grid max-w-5xl gap-4">
          <label className="space-y-2">
            <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
              Type
            </span>
            <select
              value={question.type}
              onChange={(event) => {
                const nextType = event.target.value as ExerciseType;
                onChange((current) => ({
                  ...createEmptyQuestion(nextType),
                  id: current.id,
                  question: current.question,
                  explanation: current.explanation,
                  answerPlaceholder: current.answerPlaceholder,
                }));
              }}
              className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
            >
              {Object.entries(EXERCISE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2">
            <span className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
              <span>{getQuestionLabel(question.type)}</span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-3 py-1.5 text-[0.68rem] text-[#6b625a] transition hover:border-[#cf7430] hover:text-[#cf7430]"
                aria-label={`Previsualiser la question ${questionIndex + 1}`}
                title="Previsualiser le rendu"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Apercu</span>
              </button>
            </span>
            {usesRichTextEditor(question.type) ? (
              <RichTextEditor
                value={question.question}
                onChange={(contentHtml) => onChange((current) => ({ ...current, question: contentHtml }))}
                placeholder={
                  question.type === "popup_message"
                    ? "Ajoutez ici la citation ou le message inspirant."
                    : "Ajoutez ici le texte d'introduction ou d'explication."
                }
              />
            ) : (
              <input
                type="text"
                value={question.question}
                onChange={(event) => onChange((current) => ({ ...current, question: event.target.value }))}
                className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
              />
            )}
            {getQuestionHint(question.type) ? (
              <p className="text-sm leading-6 text-[#8a8077]">{getQuestionHint(question.type)}</p>
            ) : null}
            {usesRichTextEditor(question.type) &&
            !looksLikeHtml(question.question) &&
            question.question.trim() ? (
              <p className="text-sm leading-6 text-[#8a8077]">
                Astuce : ce bloc accepte maintenant le texte enrichi, comme le contenu des modules.
              </p>
            ) : null}
          </div>

          {supportsExplanationField(question.type) ? (
            <>
              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                  {question.type === "popup_message"
                    ? "Auteur ou signature"
                    : question.type === "brand_persona"
                      ? "Texte d'introduction"
                      : "Consigne ou contexte"}
                </span>
                <textarea
                  value={question.explanation}
                  onChange={(event) => onChange((current) => ({ ...current, explanation: event.target.value }))}
                  className="min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
                />
              </label>

              {supportsPlaceholderField(question.type) ? (
                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                    {getPlaceholderFieldLabel(question.type)}
                  </span>
                  <input
                    type="text"
                    value={question.answerPlaceholder}
                    onChange={(event) =>
                      onChange((current) => ({ ...current, answerPlaceholder: event.target.value }))
                    }
                    placeholder={getPlaceholderFieldHint(question.type)}
                    className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                  />
                  <p className="text-sm leading-6 text-[#8a8077]">
                    Ce texte apparait en grise dans le champ de reponse tant que l&apos;utilisateur n&apos;a rien saisi.
                  </p>
                </label>
              ) : null}
            </>
          ) : null}

          {question.type === "brand_persona" ? (
            <BrandPersonaAdminEditor
              value={question.brandPersonaConfig}
              onChange={(nextValue) =>
                onChange((current) => ({ ...current, brandPersonaConfig: nextValue }))
              }
            />
          ) : null}

          {question.type === "spectrum" ? (
            <SpectrumAdminEditor
              value={question.spectrumConfig}
              onChange={(nextValue) =>
                onChange((current) => ({ ...current, spectrumConfig: nextValue }))
              }
            />
          ) : null}

          {question.type === "color_palette" ? (
            <ColorPaletteAdminEditor
              value={question.colorPaletteConfig}
              onChange={(nextValue) =>
                onChange((current) => ({ ...current, colorPaletteConfig: nextValue }))
              }
            />
          ) : null}

          {supportsSmartFeedbackField(question.type) ? (
            <SmartFeedbackAdminEditor
              value={question.smartFeedbackConfig}
              onChange={(nextValue) =>
                onChange((current) => ({ ...current, smartFeedbackConfig: nextValue }))
              }
            />
          ) : null}

          {exerciseNeedsOptions(question.type) ? (
            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                {question.type === "color" ? "Couleurs, une ligne par choix" : "Options, une ligne par choix"}
              </span>
              <textarea
                value={question.optionsText}
                onChange={(event) => onChange((current) => ({ ...current, optionsText: event.target.value }))}
                className="min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
              />
              {question.type === "color" &&
              normalizeExerciseOptions(question.type, question.optionsText.split("\n")).length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {normalizeExerciseOptions(question.type, question.optionsText.split("\n")).map((option) => {
                    const colorOption = parseColorOption(option);

                    return (
                      <div
                        key={option}
                        className="flex items-center gap-3 rounded-[0.9rem] border border-[#eadfca] bg-white px-3 py-2"
                      >
                        <span
                          className="h-8 w-8 rounded-full border border-white shadow-[0_0_0_1px_rgba(75,69,80,0.12)]"
                          style={{ backgroundColor: colorOption.color }}
                        />
                        <div className="text-sm leading-5 text-[#5f544a]">
                          <p className="font-semibold">{colorOption.label}</p>
                          <p className="text-xs uppercase tracking-[0.12em] text-[#8a8077]">
                            {colorOption.color}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </label>
          ) : null}

          {question.type === "table" ? (
            <div className="space-y-4 rounded-[0.9rem] border border-[#eadfca] bg-[#fff8f1] px-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                    Nombre de lignes
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={question.tableRows}
                    onChange={(event) =>
                      onChange((current) => ({
                        ...current,
                        tableRows: Math.max(1, Number(event.target.value) || 1),
                      }))
                    }
                    className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                    Nombre de colonnes
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={question.tableColumns}
                    onChange={(event) =>
                      onChange((current) => ({
                        ...current,
                        tableColumns: Math.max(1, Number(event.target.value) || 1),
                      }))
                    }
                    className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                  Intitules des lignes
                </span>
                <textarea
                  value={question.tableRowLabelsText}
                  onChange={(event) =>
                    onChange((current) => ({ ...current, tableRowLabelsText: event.target.value }))
                  }
                  className="min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                  Intitules des colonnes
                </span>
                <textarea
                  value={question.tableColumnLabelsText}
                  onChange={(event) =>
                    onChange((current) => ({ ...current, tableColumnLabelsText: event.target.value }))
                  }
                  className="min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
                />
              </label>
            </div>
          ) : null}

          {question.type === "image_upload" ? (
            <div className="space-y-4 rounded-[0.9rem] border border-[#eadfca] bg-[#fff8f1] px-4 py-4">
              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                  Nombre maximum d&apos;images
                </span>
                <input
                  type="number"
                  min={1}
                  value={question.imageUploadMax}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      imageUploadMax: Math.max(1, Number(event.target.value) || 1),
                    }))
                  }
                  className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                />
              </label>
              <p className="text-sm leading-6 text-[#8a8077]">
                Exemple : 6 pour un mini moodboard, 12 pour un tableau plus riche.
              </p>
            </div>
          ) : null}
        </div>
        ) : null}
      </div>

      {isPreviewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f2418]/45 px-4 py-6"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[1.6rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff7ef)] p-6 shadow-[0_24px_70px_rgba(47,36,24,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
                  Apercu
                </p>
                <h3 className="mt-2 font-[family:var(--font-cormorant)] text-[2rem] leading-none text-[#4b4550]">
                  Question {questionIndex + 1}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#7b7068]">
                  Visualisation du rendu final cote utilisateur.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#6b625a]"
                aria-label="Fermer l'apercu"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-[#eadfca] bg-[#fffdf9] p-5">
              <ExercisePreview exercise={toPreviewExercise(question)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ModuleForm({
  module,
  heading,
  submitLabel,
  defaultOpen,
  onChange,
}: {
  module: EditorModule;
  heading: string;
  submitLabel: string;
  defaultOpen: boolean;
  onChange: (updater: (module: EditorModule) => EditorModule) => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeSubmoduleId, setActiveSubmoduleId] = useState(module.submodules[0]?.id ?? "");
  const visibleActiveSubmoduleId = module.submodules.some(
    (submodule) => submodule.id === activeSubmoduleId,
  )
    ? activeSubmoduleId
    : module.submodules[0]?.id ?? "";

  const submodulesJson = useMemo(
    () =>
      JSON.stringify(
        module.submodules.map((submodule, submoduleIndex) => ({
          title: submodule.title.trim(),
          position: submoduleIndex + 1,
          videoUrl: submodule.videoUrl.trim(),
          contentHtml: submodule.contentHtml.trim(),
          exerciseGroups: submodule.exerciseGroups.map((group) => ({
            groupId: group.id,
            questions: group.questions.map((question) => serializeQuestion(question)),
          })),
        })),
      ),
    [module.submodules],
  );

  const moduleLabel = module.title.trim() || heading;
  const totalExercises = module.submodules.reduce(
    (total, submodule) => total + submodule.exerciseGroups.length,
    0,
  );
  const activeSubmoduleIndex = module.submodules.findIndex(
    (submodule) => submodule.id === visibleActiveSubmoduleId,
  );
  const resolvedActiveSubmoduleIndex = activeSubmoduleIndex >= 0 ? activeSubmoduleIndex : 0;
  const activeSubmodule = module.submodules[resolvedActiveSubmoduleIndex];

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff8f1)] shadow-[0_18px_42px_rgba(210,189,152,0.1)]">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div className="min-w-0">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
            {module.id ? `Module ${module.position}` : "Nouveau module"}
          </p>
          <h2 className="mt-2 font-[family:var(--font-cormorant)] text-[2rem] leading-[0.95] text-[#4b4550]">
            {moduleLabel}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#7b7068]">
            {module.submodules.length} sous-module{module.submodules.length > 1 ? "s" : ""}, {totalExercises} exercice{totalExercises > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex rounded-full px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.18em] ${module.isPublished ? "bg-[#eef6eb] text-[#5f8d63]" : "bg-[#f2eef7] text-[#7a7087]"}`}>
            {module.isPublished ? "Publie" : "Brouillon"}
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#eadfca] bg-white text-lg text-[#6b625a]">
            {isOpen ? "-" : "+"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-[#eadfca] bg-[#fffdf7] px-4 py-6 sm:px-6">
          <form action={saveAdminModule} className="mx-auto max-w-6xl space-y-6">
            {module.id ? <input type="hidden" name="moduleId" value={module.id} /> : null}
            <input type="hidden" name="submodulesJson" value={submodulesJson} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">Titre du module</span>
                <input
                  name="title"
                  type="text"
                  required
                  value={module.title}
                  onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
                  className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">Position</span>
                <input
                  name="position"
                  type="number"
                  min={1}
                  required
                  value={module.position}
                  onChange={(event) =>
                    onChange((current) => ({ ...current, position: Math.max(1, Number(event.target.value) || 1) }))
                  }
                  className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-sm text-[#5f544a]">
              <input
                name="isPublished"
                type="checkbox"
                checked={module.isPublished}
                onChange={(event) => onChange((current) => ({ ...current, isPublished: event.target.checked }))}
              />
              <span>Module publie</span>
            </label>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">Sous-modules</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextSubmodule = createEmptySubmodule(module.submodules.length + 1);

                    onChange((current) => ({
                      ...current,
                      submodules: [...current.submodules, nextSubmodule],
                    }));
                    setActiveSubmoduleId(nextSubmodule.id);
                  }}
                  className="rounded-[0.8rem] border border-[#eadfca] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]"
                >
                  Ajouter un sous-module
                </button>
              </div>

              {module.submodules.length > 0 ? (
                <>
                  <div
                    className="flex flex-wrap gap-3 pb-2"
                    role="tablist"
                    aria-label="Sous-modules du module"
                  >
                    {module.submodules.map((submodule, submoduleIndex) => {
                      const isActive = submodule.id === activeSubmodule?.id;

                      return (
                        <div key={submodule.id} className="w-full sm:w-auto sm:flex-1">
                          <button
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`submodule-panel-${submodule.id}`}
                            id={`submodule-tab-${submodule.id}`}
                            onClick={() => setActiveSubmoduleId(submodule.id)}
                            className={`w-full rounded-[1rem] border px-4 py-3 text-left transition sm:min-w-[14rem] ${
                              isActive
                                ? "border-[#cf7430] bg-[#fff3e4] shadow-[0_10px_24px_rgba(210,189,152,0.12)]"
                                : "border-[#eadfca] bg-white hover:border-[#d8c4a4]"
                            }`}
                          >
                            <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
                              Sous-module {submoduleIndex + 1}
                            </p>
                            <p className="mt-1 whitespace-normal break-words text-sm font-semibold leading-5 text-[#4b4550]">
                              {submodule.title || `Sous-module ${submoduleIndex + 1}`}
                            </p>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {activeSubmodule ? (
                    <div
                      key={activeSubmodule.id}
                      id={`submodule-panel-${activeSubmodule.id}`}
                      role="tabpanel"
                      aria-labelledby={`submodule-tab-${activeSubmodule.id}`}
                      className="rounded-[1.2rem] border border-[#eadfca] bg-white p-5"
                    >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7a7087]">
                        Sous-module {resolvedActiveSubmoduleIndex + 1}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#7b7068]">
                        {activeSubmodule.title || `Sous-module ${resolvedActiveSubmoduleIndex + 1}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={resolvedActiveSubmoduleIndex === 0}
                        onClick={() =>
                          onChange((current) => ({
                            ...current,
                            submodules: moveItem(
                              current.submodules,
                              resolvedActiveSubmoduleIndex,
                              resolvedActiveSubmoduleIndex - 1,
                            ),
                          }))
                        }
                        className="rounded-[0.7rem] border border-[#eadfca] bg-[#fff8f1] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Monter
                      </button>
                      <button
                        type="button"
                        disabled={resolvedActiveSubmoduleIndex === module.submodules.length - 1}
                        onClick={() =>
                          onChange((current) => ({
                            ...current,
                            submodules: moveItem(
                              current.submodules,
                              resolvedActiveSubmoduleIndex,
                              resolvedActiveSubmoduleIndex + 1,
                            ),
                          }))
                        }
                        className="rounded-[0.7rem] border border-[#eadfca] bg-[#fff8f1] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Descendre
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const fallbackSubmodule =
                            module.submodules[resolvedActiveSubmoduleIndex + 1] ??
                            module.submodules[resolvedActiveSubmoduleIndex - 1];

                          onChange((current) => ({
                            ...current,
                            submodules: current.submodules.filter((item) => item.id !== activeSubmodule.id),
                          }));
                          setActiveSubmoduleId(fallbackSubmodule?.id ?? "");
                        }}
                        className="text-xs font-black uppercase tracking-[0.12em] text-[#b45247]"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid max-w-6xl gap-4">
                    <label className="space-y-2">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">Titre du sous-module</span>
                      <input
                        type="text"
                        required
                        value={activeSubmodule.title}
                        onChange={(event) =>
                          onChange((current) => ({
                            ...current,
                            submodules: current.submodules.map((item) =>
                              item.id === activeSubmodule.id ? { ...item, title: event.target.value } : item,
                            ),
                          }))
                        }
                        className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf7] px-4"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">URL video</span>
                      <input
                        type="url"
                        value={activeSubmodule.videoUrl}
                        onChange={(event) =>
                          onChange((current) => ({
                            ...current,
                            submodules: current.submodules.map((item) =>
                              item.id === activeSubmodule.id ? { ...item, videoUrl: event.target.value } : item,
                            ),
                          }))
                        }
                        className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf7] px-4"
                      />
                    </label>

                    <div className="space-y-3">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">Contenu</span>
                      <RichTextEditor
                        value={activeSubmodule.contentHtml}
                        onChange={(contentHtml) =>
                          onChange((current) => ({
                            ...current,
                            submodules: current.submodules.map((item) =>
                              item.id === activeSubmodule.id ? { ...item, contentHtml } : item,
                            ),
                          }))
                        }
                        placeholder="Ajoutez ici le contenu du sous-module."
                      />
                    </div>

                    <div className="space-y-4 rounded-[1rem] border border-[#f0e6d7] bg-[#fffdf7] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">Exercices</span>
                        <button
                          type="button"
                          onClick={() =>
                            onChange((current) => ({
                              ...current,
                              submodules: current.submodules.map((item) =>
                                item.id === activeSubmodule.id
                                  ? { ...item, exerciseGroups: [...item.exerciseGroups, createEmptyExerciseGroup()] }
                                  : item,
                              ),
                            }))
                          }
                          className="rounded-[0.8rem] border border-[#eadfca] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]"
                        >
                          Ajouter un exercice
                        </button>
                      </div>
                      {activeSubmodule.exerciseGroups.map((group, groupIndex) => (
                        <div key={group.id} className="rounded-[1rem] border border-[#eadfca] bg-white p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7a7087]">Exercice {groupIndex + 1}</p>
                              <p className="mt-1 text-sm leading-6 text-[#7b7068]">{group.questions.length} question{group.questions.length > 1 ? "s" : ""}</p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-3">
                              <PositionControl
                                label="Position"
                                value={groupIndex}
                                count={activeSubmodule.exerciseGroups.length}
                                onChange={(nextIndex) =>
                                  onChange((current) => ({
                                    ...current,
                                    submodules: current.submodules.map((item) =>
                                      item.id === activeSubmodule.id
                                        ? {
                                            ...item,
                                            exerciseGroups: moveItem(
                                              item.exerciseGroups,
                                              groupIndex,
                                              nextIndex,
                                            ),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                              <button
                                type="button"
                                disabled={groupIndex === 0}
                                onClick={() =>
                                  onChange((current) => ({
                                    ...current,
                                    submodules: current.submodules.map((item) =>
                                      item.id === activeSubmodule.id
                                        ? { ...item, exerciseGroups: moveItem(item.exerciseGroups, groupIndex, groupIndex - 1) }
                                        : item,
                                    ),
                                  }))
                                }
                                className="rounded-[0.7rem] border border-[#eadfca] bg-[#fff8f1] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Monter
                              </button>
                              <button
                                type="button"
                                disabled={groupIndex === activeSubmodule.exerciseGroups.length - 1}
                                onClick={() =>
                                  onChange((current) => ({
                                    ...current,
                                    submodules: current.submodules.map((item) =>
                                      item.id === activeSubmodule.id
                                        ? { ...item, exerciseGroups: moveItem(item.exerciseGroups, groupIndex, groupIndex + 1) }
                                        : item,
                                    ),
                                  }))
                                }
                                className="rounded-[0.7rem] border border-[#eadfca] bg-[#fff8f1] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Descendre
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange((current) => ({
                                    ...current,
                                    submodules: current.submodules.map((item) =>
                                      item.id === activeSubmodule.id
                                        ? { ...item, exerciseGroups: item.exerciseGroups.filter((candidate) => candidate.id !== group.id) }
                                        : item,
                                    ),
                                  }))
                                }
                                className="text-xs font-black uppercase tracking-[0.12em] text-[#b45247]"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>

                          <MoveToSubmoduleControl
                            title="Deplacer cet exercice"
                            helper="L'exercice entier sera ajoute a la fin du sous-module cible."
                            availableTargets={module.submodules
                              .filter((submodule) => submodule.id !== activeSubmodule.id)
                              .map((submodule, submoduleIndex) => ({
                                id: submodule.id,
                                label: `Sous-module ${submoduleIndex + 1} - ${submodule.title || `Sous-module ${submoduleIndex + 1}`}`,
                              }))}
                            buttonLabel="Deplacer l'exercice"
                            onMove={(targetSubmoduleId) =>
                              onChange((current) =>
                                moveExerciseGroupToSubmodule(
                                  current,
                                  activeSubmodule.id,
                                  group.id,
                                  targetSubmoduleId,
                                ),
                              )
                            }
                          />

                          <div className="mt-4 rounded-[0.9rem] border border-[#eadfca] bg-[#fff8f1] p-4">
                            <label className="space-y-2">
                              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">Nombre de questions</span>
                              <input
                                type="number"
                                min={1}
                                value={group.questions.length}
                                onChange={(event) => {
                                  const nextCount = Math.max(1, Number(event.target.value) || 1);

                                  onChange((current) =>
                                    updateGroupInModule(current, activeSubmodule.id, group.id, (currentGroup) => {
                                      if (nextCount === currentGroup.questions.length) return currentGroup;
                                      if (nextCount < currentGroup.questions.length) {
                                        return { ...currentGroup, questions: currentGroup.questions.slice(0, nextCount) };
                                      }

                                      return {
                                        ...currentGroup,
                                        questions: [
                                          ...currentGroup.questions,
                                          ...Array.from(
                                            { length: nextCount - currentGroup.questions.length },
                                            () => createEmptyQuestion(),
                                          ),
                                        ],
                                      };
                                    }),
                                  );
                                }}
                                className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                              />
                            </label>
                            <p className="mt-3 text-sm leading-6 text-[#8a8077]">Chaque question de cet exercice peut avoir son propre type.</p>
                          </div>

                          <div className="mt-4 space-y-4">
                            {group.questions.map((question, questionIndex) => (
                              <QuestionCard
                                key={question.id}
                                question={question}
                                questionIndex={questionIndex}
                                questionCount={group.questions.length}
                                availableSubmoduleTargets={module.submodules
                                  .filter((submodule) => submodule.id !== activeSubmodule.id)
                                  .map((submodule, submoduleIndex) => ({
                                    id: submodule.id,
                                    label: `Sous-module ${submoduleIndex + 1} - ${submodule.title || `Sous-module ${submoduleIndex + 1}`}`,
                                  }))}
                                onMoveUp={() =>
                                  onChange((current) =>
                                    updateGroupInModule(current, activeSubmodule.id, group.id, (currentGroup) => ({
                                      ...currentGroup,
                                      questions: moveItem(currentGroup.questions, questionIndex, questionIndex - 1),
                                    })),
                                  )
                                }
                                onMoveDown={() =>
                                  onChange((current) =>
                                    updateGroupInModule(current, activeSubmodule.id, group.id, (currentGroup) => ({
                                      ...currentGroup,
                                      questions: moveItem(currentGroup.questions, questionIndex, questionIndex + 1),
                                    })),
                                  )
                                }
                                onMoveToIndex={(nextIndex) =>
                                  onChange((current) =>
                                    updateGroupInModule(
                                      current,
                                      activeSubmodule.id,
                                      group.id,
                                      (currentGroup) => ({
                                        ...currentGroup,
                                        questions: moveItem(
                                          currentGroup.questions,
                                          questionIndex,
                                          nextIndex,
                                        ),
                                      }),
                                    ),
                                  )
                                }
                                onMoveToSubmodule={(targetSubmoduleId) =>
                                  onChange((current) =>
                                    moveQuestionToSubmodule(
                                      current,
                                      activeSubmodule.id,
                                      group.id,
                                      question.id,
                                      targetSubmoduleId,
                                    ),
                                  )
                                }
                                onDelete={() =>
                                  onChange((current) =>
                                    updateGroupInModule(current, activeSubmodule.id, group.id, (currentGroup) => ({
                                      ...currentGroup,
                                      questions:
                                        currentGroup.questions.length === 1
                                          ? [createEmptyQuestion()]
                                          : currentGroup.questions.filter((candidate) => candidate.id !== question.id),
                                    })),
                                  )
                                }
                                onChange={(updater) =>
                                  onChange((current) =>
                                    updateQuestionInModule(current, activeSubmodule.id, group.id, question.id, updater),
                                  )
                                }
                              />
                            ))}
                          </div>

                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() =>
                                onChange((current) =>
                                  updateGroupInModule(current, activeSubmodule.id, group.id, (currentGroup) => ({
                                    ...currentGroup,
                                    questions: [...currentGroup.questions, createEmptyQuestion()],
                                  })),
                                )
                              }
                              className="rounded-[0.8rem] border border-[#eadfca] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]"
                            >
                              Ajouter une question
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-[#eadfca] bg-white px-5 py-6 text-sm leading-6 text-[#8a8077]">
                  Aucun sous-module pour le moment.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                className="flex h-12 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white"
              >
                {submitLabel}
              </button>

              {module.id ? (
                <button
                  type="submit"
                  formAction={deleteAdminModule}
                  className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#b45247]"
                >
                  Supprimer ce module
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminModuleEditor({ modules }: { modules: AdminModule[] }) {
  const nextPosition =
    modules.length === 0 ? 1 : Math.max(...modules.map((module) => module.position)) + 1;
  const [managedModules, setManagedModules] = useState<ManagedEditorModule[]>(() => [
    {
      key: "new-module",
      heading: "Nouveau module",
      submitLabel: "Creer le module",
      value: createEmptyModule(nextPosition),
      defaultOpen: true,
    },
    ...modules.map((module) => ({
      key: `module-${module.id}`,
      heading: `Modifier ${module.title}`,
      submitLabel: "Mettre a jour le module",
      value: toEditorModule(module),
      defaultOpen: false,
    })),
  ]);

  function updateManagedModule(
    moduleKey: string,
    updater: (module: EditorModule) => EditorModule,
  ) {
    setManagedModules((current) =>
      current.map((module) =>
        module.key === moduleKey
          ? {
              ...module,
              value: updater(module.value),
            }
          : module,
      ),
    );
  }

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 px-2 sm:px-0">
      {managedModules.map((module) => (
        <ModuleForm
          key={module.key}
          module={module.value}
          heading={module.heading}
          submitLabel={module.submitLabel}
          defaultOpen={module.defaultOpen}
          onChange={(updater) => updateManagedModule(module.key, updater)}
        />
      ))}
    </div>
  );
}
