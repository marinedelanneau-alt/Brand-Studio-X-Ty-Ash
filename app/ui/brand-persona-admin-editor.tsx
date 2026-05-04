"use client";

import type {
  BrandPersonaConfig,
  BrandPersonaFieldType,
  BrandPersonaQuestion,
  BrandPersonaSection,
} from "@/lib/brand-persona";

const FIELD_TYPE_LABELS: Record<BrandPersonaFieldType, string> = {
  text: "Texte court",
  textarea: "Texte long",
  checkbox: "Cases a cocher",
  select: "Liste deroulante",
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

function createQuestion(sectionKey: string, order: number): BrandPersonaQuestion {
  return {
    id: `question_${crypto.randomUUID()}`,
    section: sectionKey,
    label: "",
    helperText: "",
    placeholder: "",
    fieldType: "textarea",
    required: false,
    order,
    example: "",
    isActive: true,
    options: [],
  };
}

function createSection(order: number): BrandPersonaSection {
  const key = `section_${order}`;
  return {
    id: `section_${crypto.randomUUID()}`,
    key,
    title: `Section ${order}`,
    description: "",
    order,
    isActive: true,
    questions: [createQuestion(key, 1)],
  };
}

function resequenceQuestions(questions: BrandPersonaQuestion[], sectionKey: string) {
  return questions.map((question, index) => ({
    ...question,
    section: sectionKey,
    order: index + 1,
  }));
}

function resequenceSections(sections: BrandPersonaSection[]) {
  return sections.map((section, index) => ({
    ...section,
    order: index + 1,
    questions: resequenceQuestions(section.questions, section.key),
  }));
}

export default function BrandPersonaAdminEditor({
  value,
  onChange,
}: {
  value: BrandPersonaConfig;
  onChange: (nextValue: BrandPersonaConfig) => void;
}) {
  function updateSection(
    sectionId: string,
    updater: (section: BrandPersonaSection) => BrandPersonaSection,
  ) {
    onChange({
      ...value,
      sections: resequenceSections(
        value.sections.map((section) =>
          section.id === sectionId ? updater(section) : section,
        ),
      ),
    });
  }

  function updateQuestion(
    sectionId: string,
    questionId: string,
    updater: (question: BrandPersonaQuestion) => BrandPersonaQuestion,
  ) {
    updateSection(sectionId, (section) => ({
      ...section,
      questions: resequenceQuestions(
        section.questions.map((question) =>
          question.id === questionId ? updater(question) : question,
        ),
        section.key,
      ),
    }));
  }

  return (
    <div className="space-y-5 rounded-[1rem] border border-[#eadfca] bg-[#fffaf4] p-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Libelle du bouton final
          </span>
          <input
            type="text"
            value={value.summaryCtaLabel}
            onChange={(event) =>
              onChange({ ...value, summaryCtaLabel: event.target.value })
            }
            className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
          />
        </label>

        <label className="flex items-center justify-between rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3">
          <span>
            <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
              Exercice actif
            </span>
            <span className="mt-1 block text-sm leading-6 text-[#7b7068]">
              Masque ou affiche ce persona cote utilisateur.
            </span>
          </span>
          <input
            type="checkbox"
            checked={value.isActive}
            onChange={(event) =>
              onChange({ ...value, isActive: event.target.checked })
            }
            className="h-5 w-5"
          />
        </label>
      </div>

      <div className="space-y-4">
        {value.sections.map((section, sectionIndex) => (
          <div
            key={section.id}
            className="rounded-[1.1rem] border border-[#eadfca] bg-white p-4 shadow-[0_8px_24px_rgba(210,189,152,0.08)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
                  Section {sectionIndex + 1}
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(event) =>
                      updateSection(section.id, (current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Titre de section"
                    className="h-12 rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf9] px-4"
                  />
                  <input
                    type="text"
                    value={section.key}
                    onChange={(event) =>
                      updateSection(section.id, (current) => ({
                        ...current,
                        key: event.target.value.trim().toLowerCase().replace(/\s+/g, "_"),
                      }))
                    }
                    placeholder="section_key"
                    className="h-12 rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf9] px-4"
                  />
                </div>
                <textarea
                  value={section.description}
                  onChange={(event) =>
                    updateSection(section.id, (current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Courte explication visible cote utilisateur"
                  className="mt-3 min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf9] px-4 py-3"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 rounded-full border border-[#eadfca] bg-[#fff8f1] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]">
                  <span>Active</span>
                  <input
                    type="checkbox"
                    checked={section.isActive}
                    onChange={(event) =>
                      updateSection(section.id, (current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                </label>
                <button
                  type="button"
                  disabled={sectionIndex === 0}
                  onClick={() =>
                    onChange({
                      ...value,
                      sections: resequenceSections(
                        moveItem(value.sections, sectionIndex, sectionIndex - 1),
                      ),
                    })
                  }
                  className="rounded-[0.75rem] border border-[#eadfca] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:opacity-50"
                >
                  Monter
                </button>
                <button
                  type="button"
                  disabled={sectionIndex === value.sections.length - 1}
                  onClick={() =>
                    onChange({
                      ...value,
                      sections: resequenceSections(
                        moveItem(value.sections, sectionIndex, sectionIndex + 1),
                      ),
                    })
                  }
                  className="rounded-[0.75rem] border border-[#eadfca] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:opacity-50"
                >
                  Descendre
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      sections: resequenceSections(
                        value.sections.filter((item) => item.id !== section.id),
                      ),
                    })
                  }
                  className="px-2 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#b45247]"
                >
                  Supprimer
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {section.questions.map((question, questionIndex) => (
                <div
                  key={question.id}
                  className="rounded-[1rem] border border-[#f0e4d3] bg-[#fffdf9] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                      Question {questionIndex + 1}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#6b625a]">
                        <span>Obligatoire</span>
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(event) =>
                            updateQuestion(section.id, question.id, (current) => ({
                              ...current,
                              required: event.target.checked,
                            }))
                          }
                          className="h-4 w-4"
                        />
                      </label>
                      <label className="flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#6b625a]">
                        <span>Active</span>
                        <input
                          type="checkbox"
                          checked={question.isActive}
                          onChange={(event) =>
                            updateQuestion(section.id, question.id, (current) => ({
                              ...current,
                              isActive: event.target.checked,
                            }))
                          }
                          className="h-4 w-4"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={questionIndex === 0}
                        onClick={() =>
                          updateSection(section.id, (current) => ({
                            ...current,
                            questions: resequenceQuestions(
                              moveItem(current.questions, questionIndex, questionIndex - 1),
                              current.key,
                            ),
                          }))
                        }
                        className="rounded-[0.75rem] border border-[#eadfca] bg-white px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:opacity-50"
                      >
                        Monter
                      </button>
                      <button
                        type="button"
                        disabled={questionIndex === section.questions.length - 1}
                        onClick={() =>
                          updateSection(section.id, (current) => ({
                            ...current,
                            questions: resequenceQuestions(
                              moveItem(current.questions, questionIndex, questionIndex + 1),
                              current.key,
                            ),
                          }))
                        }
                        className="rounded-[0.75rem] border border-[#eadfca] bg-white px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:opacity-50"
                      >
                        Descendre
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSection(section.id, (current) => ({
                            ...current,
                            questions: resequenceQuestions(
                              current.questions.filter((item) => item.id !== question.id),
                              current.key,
                            ),
                          }))
                        }
                        className="px-2 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#b45247]"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                        Libelle
                      </span>
                      <input
                        type="text"
                        value={question.label}
                        onChange={(event) =>
                          updateQuestion(section.id, question.id, (current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                        className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                        Identifiant
                      </span>
                      <input
                        type="text"
                        value={question.id}
                        onChange={(event) =>
                          updateQuestion(section.id, question.id, (current) => ({
                            ...current,
                            id: event.target.value.trim().toLowerCase().replace(/\s+/g, "_"),
                          }))
                        }
                        className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                        Type de champ
                      </span>
                      <select
                        value={question.fieldType}
                        onChange={(event) =>
                          updateQuestion(section.id, question.id, (current) => ({
                            ...current,
                            fieldType: event.target.value as BrandPersonaFieldType,
                          }))
                        }
                        className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                      >
                        {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                        Helper text
                      </span>
                      <textarea
                        value={question.helperText}
                        onChange={(event) =>
                          updateQuestion(section.id, question.id, (current) => ({
                            ...current,
                            helperText: event.target.value,
                          }))
                        }
                        className="min-h-20 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                        Placeholder
                      </span>
                      <input
                        type="text"
                        value={question.placeholder}
                        onChange={(event) =>
                          updateQuestion(section.id, question.id, (current) => ({
                            ...current,
                            placeholder: event.target.value,
                          }))
                        }
                        className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                        Exemple
                      </span>
                      <input
                        type="text"
                        value={question.example}
                        onChange={(event) =>
                          updateQuestion(section.id, question.id, (current) => ({
                            ...current,
                            example: event.target.value,
                          }))
                        }
                        className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                      />
                    </label>

                    {question.fieldType === "checkbox" || question.fieldType === "select" ? (
                      <label className="space-y-2 md:col-span-2">
                        <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                          Options, une ligne par choix
                        </span>
                        <textarea
                          value={question.options.join("\n")}
                          onChange={(event) =>
                            updateQuestion(section.id, question.id, (current) => ({
                              ...current,
                              options: event.target.value
                                .split("\n")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            }))
                          }
                          className="min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </label>
                    ) : null}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  updateSection(section.id, (current) => ({
                    ...current,
                    questions: resequenceQuestions(
                      [...current.questions, createQuestion(current.key, current.questions.length + 1)],
                      current.key,
                    ),
                  }))
                }
                className="flex h-12 items-center justify-center rounded-[0.9rem] border border-dashed border-[#d9c7ab] bg-[#fff8f1] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
              >
                Ajouter une question
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({
            ...value,
            sections: resequenceSections([
              ...value.sections,
              createSection(value.sections.length + 1),
            ]),
          })
        }
        className="flex h-12 items-center justify-center rounded-[0.9rem] border border-dashed border-[#d9c7ab] bg-white px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
      >
        Ajouter une section
      </button>
    </div>
  );
}
