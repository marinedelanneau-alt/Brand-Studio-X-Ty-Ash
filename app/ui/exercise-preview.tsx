import {
  cleanStoredExerciseQuestionText,
  getStaticTextHtml,
  getAnswerPlaceholderItems,
  getFillBlankCount,
  getPromptOpenLabel,
  parseChecklistEntries,
  parseColorOption,
  parseStoredExerciseQuestionConfig,
  parseStoredImageUploadConfig,
  parseStoredTableConfig,
  parseStoredTablePlaceholders,
  resolveStoredExerciseOptions,
  splitFillBlankText,
  type ExerciseType,
} from "@/lib/exercise-types";
import { getActiveBrandPersonaSections, parseStoredBrandPersonaConfig } from "@/lib/brand-persona";
import { getDefaultSpectrumAnswer, parseStoredSpectrumConfig } from "@/lib/spectrum";
import {
  getPaletteColorCss,
  parseStoredColorPaletteConfig,
} from "@/lib/color-palette";
import { normalizeVisibleContent } from "@/lib/pedagogical-content";
import PedagogicalContent from "./pedagogical-content";
import VoiceNotePlayer from "./voice-note-player";

type PreviewExercise = {
  id: string | number;
  type: ExerciseType;
  explanation: string;
  answer_placeholder: string;
  audio_url?: string | null;
  audio_transcript?: string | null;
  question: string;
  options: string[];
};

function getVisibleOptions(exercise: PreviewExercise) {
  return resolveStoredExerciseOptions(exercise.type, exercise.options);
}

function getQuestionPrompts(exercise: PreviewExercise) {
  return parseStoredExerciseQuestionConfig(exercise.type, exercise.options).items;
}

function getQuestionColumns(exercise: PreviewExercise) {
  const config = parseStoredExerciseQuestionConfig(exercise.type, exercise.options);
  return Math.max(config.items.length > 0 ? config.columns : 1, 1);
}

function isPassiveContentType(type: ExerciseType) {
  return type === "static_text" || type === "popup_message";
}

function isDuplicateVisibleText(
  value: string | null | undefined,
  candidates: Array<string | null | undefined>,
) {
  const normalizedValue = normalizeVisibleContent(value);

  if (!normalizedValue) {
    return false;
  }

  return candidates.some(
    (candidate) => normalizeVisibleContent(candidate) === normalizedValue,
  );
}

function PreviewPopupMessage({ exercise }: { exercise: PreviewExercise }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-5 shadow-[0_22px_60px_rgba(120,92,56,0.14)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgb(var(--tyash-glow-rgb)/0.32),transparent_42%),radial-gradient(circle_at_bottom_right,rgb(var(--tyash-glow-rgb)/0.18),transparent_38%)]" />
      <div className="relative rounded-[1.6rem] border border-[var(--surface-highlight)]/80 bg-[var(--card)]/88 p-6 shadow-[inset_0_1px_0_rgb(var(--tyash-highlight-rgb)/0.85)] backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.24em] text-[var(--tyash-label-text)]">
              Pop-up inspiration
            </p>
            <p className="mt-2 font-[family:var(--font-cormorant)] text-[2.2rem] leading-[0.95] text-[var(--heading-color)]">
              Une respiration dans le parcours
            </p>
          </div>
          <button
            type="button"
            disabled
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]/90 text-lg text-[var(--text-muted)] opacity-80"
          >
            x
          </button>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-[var(--card)]/95 px-6 py-7 shadow-[inset_0_1px_0_rgb(var(--tyash-highlight-rgb)/0.9)]">
          <p className="text-4xl leading-none text-[var(--tyash-label-text)]/60">&quot;</p>
          <div
            className="module-content mt-2 max-w-none font-[family:var(--font-cormorant)] text-[2rem] leading-[1.15] text-[var(--heading-color)] sm:text-[2.35rem]"
            dangerouslySetInnerHTML={{ __html: getStaticTextHtml(exercise.question) }}
          />
          {exercise.explanation ? (
            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {exercise.explanation}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled
            className="rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--text-primary)] opacity-80"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewTextInput({ placeholder }: { placeholder: string }) {
  return (
    <input
      type="text"
      readOnly
      value=""
      placeholder={placeholder || "Ta réponse"}
      className="w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base text-[var(--text-primary)]"
    />
  );
}

function PreviewTextarea({ placeholder }: { placeholder: string }) {
  return (
    <textarea
      readOnly
      value=""
      placeholder={placeholder || "Ta réponse"}
      className="min-h-24 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base text-[var(--text-primary)]"
    />
  );
}

function PreviewChoiceGroup({
  exercise,
  prompt,
  inputType,
}: {
  exercise: PreviewExercise;
  prompt?: string;
  inputType: "radio" | "checkbox";
}) {
  const visibleOptions = getVisibleOptions(exercise);
  const options =
    exercise.type === "boolean" && visibleOptions.length === 0
      ? ["Oui", "Non"]
      : visibleOptions;

  return (
    <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-4">
      {prompt ? <p className="text-sm font-semibold leading-7 text-[var(--text-primary)]">{prompt}</p> : null}
      <div className={prompt ? "mt-3 space-y-3" : "space-y-3"}>
        {options.map((option) => (
          <label
            key={`${exercise.id}-${inputType}-${option}`}
            className="flex items-start gap-3 border-b border-[var(--border)] px-1 py-3 text-sm leading-6 text-[var(--text-primary)] last:border-b-0"
          >
            <input type={inputType} disabled className="mt-1" />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function PreviewColorChoice({ exercise, prompt }: { exercise: PreviewExercise; prompt?: string }) {
  const options = getVisibleOptions(exercise);

  return (
    <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-4">
      {prompt ? <p className="text-sm font-semibold leading-7 text-[var(--text-primary)]">{prompt}</p> : null}
      <div className={prompt ? "mt-3 grid gap-3" : "grid gap-3"}>
        {options.map((option) => {
          const colorOption = parseColorOption(option);

          return (
            <label
              key={`${exercise.id}-color-${option}`}
              className="flex items-center gap-4 rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)]"
            >
              <input type="radio" disabled className="sr-only" />
              <span
                className="h-12 w-12 rounded-full border border-[var(--surface-highlight)] shadow-[0_0_0_1px_rgba(75,69,80,0.16)]"
                style={{ backgroundColor: colorOption.color }}
              />
              <span className="flex-1">
                <span className="block font-semibold">{colorOption.label}</span>
                <span className="block text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  {colorOption.color}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function PreviewChecklist({ exercise, prompt }: { exercise: PreviewExercise; prompt?: string }) {
  const seededEntries =
    parseChecklistEntries(exercise.options).length > 0
      ? parseChecklistEntries(exercise.options)
      : [
          { label: "Inspiration", checked: false },
          { label: "Territoire de marque", checked: true },
        ];

  return (
    <div className="space-y-3 rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-4">
      {prompt ? <p className="text-sm font-semibold leading-7 text-[var(--text-primary)]">{prompt}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          readOnly
          value=""
          placeholder={exercise.answer_placeholder || "Ajouter un mot ou une idée"}
          className="h-12 flex-1 rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4 text-base text-[var(--text-primary)]"
        />
        <button
          type="button"
          disabled
          className="flex h-12 items-center justify-center rounded-[0.9rem] border border-[var(--border)] bg-[var(--tyash-subtle)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--text-primary)] opacity-70"
        >
          Ajouter
        </button>
      </div>

      {seededEntries.map((entry, entryIndex) => (
        <label
          key={`${exercise.id}-checklist-${entry.label}-${entryIndex}`}
          className={`flex items-center gap-4 rounded-[1rem] border px-4 py-3 ${
            entry.checked ? "border-[var(--tyash-primary)] bg-[var(--tyash-soft)]" : "border-[var(--border)] bg-[var(--card)]"
          }`}
        >
          <input type="checkbox" disabled checked={entry.checked} />
          <span className={entry.checked ? "font-semibold text-[var(--heading-color)]" : "text-[var(--text-primary)]"}>
            {entry.label}
          </span>
        </label>
      ))}
    </div>
  );
}

function PreviewTable({ exercise }: { exercise: PreviewExercise }) {
  const prompts = getQuestionPrompts(exercise);
  const tableConfig = parseStoredTableConfig(exercise.options);
  const tablePlaceholders = parseStoredTablePlaceholders(
    exercise.options,
    tableConfig.rows * tableConfig.columns,
    exercise.answer_placeholder,
  );
  const rowLabels = Array.from(
    { length: tableConfig.rows },
    (_, rowIndex) => tableConfig.rowLabels[rowIndex] ?? "",
  );
  const columnLabels = Array.from(
    { length: tableConfig.columns },
    (_, columnIndex) => tableConfig.columnLabels[columnIndex] ?? "",
  );

  return (
    <div
      className="grid gap-4 md:[grid-template-columns:var(--question-columns)]"
      style={{
        ["--question-columns" as string]: `repeat(${Math.max(
          prompts.length > 0 ? getQuestionColumns(exercise) : 1,
          1,
        )}, minmax(0, 1fr))`,
      }}
    >
      {(prompts.length > 0 ? prompts : [""]).map((prompt, questionIndex) => (
        <div key={`${exercise.id}-table-${questionIndex}`}>
          {prompt ? <p className="mb-3 text-sm font-semibold leading-7 text-[var(--text-primary)]">{prompt}</p> : null}
          <div className="overflow-x-auto rounded-[1rem] border border-[var(--border)] bg-[var(--card)]">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[var(--tyash-subtle)]">
                  <th className="border-b border-r border-[var(--border)] px-4 py-3 text-left text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Lignes
                  </th>
                  {columnLabels.map((columnLabel, columnIndex) => (
                    <th
                      key={`${exercise.id}-column-${questionIndex}-${columnIndex}`}
                      className="min-w-40 border-b border-[var(--border)] px-4 py-3 text-left text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]"
                    >
                      {columnLabel || `Colonne ${columnIndex + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowLabels.map((rowLabel, rowIndex) => (
                  <tr key={`${exercise.id}-row-${questionIndex}-${rowIndex}`}>
                    <th className="border-b border-r border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)]">
                      {rowLabel || `Ligne ${rowIndex + 1}`}
                    </th>
                    {columnLabels.map((_, columnIndex) => {
                      const cellIndex = rowIndex * tableConfig.columns + columnIndex;

                      return (
                        <td
                          key={`${exercise.id}-cell-${questionIndex}-${rowIndex}-${columnIndex}`}
                          className="border-b border-[var(--border)] px-3 py-3"
                        >
                          <textarea
                            readOnly
                            value=""
                            rows={3}
                            placeholder={
                              tablePlaceholders[cellIndex] ||
                              exercise.answer_placeholder ||
                              undefined
                            }
                            className="min-h-24 w-full resize-none rounded-[0.8rem] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewImageUpload({ exercise }: { exercise: PreviewExercise }) {
  const config = parseStoredImageUploadConfig(exercise.options);
  const previewCount = Math.min(Math.max(config.maxImages, 4), 6);

  return (
    <div className="space-y-4">
      <div className="rounded-[1.4rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[var(--tyash-label-text)]">
              Tableau d&apos;inspiration
            </p>
            <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2rem] leading-[0.95] text-[var(--heading-color)]">
              Upload d&apos;images simple
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-primary)]">
              L&apos;utilisateur ajoute seulement les images demandees dans la question.
            </p>
          </div>
          <div className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {previewCount} a {config.maxImages} images
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["editorial", "minimal", "collage", "grid", "bold"].map((style) => (
            <span
              key={style}
              className={`rounded-full px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.14em] ${
                style === "editorial"
                  ? "bg-[var(--tyash-primary)] text-[var(--tyash-text-on-primary)]"
                  : "border border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)]"
              }`}
            >
              {style}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-[var(--border)] bg-[linear-gradient(145deg,#f8ecdf,#e3c79d_52%,#8f98a9)] p-4 shadow-[0_20px_46px_rgba(210,189,152,0.14)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.3rem] border border-[var(--surface-highlight)]/70 bg-white/20 p-2">
          <div className="absolute left-[4%] top-[5%] h-[29%] w-[38%] rotate-[-4deg] overflow-hidden rounded-[1.1rem] border border-[var(--surface-highlight)]/70 bg-[var(--card)] shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <div className="h-full w-full bg-[linear-gradient(145deg,#efe3d2,#d4b07d,#5a6474)]" />
          </div>
          <div className="absolute left-[46%] top-[6%] h-[20%] w-[48%] rotate-[2deg] overflow-hidden rounded-[1.1rem] border border-[var(--surface-highlight)]/70 bg-[var(--card)] shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <div className="flex h-full items-end bg-[linear-gradient(135deg,#f5efe6,#cfa36a,#7a8496)] px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-white">
              Editorial light
            </div>
          </div>
          <div className="absolute left-[8%] top-[40%] h-[22%] w-[24%] rotate-[3deg] overflow-hidden rounded-[1.1rem] border border-[var(--surface-highlight)]/80 bg-[var(--card)] px-4 py-4 shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Couleur</p>
            <div className="mt-3 h-16 rounded-[0.9rem] bg-[var(--border)]" />
          </div>
          <div className="absolute left-[35%] top-[38%] h-[18%] w-[30%] rotate-[-2deg] overflow-hidden rounded-[1.1rem] border border-[var(--surface-highlight)]/80 bg-[var(--card)] px-4 py-4 shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-[var(--heading-color)]">Lumiere</p>
          </div>
          <div className="absolute left-[68%] top-[33%] h-[30%] w-[24%] rotate-[4deg] overflow-hidden rounded-[1.1rem] border border-[var(--surface-highlight)]/70 bg-[linear-gradient(145deg,#f5efe6,#d7b486,#69788c)] shadow-[0_18px_36px_rgba(71,52,33,0.14)]" />
          <div className="absolute left-[7%] top-[68%] h-[16%] w-[26%] rotate-[-2deg] overflow-hidden rounded-[1.1rem] border border-[var(--surface-highlight)]/80 bg-[var(--card)] px-4 py-4 shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <p className="font-[family:var(--font-cormorant)] text-[1.3rem] italic leading-none text-[var(--heading-color)]">
              Une présence douce et structurée.
            </p>
          </div>
          <div className="absolute left-[36%] top-[66%] h-[15%] w-[26%] rotate-[1deg] overflow-hidden rounded-[1.1rem] border border-[var(--surface-highlight)]/70 bg-[linear-gradient(145deg,#f7efe4,#d7b486,#8a938f)] shadow-[0_18px_36px_rgba(71,52,33,0.14)]" />
          <div className="absolute left-[66%] top-[68%] h-[14%] w-[26%] rotate-[-1deg] overflow-hidden rounded-[1.1rem] border border-[var(--surface-highlight)]/80 bg-[var(--card)] px-4 py-4 shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Export PNG / PDF
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: previewCount }, (_, index) => (
          <div
            key={`${exercise.id}-image-slot-${index}`}
            className="group relative aspect-square overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[0_18px_42px_rgba(210,189,152,0.12)]"
          >
            <div className="flex h-full items-center justify-center rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 text-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[0_10px_24px_rgba(210,189,152,0.12)]">
                <span>+</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewBrandPersona({ exercise }: { exercise: PreviewExercise }) {
  const config = parseStoredBrandPersonaConfig(exercise.options);
  const sections = getActiveBrandPersonaSections(config);

  return (
    <div className="space-y-4">
      <div className="rounded-[1.4rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-5">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[var(--tyash-label-text)]">
          Persona de marque
        </p>
        <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2rem] leading-[0.95] text-[var(--heading-color)]">
          {exercise.question || "Crée le persona incarné de ta marque"}
        </h3>
        {exercise.explanation ? (
          <PedagogicalContent
            content={exercise.explanation}
            className="mt-5 rounded-[1rem] border border-[var(--border)] bg-[var(--tyash-subtle)] px-4 py-4"
          />
        ) : null}
      </div>

      {sections.map((section) => (
        <div
          key={section.id}
          className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card)] px-5 py-5"
        >
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[var(--tyash-label-text)]">
            {section.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            {section.description}
          </p>
          <div className="mt-4 space-y-3">
            {section.questions.map((question) => (
              <div
                key={question.id}
                className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-7 text-[var(--text-primary)]">
                      {question.label}
                    </p>
                    {question.helperText ? (
                      <p className="text-sm leading-6 text-[var(--text-muted)]">
                        {question.helperText}
                      </p>
                    ) : null}
                  </div>
                  {question.example ? (
                    <span className="rounded-full bg-[var(--tyash-soft)] px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[var(--tyash-label-text)]">
                      Ex. {question.example}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3">
                  {question.fieldType === "textarea" ? (
                    <PreviewTextarea placeholder={question.placeholder} />
                  ) : question.fieldType === "select" ? (
                    <select
                      disabled
                      className="h-12 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4 text-base text-[var(--text-primary)]"
                    >
                      <option>Choisir une option</option>
                      {question.options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : question.fieldType === "checkbox" ? (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-3 rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)]"
                        >
                          <input type="checkbox" disabled />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <PreviewTextInput placeholder={question.placeholder} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewSpectrum({ exercise }: { exercise: PreviewExercise }) {
  const config = parseStoredSpectrumConfig(exercise.options);
  const answer = getDefaultSpectrumAnswer(config);

  return (
    <div className="space-y-4 rounded-[1.4rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-5">
      <div className="flex items-center justify-between gap-4 text-sm font-semibold text-[var(--text-primary)]">
        <span className="inline-flex items-center gap-2">
          {config.leftEmoji ? <span aria-hidden="true">{config.leftEmoji}</span> : null}
          <span>{config.leftLabel}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span>{config.rightLabel}</span>
          {config.rightEmoji ? <span aria-hidden="true">{config.rightEmoji}</span> : null}
        </span>
      </div>

      <div className="relative px-2 py-4">
        <div className="h-2 rounded-full bg-[image:var(--tyash-progress-gradient)]" />
        <div
          className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-[var(--surface-highlight)] bg-[image:var(--tyash-progress-gradient)] shadow-[0_12px_24px_rgb(var(--tyash-glow-rgb)/0.28)]"
          style={{ left: `calc(${answer.score}% - 0.75rem)` }}
        />
      </div>

      <p className="text-sm leading-6 text-[var(--text-muted)]">{config.helperText}</p>
      <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-4">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[var(--tyash-label-text)]">
          Interpretation
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{answer.interpretation}</p>
      </div>
      {config.enableJustification ? (
        <textarea
          readOnly
          placeholder="Pourquoi ce positionnement ?"
          className="min-h-24 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base text-[var(--text-primary)]"
        />
      ) : null}
    </div>
  );
}

function PreviewColorPalette({ exercise }: { exercise: PreviewExercise }) {
  const config = parseStoredColorPaletteConfig(exercise.options);
  const seededPrimary = config.exampleColors.filter((item) => item.type === "primary").slice(0, 2);
  const seededSecondary = config.exampleColors
    .filter((item) => item.type === "secondary")
    .slice(0, 3);

  return (
    <div className="space-y-4 rounded-[1.4rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-5">
      <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card)] px-5 py-5">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[var(--tyash-label-text)]">
          Palette de couleurs
        </p>
        <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2rem] leading-[0.96] text-[var(--heading-color)]">
          {exercise.question || "Construis la palette de couleurs de ta marque"}
        </h3>
        {exercise.explanation ? (
          <PedagogicalContent
            content={exercise.explanation}
            className="mt-5 rounded-[1rem] border border-[var(--border)] bg-[var(--tyash-subtle)] px-4 py-4"
          />
        ) : null}
        <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{config.helperText}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PreviewPaletteCard
          title="Couleurs principales"
          helper={`Jusqu'à ${config.maxPrimaryColors} couleurs principales.`}
          items={seededPrimary.map((item) => ({
            id: item.id,
            mode: "solid" as const,
            name: item.name,
            hex: item.hex,
            usage: item.usage,
          }))}
        />
        <PreviewPaletteCard
          title="Couleurs secondaires"
          helper={`Jusqu'à ${config.maxSecondaryColors} couleurs secondaires.`}
          items={seededSecondary.map((item) => ({
            id: item.id,
            mode: "solid" as const,
            name: item.name,
            hex: item.hex,
            usage: item.usage,
          }))}
        />
      </div>

      <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Aperçu du picker
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mx-auto max-w-[22rem]">
              <div className="aspect-square rounded-[1.1rem] bg-[linear-gradient(to_top,black,transparent),linear-gradient(to_right,white,transparent),hsl(44_89%_60%)]" />
              <div className="mt-4 h-3 rounded-full bg-[linear-gradient(90deg,#ff0000,#ffff00,#00ff66,#00a3ff,#5b00ff,#ff0090,#ff0000)]" />
            </div>
          </div>
          <div className="space-y-3 rounded-[1.2rem] border border-[var(--border)] bg-[var(--card)] p-4">
            <div
              className="h-28 rounded-[1rem] border border-[var(--border)]"
              style={{ background: seededPrimary[0]?.hex ?? "#EFE8D0" }}
            />
            <input
              readOnly
              value={seededPrimary[0]?.hex ?? "#EFE8D0"}
              className="h-12 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 text-base text-[var(--text-primary)]"
              aria-label="Code HEX"
            />
            {config.allowGradient ? (
              <div
                className="h-16 rounded-[1rem] border border-[var(--border)]"
                style={{
                  background:
                    "linear-gradient(90deg, #EFE8D0 0%, #F3C447 100%)",
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-sm leading-7 text-[var(--text-primary)]">
        Réponse sauvegardée sous forme d&apos;un objet `color_palette` avec listes
        `primaryColors` et `secondaryColors`.
      </div>
    </div>
  );
}

function PreviewPaletteCard({
  title,
  helper,
  items,
}: {
  title: string;
  helper: string;
  items: Array<{
    id: string;
    mode: "solid";
    name: string;
    hex: string;
    usage: string;
  }>;
}) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{helper}</p>
      <div className="mt-4 grid gap-3">
        {(items.length > 0
          ? items
          : [
              {
                id: "preview-placeholder",
                mode: "solid" as const,
                name: "Couleur d'exemple",
                hex: "#EFE8D0",
                usage: "Usage de la couleur",
              },
            ]).map((item, index) => (
          <div
            key={item.id || index}
            className="grid gap-3 rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-[4.5rem_minmax(0,1fr)]"
          >
            <div
              className="h-14 rounded-[0.9rem] border border-[var(--border)]"
              style={{ background: getPaletteColorCss(item) }}
            />
            <div>
              <p className="text-sm font-semibold leading-6 text-[var(--text-primary)]">
                {item.name || "Couleur"}
              </p>
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {item.hex}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-primary)]">
                {item.usage || "Usage de la couleur"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewEditorialCalendar() {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">
            Calendrier éditorial
          </p>
          <p className="mt-1 text-xl font-semibold text-[var(--heading-color)]">Vue Notion 2026</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--text-primary)]">
          Notion
        </span>
      </div>
      <div className="bg-[var(--background)] p-4">
        <div className="flex min-h-52 items-center justify-center rounded-[1rem] border border-dashed border-[var(--border)] bg-[var(--card)] px-6 text-center">
          <p className="max-w-md text-sm leading-7 text-[var(--text-primary)]">
            L&apos;exercice affichera le calendrier éditorial 2026 réalisé dans Notion, avec un accès
            direct pour l&apos;ouvrir dans un nouvel onglet.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ExercisePreview({ exercise }: { exercise: PreviewExercise }) {
  const prompts = getQuestionPrompts(exercise);
  const displayQuestion = cleanStoredExerciseQuestionText(exercise.question);
  const showMainQuestion =
    exercise.type !== "prompt_open" &&
    exercise.type !== "brand_persona" &&
    exercise.type !== "color_palette" &&
    exercise.type !== "editorial_calendar" &&
    !isPassiveContentType(exercise.type) &&
    exercise.type !== "fill_blank" &&
    exercise.type !== "group_open" &&
    displayQuestion.length > 0;

  return (
    <div className="space-y-4">
      {!isPassiveContentType(exercise.type) ? (
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Aperçu de l&apos;exercice
        </p>
      ) : null}

      {exercise.explanation &&
      !isPassiveContentType(exercise.type) &&
      !isDuplicateVisibleText(exercise.explanation, [displayQuestion]) ? (
        exercise.type === "color_palette" ? null : (
        <PedagogicalContent
          content={exercise.explanation}
          className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card)]/82 px-5 py-5"
        />
        )
      ) : null}

      <VoiceNotePlayer
        src={exercise.audio_url}
        subtitles={exercise.audio_transcript}
      />

      {showMainQuestion ? (
        <p className="text-base leading-7 text-[var(--text-primary)]">{displayQuestion}</p>
      ) : null}

      {exercise.type === "static_text" ? (
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--surface-highlight)]/90 bg-[var(--card)] px-6 py-6 shadow-[0_16px_38px_rgba(126,102,78,0.08),0_2px_10px_rgb(var(--tyash-glow-rgb)/0.06)] ring-1 ring-[#f3e5d2]/80 sm:px-7 sm:py-7">
          <div
            className="module-content relative max-w-none text-[1rem] leading-8 text-[var(--text-primary)] sm:text-[1.06rem]"
            dangerouslySetInnerHTML={{ __html: getStaticTextHtml(exercise.question) }}
          />
        </div>
      ) : null}

      {exercise.type === "popup_message" ? <PreviewPopupMessage exercise={exercise} /> : null}
      {exercise.type === "image_upload" ? <PreviewImageUpload exercise={exercise} /> : null}
      {exercise.type === "moodboard" ? <PreviewImageUpload exercise={exercise} /> : null}
      {exercise.type === "editorial_calendar" ? <PreviewEditorialCalendar /> : null}
      {exercise.type === "brand_persona" ? <PreviewBrandPersona exercise={exercise} /> : null}
      {exercise.type === "spectrum" ? <PreviewSpectrum exercise={exercise} /> : null}
      {exercise.type === "color_palette" ? <PreviewColorPalette exercise={exercise} /> : null}

      {exercise.type === "open" ? (
        prompts.length > 0 ? (
          <div
            className="grid gap-4 md:[grid-template-columns:var(--question-columns)]"
            style={{
              ["--question-columns" as string]: `repeat(${getQuestionColumns(
                exercise,
              )}, minmax(0, 1fr))`,
            }}
          >
            {prompts.map((prompt, questionIndex) => (
              <label
                key={`${exercise.id}-open-${questionIndex}`}
                className="block rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-4"
              >
                <span className="block text-sm font-semibold leading-7 text-[var(--text-primary)]">{prompt}</span>
                <div className="mt-3">
                  <PreviewTextarea placeholder={exercise.answer_placeholder} />
                </div>
              </label>
            ))}
          </div>
        ) : (
          <PreviewTextarea placeholder={exercise.answer_placeholder} />
        )
      ) : null}

      {exercise.type === "group_open" ? (
        <div
          className="grid gap-4 md:[grid-template-columns:var(--question-columns)]"
          style={{
            ["--question-columns" as string]: `repeat(${getQuestionColumns(
              exercise,
            )}, minmax(0, 1fr))`,
          }}
        >
          {prompts.map((prompt, questionIndex) => (
            <label
              key={`${exercise.id}-group-open-${questionIndex}`}
              className="block rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-4"
            >
              <span className="block text-sm font-semibold leading-7 text-[var(--text-primary)]">{prompt}</span>
              <div className="mt-3">
                <PreviewTextarea placeholder={exercise.answer_placeholder} />
              </div>
            </label>
          ))}
        </div>
      ) : null}

      {exercise.type === "prompt_open" ? (
        prompts.length > 0 ? (
          <div
            className="grid gap-4 md:[grid-template-columns:var(--question-columns)]"
            style={{
              ["--question-columns" as string]: `repeat(${getQuestionColumns(
                exercise,
              )}, minmax(0, 1fr))`,
            }}
          >
            {prompts.map((prompt, questionIndex) => (
              <label
                key={`${exercise.id}-prompt-open-${questionIndex}`}
                className="block rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-4"
              >
                <span className="mt-2 block font-[family:var(--font-cormorant)] text-[1.8rem] font-semibold leading-none text-[var(--heading-color)]">
                  {prompt}
                </span>
                <div className="mt-3">
                  <PreviewTextInput placeholder={exercise.answer_placeholder || "Ta réponse"} />
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="border-l border-[var(--border)] pl-4">
            <div className="flex flex-wrap items-center gap-3 text-[var(--heading-color)]">
              <span className="font-[family:var(--font-cormorant)] text-[2rem] font-semibold leading-none text-[var(--heading-color)] sm:text-[2.35rem]">
                {getPromptOpenLabel(displayQuestion)}
              </span>
              <span className="text-[1.7rem] font-semibold leading-none text-[#355f9d]">:</span>
              <div className="min-w-64 flex-1">
                <PreviewTextInput placeholder={exercise.answer_placeholder || "Ta réponse"} />
              </div>
            </div>
          </div>
        )
      ) : null}

      {exercise.type === "single" ? (
        prompts.length > 0 ? (
          <div
            className="grid gap-4 md:[grid-template-columns:var(--question-columns)]"
            style={{
              ["--question-columns" as string]: `repeat(${getQuestionColumns(
                exercise,
              )}, minmax(0, 1fr))`,
            }}
          >
            {prompts.map((prompt, questionIndex) => (
              <PreviewChoiceGroup
                key={`${exercise.id}-single-preview-${questionIndex}`}
                exercise={exercise}
                prompt={prompt}
                inputType="radio"
              />
            ))}
          </div>
        ) : (
          <PreviewChoiceGroup exercise={exercise} inputType="radio" />
        )
      ) : null}

      {exercise.type === "boolean" ? (
        prompts.length > 0 ? (
          <div
            className="grid gap-4 md:[grid-template-columns:var(--question-columns)]"
            style={{
              ["--question-columns" as string]: `repeat(${getQuestionColumns(
                exercise,
              )}, minmax(0, 1fr))`,
            }}
          >
            {prompts.map((prompt, questionIndex) => (
              <PreviewChoiceGroup
                key={`${exercise.id}-boolean-preview-${questionIndex}`}
                exercise={exercise}
                prompt={prompt}
                inputType="radio"
              />
            ))}
          </div>
        ) : (
          <PreviewChoiceGroup exercise={exercise} inputType="radio" />
        )
      ) : null}

      {exercise.type === "multiple" ? (
        prompts.length > 0 ? (
          <div
            className="grid gap-4 md:[grid-template-columns:var(--question-columns)]"
            style={{
              ["--question-columns" as string]: `repeat(${getQuestionColumns(
                exercise,
              )}, minmax(0, 1fr))`,
            }}
          >
            {prompts.map((prompt, questionIndex) => (
              <PreviewChoiceGroup
                key={`${exercise.id}-multiple-preview-${questionIndex}`}
                exercise={exercise}
                prompt={prompt}
                inputType="checkbox"
              />
            ))}
          </div>
        ) : (
          <PreviewChoiceGroup exercise={exercise} inputType="checkbox" />
        )
      ) : null}

      {exercise.type === "color" ? (
        prompts.length > 0 ? (
          <div
            className="grid gap-4 md:[grid-template-columns:var(--question-columns)]"
            style={{
              ["--question-columns" as string]: `repeat(${getQuestionColumns(
                exercise,
              )}, minmax(0, 1fr))`,
            }}
          >
            {prompts.map((prompt, questionIndex) => (
              <PreviewColorChoice
                key={`${exercise.id}-color-preview-${questionIndex}`}
                exercise={exercise}
                prompt={prompt}
              />
            ))}
          </div>
        ) : (
          <PreviewColorChoice exercise={exercise} />
        )
      ) : null}

      {exercise.type === "checklist" ? (
        prompts.length > 0 ? (
          <div
            className="grid gap-4 md:[grid-template-columns:var(--question-columns)]"
            style={{
              ["--question-columns" as string]: `repeat(${Math.max(
                prompts.length,
                1,
              )}, minmax(0, 1fr))`,
            }}
          >
            {prompts.map((prompt, questionIndex) => (
              <PreviewChecklist
                key={`${exercise.id}-checklist-preview-${questionIndex}`}
                exercise={exercise}
                prompt={prompt}
              />
            ))}
          </div>
        ) : (
          <PreviewChecklist exercise={exercise} />
        )
      ) : null}

      {exercise.type === "fill_blank" ? (
        prompts.length > 0 ? (
          <div
            className="grid gap-4 md:[grid-template-columns:var(--question-columns)]"
            style={{
              ["--question-columns" as string]: `repeat(${getQuestionColumns(
                exercise,
              )}, minmax(0, 1fr))`,
            }}
          >
            {prompts.map((prompt, questionIndex) => {
              const placeholderItems = getAnswerPlaceholderItems(
                exercise.answer_placeholder,
                getFillBlankCount(prompt),
              );

              return (
                <div
                  key={`${exercise.id}-fill-preview-${questionIndex}`}
                  className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-base leading-8 text-[var(--text-primary)]"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Complete la phrase
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3">
                    {splitFillBlankText(prompt).map((part, index, parts) => (
                      <div key={`${exercise.id}-fill-part-${questionIndex}-${index}`} className="contents">
                        {part ? <span>{part}</span> : null}
                        {index < parts.length - 1 ? (
                          <input
                            type="text"
                            readOnly
                            value=""
                            placeholder={placeholderItems[index] || undefined}
                            className="min-w-28 flex-1 rounded-[0.8rem] border border-[var(--border)] bg-[var(--tyash-subtle)] px-3 py-2 text-sm text-[var(--text-primary)]"
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-base leading-8 text-[var(--text-primary)]">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Complete la phrase
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3">
              {splitFillBlankText(exercise.question).map((part, index, parts) => (
                <div key={`${exercise.id}-fill-base-${index}`} className="contents">
                  {part ? <span>{part}</span> : null}
                  {index < parts.length - 1 ? (
                    <input
                      type="text"
                      readOnly
                      value=""
                      placeholder={
                        getAnswerPlaceholderItems(
                          exercise.answer_placeholder,
                          getFillBlankCount(exercise.question),
                        )[index] || undefined
                      }
                      className="min-w-28 flex-1 rounded-[0.8rem] border border-[var(--border)] bg-[var(--tyash-subtle)] px-3 py-2 text-sm text-[var(--text-primary)]"
                    />
                  ) : null}
                </div>
              ))}
            </div>
            {getFillBlankCount(exercise.question) === 0 ? (
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                Ajoute `___` dans la question pour afficher les champs à compléter.
              </p>
            ) : null}
          </div>
        )
      ) : null}

      {exercise.type === "table" ? <PreviewTable exercise={exercise} /> : null}
    </div>
  );
}
