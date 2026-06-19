import {
  getAnswerPlaceholderItems,
  getFillBlankCount,
  getPromptOpenLabel,
  parseChecklistEntries,
  parseColorOption,
  parseStoredExerciseQuestionConfig,
  parseStoredImageUploadConfig,
  parseStoredTableConfig,
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

type PreviewExercise = {
  id: string | number;
  type: ExerciseType;
  explanation: string;
  answer_placeholder: string;
  audio_url?: string | null;
  question: string;
  options: string[];
};

function getQuestionPrompts(exercise: PreviewExercise) {
  return parseStoredExerciseQuestionConfig(exercise.type, exercise.options).items;
}

function getQuestionColumns(exercise: PreviewExercise) {
  const config = parseStoredExerciseQuestionConfig(exercise.type, exercise.options);
  return Math.max(config.items.length > 0 ? config.columns : 1, 1);
}

function getStaticTextHtml(content: string) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return "";
  }

  if (/<[^>]+>/.test(trimmedContent)) {
    return trimmedContent;
  }

  return trimmedContent
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replaceAll("\n", "<br />")}</p>`)
    .join("");
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
    <div className="relative overflow-hidden rounded-[2rem] border border-[#eadfca] bg-[linear-gradient(145deg,#fffaf2,#fff3df_55%,#fef8ef)] p-5 shadow-[0_22px_60px_rgba(120,92,56,0.14)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(240,207,85,0.32),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(207,116,48,0.18),transparent_38%)]" />
      <div className="relative rounded-[1.6rem] border border-white/80 bg-white/88 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.24em] text-[#cf7430]">
              Pop-up inspiration
            </p>
            <p className="mt-2 font-[family:var(--font-cormorant)] text-[2.2rem] leading-[0.95] text-[#4b4550]">
              Une respiration dans le parcours
            </p>
          </div>
          <button
            type="button"
            disabled
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca] bg-white/90 text-lg text-[#7b7068] opacity-80"
          >
            x
          </button>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(255,248,235,0.95),rgba(255,255,255,0.94))] px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <p className="text-4xl leading-none text-[#cf7430]/60">&quot;</p>
          <div
            className="module-content mt-2 max-w-none font-[family:var(--font-cormorant)] text-[2rem] leading-[1.15] text-[#2f3d4f] sm:text-[2.35rem]"
            dangerouslySetInnerHTML={{ __html: getStaticTextHtml(exercise.question) }}
          />
          {exercise.explanation ? (
            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#7a7087]">
              {exercise.explanation}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled
            className="rounded-full border border-[#eadfca] bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#6b625a] opacity-80"
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
      className="w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-base text-[#5f544a]"
    />
  );
}

function PreviewTextarea({ placeholder }: { placeholder: string }) {
  return (
    <textarea
      readOnly
      value=""
      placeholder={placeholder || "Ta réponse"}
      className="min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-base text-[#5f544a]"
    />
  );
}

function PreviewVoiceNote({ src }: { src?: string | null }) {
  if (!src?.trim()) {
    return null;
  }

  return (
    <div className="rounded-[1.2rem] border border-[#f0e4d3] bg-[#fffdf7] px-5 py-4">
      <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
        Note vocale
      </p>
      <audio controls preload="metadata" className="mt-3 w-full">
        <source src={src} type="audio/mpeg" />
        Votre navigateur ne peut pas lire cette note vocale.
      </audio>
    </div>
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
  const options =
    exercise.type === "boolean" && exercise.options.length === 0
      ? ["Oui", "Non"]
      : exercise.options;

  return (
    <div className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4">
      {prompt ? <p className="text-sm font-semibold leading-7 text-[#5f544a]">{prompt}</p> : null}
      <div className={prompt ? "mt-3 space-y-3" : "space-y-3"}>
        {options.map((option) => (
          <label
            key={`${exercise.id}-${inputType}-${option}`}
            className="flex items-start gap-3 border-b border-[#f0e5d4] px-1 py-3 text-sm leading-6 text-[#5f544a] last:border-b-0"
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
  return (
    <div className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4">
      {prompt ? <p className="text-sm font-semibold leading-7 text-[#5f544a]">{prompt}</p> : null}
      <div className={prompt ? "mt-3 grid gap-3" : "grid gap-3"}>
        {exercise.options.map((option) => {
          const colorOption = parseColorOption(option);

          return (
            <label
              key={`${exercise.id}-color-${option}`}
              className="flex items-center gap-4 rounded-[1rem] border border-[#eadfca] bg-white px-4 py-3 text-sm leading-6 text-[#5f544a]"
            >
              <input type="radio" disabled className="sr-only" />
              <span
                className="h-12 w-12 rounded-full border border-white shadow-[0_0_0_1px_rgba(75,69,80,0.16)]"
                style={{ backgroundColor: colorOption.color }}
              />
              <span className="flex-1">
                <span className="block font-semibold">{colorOption.label}</span>
                <span className="block text-xs uppercase tracking-[0.14em] text-[#8a8077]">
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
    <div className="space-y-3 rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4">
      {prompt ? <p className="text-sm font-semibold leading-7 text-[#5f544a]">{prompt}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          readOnly
          value=""
          placeholder={exercise.answer_placeholder || "Ajouter un mot ou une idée"}
          className="h-12 flex-1 rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-base text-[#5f544a]"
        />
        <button
          type="button"
          disabled
          className="flex h-12 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-[#fff8f1] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a] opacity-70"
        >
          Ajouter
        </button>
      </div>

      {seededEntries.map((entry, entryIndex) => (
        <label
          key={`${exercise.id}-checklist-${entry.label}-${entryIndex}`}
          className={`flex items-center gap-4 rounded-[1rem] border px-4 py-3 ${
            entry.checked ? "border-[#cf7430] bg-[#fff5e8]" : "border-[#eadfca] bg-white"
          }`}
        >
          <input type="checkbox" disabled checked={entry.checked} />
          <span className={entry.checked ? "font-semibold text-[#4b4550]" : "text-[#5f544a]"}>
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
          {prompt ? <p className="mb-3 text-sm font-semibold leading-7 text-[#5f544a]">{prompt}</p> : null}
          <div className="overflow-x-auto rounded-[1rem] border border-[#eadfca] bg-white">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[#fff8f1]">
                  <th className="border-b border-r border-[#eadfca] px-4 py-3 text-left text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">
                    Lignes
                  </th>
                  {columnLabels.map((columnLabel, columnIndex) => (
                    <th
                      key={`${exercise.id}-column-${questionIndex}-${columnIndex}`}
                      className="min-w-40 border-b border-[#eadfca] px-4 py-3 text-left text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]"
                    >
                      {columnLabel || `Colonne ${columnIndex + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowLabels.map((rowLabel, rowIndex) => (
                  <tr key={`${exercise.id}-row-${questionIndex}-${rowIndex}`}>
                    <th className="border-b border-r border-[#eadfca] bg-[#fffdf7] px-4 py-3 text-left text-sm font-semibold text-[#5f544a]">
                      {rowLabel || `Ligne ${rowIndex + 1}`}
                    </th>
                    {columnLabels.map((_, columnIndex) => (
                      <td
                        key={`${exercise.id}-cell-${questionIndex}-${rowIndex}-${columnIndex}`}
                        className="border-b border-[#eadfca] px-3 py-3"
                      >
                        <input
                          type="text"
                          readOnly
                          value=""
                          placeholder={exercise.answer_placeholder || undefined}
                          className="h-11 w-full rounded-[0.8rem] border border-[#eadfca] bg-[#fffdf7] px-3 text-sm text-[#5f544a]"
                        />
                      </td>
                    ))}
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
      <div className="rounded-[1.4rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff5ea)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
              Tableau d&apos;inspiration
            </p>
            <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2rem] leading-[0.95] text-[#4b4550]">
              Upload d&apos;images simple
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#6f645b]">
              L&apos;utilisateur ajoute seulement les images demandees dans la question.
            </p>
          </div>
          <div className="rounded-full border border-[#eadfca] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">
            {previewCount} a {config.maxImages} images
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["editorial", "minimal", "collage", "grid", "bold"].map((style) => (
            <span
              key={style}
              className={`rounded-full px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.14em] ${
                style === "editorial"
                  ? "bg-[#cf7430] text-white"
                  : "border border-[#eadfca] bg-white text-[#6b625a]"
              }`}
            >
              {style}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-[#eadfca] bg-[linear-gradient(145deg,#f8ecdf,#e3c79d_52%,#8f98a9)] p-4 shadow-[0_20px_46px_rgba(210,189,152,0.14)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.3rem] border border-white/70 bg-white/20 p-2">
          <div className="absolute left-[4%] top-[5%] h-[29%] w-[38%] rotate-[-4deg] overflow-hidden rounded-[1.1rem] border border-white/70 bg-white shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <div className="h-full w-full bg-[linear-gradient(145deg,#efe3d2,#d4b07d,#5a6474)]" />
          </div>
          <div className="absolute left-[46%] top-[6%] h-[20%] w-[48%] rotate-[2deg] overflow-hidden rounded-[1.1rem] border border-white/70 bg-white shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <div className="flex h-full items-end bg-[linear-gradient(135deg,#f5efe6,#cfa36a,#7a8496)] px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-white">
              Editorial light
            </div>
          </div>
          <div className="absolute left-[8%] top-[40%] h-[22%] w-[24%] rotate-[3deg] overflow-hidden rounded-[1.1rem] border border-white/80 bg-white px-4 py-4 shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">Couleur</p>
            <div className="mt-3 h-16 rounded-[0.9rem] bg-[#E8DCCB]" />
          </div>
          <div className="absolute left-[35%] top-[38%] h-[18%] w-[30%] rotate-[-2deg] overflow-hidden rounded-[1.1rem] border border-white/80 bg-white px-4 py-4 shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#4b4550]">Lumiere</p>
          </div>
          <div className="absolute left-[68%] top-[33%] h-[30%] w-[24%] rotate-[4deg] overflow-hidden rounded-[1.1rem] border border-white/70 bg-[linear-gradient(145deg,#f5efe6,#d7b486,#69788c)] shadow-[0_18px_36px_rgba(71,52,33,0.14)]" />
          <div className="absolute left-[7%] top-[68%] h-[16%] w-[26%] rotate-[-2deg] overflow-hidden rounded-[1.1rem] border border-white/80 bg-white px-4 py-4 shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <p className="font-[family:var(--font-cormorant)] text-[1.3rem] italic leading-none text-[#4b4550]">
              Une présence douce et structurée.
            </p>
          </div>
          <div className="absolute left-[36%] top-[66%] h-[15%] w-[26%] rotate-[1deg] overflow-hidden rounded-[1.1rem] border border-white/70 bg-[linear-gradient(145deg,#f7efe4,#d7b486,#8a938f)] shadow-[0_18px_36px_rgba(71,52,33,0.14)]" />
          <div className="absolute left-[66%] top-[68%] h-[14%] w-[26%] rotate-[-1deg] overflow-hidden rounded-[1.1rem] border border-white/80 bg-white px-4 py-4 shadow-[0_18px_36px_rgba(71,52,33,0.14)]">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#7a7087]">
              Export PNG / PDF
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: previewCount }, (_, index) => (
          <div
            key={`${exercise.id}-image-slot-${index}`}
            className="group relative aspect-square overflow-hidden rounded-[1.4rem] border border-[#eadfca] bg-white p-3 shadow-[0_18px_42px_rgba(210,189,152,0.12)]"
          >
            <div className="flex h-full items-center justify-center rounded-[1rem] border border-[#f1e7d6] bg-white px-4 text-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#eadfca] bg-[#fffdfa] text-[#6b625a] shadow-[0_10px_24px_rgba(210,189,152,0.12)]">
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
      <div className="rounded-[1.4rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff5ea)] p-5">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
          Persona de marque
        </p>
        <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2rem] leading-[0.95] text-[#4b4550]">
          {exercise.question || "Crée le persona incarné de ta marque"}
        </h3>
        {exercise.explanation ? (
          <PedagogicalContent
            content={exercise.explanation}
            className="mt-5 rounded-[1rem] border border-[#eadfca] bg-[#fffaf2] px-4 py-4"
          />
        ) : null}
      </div>

      {sections.map((section) => (
        <div
          key={section.id}
          className="rounded-[1.2rem] border border-[#eadfca] bg-white px-5 py-5"
        >
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
            {section.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#7b7068]">
            {section.description}
          </p>
          <div className="mt-4 space-y-3">
            {section.questions.map((question) => (
              <div
                key={question.id}
                className="rounded-[1rem] border border-[#eadfca] bg-[#fffdf9] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-7 text-[#5f544a]">
                      {question.label}
                    </p>
                    {question.helperText ? (
                      <p className="text-sm leading-6 text-[#8a8077]">
                        {question.helperText}
                      </p>
                    ) : null}
                  </div>
                  {question.example ? (
                    <span className="rounded-full bg-[#fff6e3] px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#cf7430]">
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
                      className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-base text-[#5f544a]"
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
                          className="flex items-center gap-3 rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-sm text-[#5f544a]"
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
    <div className="space-y-4 rounded-[1.4rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff7ef)] p-5">
      <div className="flex items-center justify-between gap-4 text-sm font-semibold text-[#5f544a]">
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
        <div className="h-2 rounded-full bg-[linear-gradient(90deg,#dde7df,#f6eadb,#f0d29c)]" />
        <div
          className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-white bg-[linear-gradient(135deg,#d88a2f,#f0cf55)] shadow-[0_12px_24px_rgba(207,116,48,0.28)]"
          style={{ left: `calc(${answer.score}% - 0.75rem)` }}
        />
      </div>

      <p className="text-sm leading-6 text-[#7b7068]">{config.helperText}</p>
      <div className="rounded-[1rem] border border-[#f0dfc6] bg-white px-4 py-4">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#cf7430]">
          Interpretation
        </p>
        <p className="mt-2 text-sm leading-6 text-[#5f544a]">{answer.interpretation}</p>
      </div>
      {config.enableJustification ? (
        <textarea
          readOnly
          placeholder="Pourquoi ce positionnement ?"
          className="min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-base text-[#5f544a]"
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
    <div className="space-y-4 rounded-[1.4rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff7ef)] p-5">
      <div className="rounded-[1.2rem] border border-[#f0dfc6] bg-white px-5 py-5">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
          Palette de couleurs
        </p>
        <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2rem] leading-[0.96] text-[#4b4550]">
          {exercise.question || "Construis la palette de couleurs de ta marque"}
        </h3>
        {exercise.explanation ? (
          <PedagogicalContent
            content={exercise.explanation}
            className="mt-5 rounded-[1rem] border border-[#eadfca] bg-[#fffaf2] px-4 py-4"
          />
        ) : null}
        <p className="mt-2 text-sm leading-7 text-[#8a8077]">{config.helperText}</p>
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

      <div className="rounded-[1.2rem] border border-[#eadfca] bg-white p-5">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7a7087]">
          Aperçu du picker
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="rounded-[1.2rem] border border-[#f0dfc6] bg-[#fffdf8] p-4">
            <div className="mx-auto max-w-[22rem]">
              <div className="aspect-square rounded-[1.1rem] bg-[linear-gradient(to_top,black,transparent),linear-gradient(to_right,white,transparent),hsl(44_89%_60%)]" />
              <div className="mt-4 h-3 rounded-full bg-[linear-gradient(90deg,#ff0000,#ffff00,#00ff66,#00a3ff,#5b00ff,#ff0090,#ff0000)]" />
            </div>
          </div>
          <div className="space-y-3 rounded-[1.2rem] border border-[#eadfca] bg-white p-4">
            <div
              className="h-28 rounded-[1rem] border border-[#eadfca]"
              style={{ background: seededPrimary[0]?.hex ?? "#EFE8D0" }}
            />
            <input
              readOnly
              value={seededPrimary[0]?.hex ?? "#EFE8D0"}
              className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf7] px-4 text-base text-[#5f544a]"
              aria-label="Code HEX"
            />
            {config.allowGradient ? (
              <div
                className="h-16 rounded-[1rem] border border-[#eadfca]"
                style={{
                  background:
                    "linear-gradient(90deg, #EFE8D0 0%, #F3C447 100%)",
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-[1rem] border border-[#f0dfc6] bg-white px-4 py-4 text-sm leading-7 text-[#6f645b]">
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
    <div className="rounded-[1.2rem] border border-[#eadfca] bg-white p-5">
      <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7a7087]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#8a8077]">{helper}</p>
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
            className="grid gap-3 rounded-[1rem] border border-[#eadfca] bg-[#fffdf9] p-4 md:grid-cols-[4.5rem_minmax(0,1fr)]"
          >
            <div
              className="h-14 rounded-[0.9rem] border border-[#eadfca]"
              style={{ background: getPaletteColorCss(item) }}
            />
            <div>
              <p className="text-sm font-semibold leading-6 text-[#5f544a]">
                {item.name || "Couleur"}
              </p>
              <p className="text-xs uppercase tracking-[0.12em] text-[#8a8077]">
                {item.hex}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#6f645b]">
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
    <div className="overflow-hidden rounded-[1.4rem] border border-[#eadfca] bg-white">
      <div className="flex items-center justify-between border-b border-[#eadfca] bg-[#fffdf7] px-4 py-4">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
            Calendrier éditorial
          </p>
          <p className="mt-1 text-xl font-semibold text-[#4b4550]">Vue mensuelle</p>
        </div>
        <span className="rounded-full border border-[#eadfca] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]">
          Ajouter
        </span>
      </div>
      <div className="grid grid-cols-7 bg-[#fffaf4] text-center text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#9a8f86]">
        {["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."].map((day) => (
          <div key={day} className="px-2 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 14 }, (_, index) => (
          <div key={index} className="min-h-20 border-r border-t border-[#f0e4d3] p-2">
            <p className="text-xs font-semibold text-[#6b625a]">{index + 1}</p>
            {index === 2 || index === 8 ? (
              <div className="mt-2 rounded-[0.7rem] border border-[#eadfca] bg-[#fffdf9] px-2 py-2 text-left text-xs text-[#4b4550]">
                Idee de contenu
                <span className="mt-1 block w-fit rounded-full bg-[#f4e4f8] px-2 py-1 text-[0.62rem] text-[#8b5aa2]">
                  À produire
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExercisePreview({ exercise }: { exercise: PreviewExercise }) {
  const prompts = getQuestionPrompts(exercise);
  const showMainQuestion =
    exercise.type !== "prompt_open" &&
    exercise.type !== "brand_persona" &&
    exercise.type !== "color_palette" &&
    exercise.type !== "editorial_calendar" &&
    !isPassiveContentType(exercise.type) &&
    exercise.type !== "fill_blank" &&
    exercise.type !== "group_open" &&
    exercise.question.trim().length > 0;

  return (
    <div className="space-y-4">
      {!isPassiveContentType(exercise.type) ? (
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7a7087]">
          Aperçu de l&apos;exercice
        </p>
      ) : null}

      {exercise.explanation &&
      !isPassiveContentType(exercise.type) &&
      !isDuplicateVisibleText(exercise.explanation, [exercise.question]) ? (
        exercise.type === "color_palette" ? null : (
        <PedagogicalContent
          content={exercise.explanation}
          className="rounded-[1.2rem] border border-[#eadfca] bg-white/82 px-5 py-5"
        />
        )
      ) : null}

      <PreviewVoiceNote src={exercise.audio_url} />

      {showMainQuestion ? (
        <p className="text-base leading-7 text-[#5f544a]">{exercise.question}</p>
      ) : null}

      {exercise.type === "static_text" ? (
        <div className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-white px-6 py-6 shadow-[0_16px_38px_rgba(126,102,78,0.08),0_2px_10px_rgba(207,116,48,0.06)] ring-1 ring-[#f3e5d2]/80 sm:px-7 sm:py-7">
          <div
            className="module-content relative max-w-none text-[1rem] leading-8 text-[#5f544a] sm:text-[1.06rem]"
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
                className="block rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4"
              >
                <span className="block text-sm font-semibold leading-7 text-[#5f544a]">{prompt}</span>
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
              className="block rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4"
            >
              <span className="block text-sm font-semibold leading-7 text-[#5f544a]">{prompt}</span>
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
                className="block rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4"
              >
                <span className="mt-2 block font-[family:var(--font-cormorant)] text-[1.8rem] font-semibold leading-none text-[#20324a]">
                  {prompt}
                </span>
                <div className="mt-3">
                  <PreviewTextInput placeholder={exercise.answer_placeholder || "Ta réponse"} />
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="border-l border-[#eadfca] pl-4">
            <div className="flex flex-wrap items-center gap-3 text-[#20324a]">
              <span className="font-[family:var(--font-cormorant)] text-[2rem] font-semibold leading-none text-[#20324a] sm:text-[2.35rem]">
                {getPromptOpenLabel(exercise.question)}
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
                  className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4 text-base leading-8 text-[#5f544a]"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7a7087]">
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
                            className="min-w-28 flex-1 rounded-[0.8rem] border border-[#eadfca] bg-[#fffaf4] px-3 py-2 text-sm text-[#5f544a]"
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
          <div className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4 text-base leading-8 text-[#5f544a]">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7a7087]">
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
                      className="min-w-28 flex-1 rounded-[0.8rem] border border-[#eadfca] bg-[#fffaf4] px-3 py-2 text-sm text-[#5f544a]"
                    />
                  ) : null}
                </div>
              ))}
            </div>
            {getFillBlankCount(exercise.question) === 0 ? (
              <p className="mt-3 text-sm leading-6 text-[#8a8077]">
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
