"use client";

import { useMemo, useState } from "react";
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
    .map((value) => value.trim())
    .filter(Boolean)
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

  return (
    <div className="mt-4 space-y-5">
      <section className="overflow-hidden rounded-[1.8rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff5ea)] shadow-[0_18px_44px_rgba(210,189,152,0.1)]">
        <div className="border-b border-[#f0e1cb] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[0.74rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
                Persona de marque
              </p>
              <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2.3rem] leading-[0.94] text-[#4b4550]">
                {exercise.question || "Cree le persona incarne de ta marque"}
              </h3>
              <p className="mt-4 font-[family:var(--font-caveat)] text-[1.4rem] italic leading-[1.35] text-[#8b684f] sm:text-[1.55rem]">
                {exercise.explanation ||
                  "Imagine ta marque comme une vraie personne. Cet exercice va t'aider a definir sa personnalite, sa maniere de parler, son attitude et son univers."}
              </p>
            </div>

            <div className="min-w-56 rounded-[1.2rem] border border-[#eadfca] bg-white/80 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Progression
              </p>
              <p className="mt-3 text-3xl font-black leading-none text-[#4b4550]">
                {overallCompletion}%
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f1ece5]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#d88a2f,#f0cf55)] transition-[width]"
                  style={{ width: `${overallCompletion}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-[#7b7068]">
                {completedRequiredCount}/{requiredFields.length} reponses essentielles completees
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-[#f0e1cb] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {sections.map((section, sectionIndex) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionIndex(sectionIndex)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                  sectionIndex === activeSectionIndex
                    ? "bg-[#cf7430] text-white"
                    : "border border-[#eadfca] bg-white text-[#6b625a]"
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {activeSection ? (
          <div className="px-5 py-6 sm:px-6">
            <div className="rounded-[1.5rem] border border-[#eadfca] bg-white px-5 py-5 shadow-[0_14px_34px_rgba(210,189,152,0.08)]">
              <div className="border-b border-[#f0e4d3] pb-4">
                <p className="text-[0.74rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
                  Section {activeSectionIndex + 1} sur {sections.length}
                </p>
                <h4 className="mt-2 text-xl font-semibold text-[#4b4550]">
                  {activeSection.title}
                </h4>
                <p className="mt-2 text-sm leading-7 text-[#7b7068]">
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
                      className="block rounded-[1.1rem] border border-[#eadfca] bg-[#fffdf9] px-4 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="block text-base font-semibold leading-7 text-[#4b4550]">
                            {replacePersonaFirstNameToken(
                              question.label,
                              summary.firstName,
                            )}
                            {question.required ? (
                              <span className="ml-2 text-[#cf7430]">*</span>
                            ) : null}
                          </span>
                          {question.helperText ? (
                            <span className="mt-1 block text-sm leading-6 text-[#7b7068]">
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
                          className="mt-3 h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-base text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
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
                          className="mt-3 w-full resize-none overflow-hidden rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-base text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
                          placeholder={question.placeholder || undefined}
                        />
                      ) : null}

                      {question.fieldType === "select" ? (
                        <select
                          value={currentValue}
                          onChange={(event) =>
                            onChange(setFieldValues(answers, fieldIndex, [event.target.value]))
                          }
                          className="mt-3 h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-base text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
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
                                    ? "border-[#cf7430] bg-[#fff6ec] text-[#4b4550]"
                                    : "border-[#eadfca] bg-white text-[#5f544a]"
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
                  className="flex h-12 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a] disabled:opacity-50"
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
                  className="flex h-12 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                >
                  Question suivante
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[1.8rem] border border-[#eadfca] bg-white p-5 shadow-[0_16px_40px_rgba(210,189,152,0.08)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.74rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
              Ton persona de marque
            </p>
            <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2.2rem] leading-[0.94] text-[#4b4550]">
              {summary.firstName || "Le portrait prend forme"}
            </h3>
          </div>
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white"
          >
            {config.summaryCtaLabel}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SummaryCard title="Profil resume" content={summary.profile} />
          <SummaryCard title="Traits dominants" content={summary.traits} />
          <SummaryCard title="Ton de voix" content={summary.tone} />
          <SummaryCard title="Valeurs incarnees" content={summary.values} />
          <SummaryCard title="Maniere d'interagir" content={summary.interactions} />
          <SummaryCard title="Citation finale" content={summary.quote} />
        </div>

        <div className="mt-5 rounded-[1.2rem] border border-[#f0dfc6] bg-[#fff8f1] px-5 py-4 text-sm leading-7 text-[#6f645b]">
          Quand tu crees du contenu, demande-toi : comment {personaFirstName} communiquerait-elle ce message ?
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[#eadfca] bg-[#fffdf9] px-4 py-4">
      <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
        {title}
      </p>
      <p className="mt-3 text-sm leading-7 text-[#5f544a]">
        {content || "A completer dans l'exercice."}
      </p>
    </div>
  );
}
