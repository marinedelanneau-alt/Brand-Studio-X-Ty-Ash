"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowDownTrayIcon, DocumentArrowDownIcon, ShareIcon } from "@heroicons/react/24/outline";
import {
  getActiveBrandPersonaSections,
  getBrandPersonaFields,
  parseStoredBrandPersonaConfig,
  type BrandPersonaQuestion,
} from "@/lib/brand-persona";
import {
  parseIndexedAnswerItems,
  serializeIndexedAnswerItem,
  type ExerciseType,
} from "@/lib/exercise-types";
import PedagogicalContent from "./pedagogical-content";
import PersonaStoryCard from "./persona-story-card";
import { dataUrlToFile, downloadDataUrl, exportStoryAsPng } from "@/lib/export-story-as-png";

type ExerciseLike = {
  id: string | number;
  type: ExerciseType;
  question: string;
  explanation: string;
  options: string[];
};

function autoResizeTextarea(target: HTMLTextAreaElement) {
  target.style.height = "auto";
  target.style.height = `${target.scrollHeight}px`;
}

function replacePersonaFirstNameToken(label: string, firstName: string) {
  const trimmedFirstName = firstName.trim();

  if (!trimmedFirstName) {
    return label;
  }

  return label.replace(/\[prenom\]/gi, trimmedFirstName);
}

function getFieldValues(rawValues: string[], fieldIndex: number) {
  return parseIndexedAnswerItems(rawValues)
    .filter((item) => item.questionIndex === fieldIndex)
    .sort((left, right) => left.valueIndex - right.valueIndex)
    .map((item) => item.value);
}

function setFieldValues(rawValues: string[], fieldIndex: number, nextValues: string[]) {
  const keptItems = parseIndexedAnswerItems(rawValues).filter(
    (item) => item.questionIndex !== fieldIndex,
  );

  const nextItems = nextValues
    .filter((value) => value.trim().length > 0)
    .map((value, valueIndex) => serializeIndexedAnswerItem(fieldIndex, valueIndex, value));

  return [
    ...keptItems
      .sort((left, right) =>
        left.questionIndex === right.questionIndex
          ? left.valueIndex - right.valueIndex
          : left.questionIndex - right.questionIndex,
      )
      .map((item) =>
        serializeIndexedAnswerItem(item.questionIndex, item.valueIndex, item.value),
      ),
    ...nextItems,
  ];
}

function isQuestionAnswered(question: BrandPersonaQuestion, values: string[]) {
  return values.some((value) => value.trim().length > 0);
}

export default function BrandPersonaExercise({
  exercise,
  answers,
  onChange,
}: {
  exercise: ExerciseLike;
  answers: string[];
  onChange: (nextValues: string[]) => void;
}) {
  const config = useMemo(
    () => parseStoredBrandPersonaConfig(exercise.options),
    [exercise.options],
  );
  const sections = useMemo(() => getActiveBrandPersonaSections(config), [config]);
  const fields = useMemo(() => getBrandPersonaFields(config), [config]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const storyRef = useRef<HTMLElement | null>(null);
  const activeSection = sections[activeSectionIndex] ?? sections[0];
  const fieldIndexById = new Map(fields.map((field, index) => [field.id, index]));
  const requiredFields = fields.filter((field) => field.required);
  const completedRequiredCount = requiredFields.filter((field) => {
    const fieldIndex = fieldIndexById.get(field.id);
    return fieldIndex !== undefined && isQuestionAnswered(field, getFieldValues(answers, fieldIndex));
  }).length;
  const overallCompletion =
    requiredFields.length === 0
      ? 0
      : Math.round((completedRequiredCount / requiredFields.length) * 100);
  const personaFirstName =
    (() => {
      const fieldIndex = fieldIndexById.get("persona_first_name");
      if (fieldIndex === undefined) {
        return "";
      }

      return getFieldValues(answers, fieldIndex)[0] ?? "";
    })() || "ta marque";
  const summary = {
    firstName:
      getFieldValues(answers, fieldIndexById.get("persona_first_name") ?? -1)[0] ?? "",
    profile: [
      getFieldValues(answers, fieldIndexById.get("persona_age_approx") ?? -1)[0] ?? "",
      getFieldValues(answers, fieldIndexById.get("persona_symbolic_profession") ?? -1)[0] ?? "",
      getFieldValues(answers, fieldIndexById.get("persona_summary_sentence") ?? -1)[0] ?? "",
    ]
      .filter(Boolean)
      .join(" | "),
    traits:
      getFieldValues(answers, fieldIndexById.get("dominant_traits") ?? -1)[0] ?? "",
    tone:
      getFieldValues(answers, fieldIndexById.get("tone_of_voice") ?? -1)[0] ?? "",
    values: [
      getFieldValues(answers, fieldIndexById.get("core_priority") ?? -1)[0] ?? "",
      getFieldValues(answers, fieldIndexById.get("defends") ?? -1)[0] ?? "",
      getFieldValues(answers, fieldIndexById.get("credibility_source") ?? -1)[0] ?? "",
    ]
      .filter(Boolean)
      .join(" | "),
    interactions: [
      getFieldValues(answers, fieldIndexById.get("welcome_style") ?? -1)[0] ?? "",
      getFieldValues(answers, fieldIndexById.get("reassurance_style") ?? -1)[0] ?? "",
      getFieldValues(answers, fieldIndexById.get("advisor_type") ?? -1)[0] ?? "",
    ]
      .filter(Boolean)
      .join(" | "),
    quote:
      getFieldValues(answers, fieldIndexById.get("defining_quote") ?? -1)[0] ?? "",
  };
  const personaFilename = `brand-studio-persona-${(summary.firstName || "ma-marque").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.png`;

  async function createPersonaImage() {
    if (!storyRef.current || isExporting) return null;
    setIsExporting(true);
    setShareMessage("");
    try {
      return await exportStoryAsPng(storyRef.current);
    } catch {
      setShareMessage("Impossible de préparer l'image. Réessaie dans quelques instants.");
      return null;
    } finally {
      setIsExporting(false);
    }
  }

  async function downloadPersona() {
    const dataUrl = await createPersonaImage();
    if (!dataUrl) return;
    downloadDataUrl(dataUrl, personaFilename);
    setShareMessage("Ta fiche persona a été téléchargée.");
  }

  async function sharePersona() {
    const dataUrl = await createPersonaImage();
    if (!dataUrl) return;
    const file = await dataUrlToFile(dataUrl, personaFilename);
    const canShare = typeof navigator.share === "function" && (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] }));
    if (canShare) {
      try {
        await navigator.share({ files: [file], title: "Mon persona de marque", text: "Voici le persona de ma marque, créé avec Brand Studio." });
        setShareMessage("Choisis Instagram puis ajoute l'image à ta story.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    downloadDataUrl(dataUrl, personaFilename);
    setShareMessage("Image téléchargée. Ouvre Instagram et sélectionne-la dans ta story.");
  }

  return (
    <div className="mt-4 space-y-5">
      <section className="overflow-hidden rounded-[1.8rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] shadow-[0_18px_44px_rgba(210,189,152,0.1)]">
        <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[0.74rem] font-black uppercase tracking-[0.22em] text-[var(--tyash-label-text)]">
                Persona de marque
              </p>
              <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2.3rem] leading-[0.94] text-[var(--heading-color)]">
                {exercise.question || "Crée le persona incarné de ta marque"}
              </h3>
              <PedagogicalContent
                content={
                  exercise.explanation ||
                  "Imagine ta marque comme une vraie personne. Cet exercice va t'aider a definir sa personnalite, sa maniere de parler, son attitude et son univers."
                }
                className="mt-5 rounded-[1rem] border border-[var(--border)] bg-[var(--tyash-subtle)] px-4 py-4"
              />
              {false ? (
              <p>
                {exercise.explanation ||
                  "Imagine ta marque comme une vraie personne. Cet exercice va t'aider à définir sa personnalité, sa manière de parler, son attitude et son univers."}
              </p>
              ) : null}
            </div>

            <div className="min-w-56 rounded-[1.2rem] border border-[var(--border)] bg-[var(--card)]/80 px-4 py-4 shadow-[inset_0_1px_0_rgb(var(--tyash-highlight-rgb)/0.82)]">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Progression
              </p>
              <p className="mt-3 text-3xl font-black leading-none text-[var(--heading-color)]">
                {overallCompletion}%
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                <div
                  className="h-full rounded-full bg-[image:var(--tyash-progress-gradient)] transition-[width]"
                  style={{ width: `${overallCompletion}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                {completedRequiredCount}/{requiredFields.length} réponses essentielles complétées
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {sections.map((section, sectionIndex) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionIndex(sectionIndex)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                  sectionIndex === activeSectionIndex
                    ? "bg-[var(--tyash-primary)] text-[var(--tyash-text-on-primary)]"
                    : "border border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)]"
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {activeSection ? (
          <div className="px-5 py-6 sm:px-6">
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] px-5 py-5 shadow-[0_14px_34px_rgba(210,189,152,0.08)]">
              <div className="border-b border-[var(--border)] pb-4">
                <p className="text-[0.74rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">
                  Section {activeSectionIndex + 1} sur {sections.length}
                </p>
                <h4 className="mt-2 text-xl font-semibold text-[var(--heading-color)]">
                  {activeSection.title}
                </h4>
                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                  {activeSection.description}
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {activeSection.questions.map((question) => {
                  const fieldIndex = fieldIndexById.get(question.id) ?? -1;
                  const currentValues = getFieldValues(answers, fieldIndex);
                  const currentValue = currentValues[0] ?? "";

                  return (
                    <label
                      key={question.id}
                      className="block rounded-[1.1rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="block text-base font-semibold leading-7 text-[var(--heading-color)]">
                            {replacePersonaFirstNameToken(
                              question.label,
                              summary.firstName,
                            )}
                          </span>
                          {question.helperText ? (
                            <span className="mt-1 block text-sm leading-6 text-[var(--text-muted)]">
                              {question.helperText}
                            </span>
                          ) : null}
                        </div>

                      </div>

                      {question.fieldType === "text" ? (
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(event) =>
                            onChange(setFieldValues(answers, fieldIndex, [event.target.value]))
                          }
                          className="mt-3 h-12 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4 text-base text-[var(--text-primary)] outline-none focus:border-[var(--tyash-primary)] focus:ring-4 focus:ring-[var(--tyash-focus-ring)]/20"
                          placeholder={question.placeholder || undefined}
                        />
                      ) : null}

                      {question.fieldType === "textarea" ? (
                        <textarea
                          value={currentValue}
                          onChange={(event) =>
                            onChange(setFieldValues(answers, fieldIndex, [event.target.value]))
                          }
                          onInput={(event) => autoResizeTextarea(event.currentTarget)}
                          rows={3}
                          className="mt-3 w-full resize-none overflow-hidden rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--tyash-primary)] focus:ring-4 focus:ring-[var(--tyash-focus-ring)]/20"
                          placeholder={question.placeholder || undefined}
                        />
                      ) : null}

                      {question.fieldType === "select" ? (
                        <select
                          value={currentValue}
                          onChange={(event) =>
                            onChange(setFieldValues(answers, fieldIndex, [event.target.value]))
                          }
                          className="mt-3 h-12 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4 text-base text-[var(--text-primary)] outline-none focus:border-[var(--tyash-primary)] focus:ring-4 focus:ring-[var(--tyash-focus-ring)]/20"
                        >
                          <option value="">Choisir une option</option>
                          {question.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : null}

                      {question.fieldType === "checkbox" ? (
                        <div className="mt-3 space-y-2">
                          {question.options.map((option) => {
                            const isChecked = currentValues.includes(option);

                            return (
                              <label
                                key={option}
                                className={`flex items-center gap-3 rounded-[0.9rem] border px-4 py-3 text-sm leading-6 ${
                                  isChecked
                                    ? "border-[var(--tyash-primary)] bg-[var(--tyash-subtle)] text-[var(--heading-color)]"
                                    : "border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)]"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(event) => {
                                    const nextValues = event.target.checked
                                      ? [...currentValues, option]
                                      : currentValues.filter((value) => value !== option);
                                    onChange(setFieldValues(answers, fieldIndex, nextValues));
                                  }}
                                />
                                <span>{option}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </label>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSectionIndex((current) => Math.max(current - 1, 0))
                  }
                  disabled={activeSectionIndex === 0}
                  className="flex h-12 items-center justify-center rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--text-primary)] disabled:opacity-50"
                >
                  Section precedente
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSectionIndex((current) =>
                      Math.min(current + 1, Math.max(sections.length - 1, 0)),
                    )
                  }
                  disabled={activeSectionIndex >= sections.length - 1}
                  className="flex h-12 items-center justify-center rounded-[0.9rem] bs-button-primary px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                >
                  Question suivante
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[1.8rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_16px_40px_rgba(210,189,152,0.08)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.74rem] font-black uppercase tracking-[0.22em] text-[var(--tyash-label-text)]">
              Ton persona de marque
            </p>
            <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2.2rem] leading-[0.94] text-[var(--heading-color)]">
              {summary.firstName || "Le portrait prend forme"}
            </h3>
          </div>
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-[0.9rem] bs-button-primary px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white"
          >
            {config.summaryCtaLabel}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SummaryCard title="Profil résumé" content={summary.profile} />
          <SummaryCard title="Traits dominants" content={summary.traits} />
          <SummaryCard title="Ton de voix" content={summary.tone} />
          <SummaryCard title="Valeurs incarnees" content={summary.values} />
          <SummaryCard title="Maniere d'interagir" content={summary.interactions} />
          <SummaryCard title="Citation finale" content={summary.quote} />
        </div>

        <div className="mt-5 rounded-[1.2rem] border border-[var(--border)] bg-[var(--tyash-subtle)] px-5 py-4 text-sm leading-7 text-[var(--text-primary)]">
          Quand tu crees du contenu, demande-toi : comment {personaFirstName} communiquerait-elle ce message ?
        </div>
        {overallCompletion === 100 ? (
          <div className="mt-6 rounded-[1.4rem] border border-[var(--border)] bg-[var(--tyash-subtle)] p-5">
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div>
                <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">Fiche terminée</p>
                <h4 className="mt-2 text-xl font-semibold text-[var(--heading-color)]">Télécharge ou partage ton persona</h4>
                <p className="mt-2 text-sm leading-7 text-[var(--text-primary)]">Télécharge le CV complet de ton persona en PDF ou partage sa version courte au format Story.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href="/mon-espace/persona/download" className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#4b4550] bg-[var(--card)] px-4 text-sm font-bold text-[var(--heading-color)]"><DocumentArrowDownIcon className="size-5" />PDF complet</a>
                  <button type="button" onClick={() => void downloadPersona()} disabled={isExporting} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--tyash-primary)] bg-[var(--card)] px-4 text-sm font-bold text-[var(--tyash-label-text)] disabled:opacity-50"><ArrowDownTrayIcon className="size-5" />{isExporting ? "Préparation..." : "Télécharger"}</button>
                  <button type="button" onClick={() => void sharePersona()} disabled={isExporting} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--tyash-primary)] px-4 text-sm font-bold text-[var(--tyash-text-on-primary)] disabled:opacity-50"><ShareIcon className="size-5" />Partager en story</button>
                </div>
                {shareMessage ? <p className="mt-3 text-sm text-[var(--text-primary)]" role="status">{shareMessage}</p> : null}
              </div>
              <PersonaStoryCard ref={storyRef} summary={summary} />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SummaryCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
      <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {title}
      </p>
      <p className="mt-3 text-sm leading-7 text-[var(--text-primary)]">
        {content || "À compléter dans l'exercice."}
      </p>
    </div>
  );
}
