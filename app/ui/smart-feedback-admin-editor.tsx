"use client";

import {
  DEFAULT_GENERIC_WORDS,
  getDefaultSmartFeedbackConfig,
  type SmartFeedbackConfig,
  type SmartFeedbackLevel,
  type SmartFeedbackRuleCondition,
  type SmartFeedbackType,
} from "@/lib/smart-feedback";

const FEEDBACK_TYPES: Array<{ value: SmartFeedbackType; label: string }> = [
  { value: "rule_based", label: "Rule based" },
  { value: "manual", label: "Manual" },
  { value: "ai_ready", label: "AI ready" },
];

const RULE_CONDITIONS: Array<{ value: SmartFeedbackRuleCondition; label: string }> = [
  { value: "length_less_than", label: "Length less than" },
  { value: "length_between", label: "Length between" },
  { value: "contains_generic_words", label: "Contains generic words" },
  { value: "contains_required_keywords", label: "Contains required keywords" },
  { value: "passes_all_checks", label: "Passes all checks" },
];

const FEEDBACK_LEVELS: Array<{ value: SmartFeedbackLevel; label: string }> = [
  { value: "improve", label: "Improve" },
  { value: "warning", label: "Warning" },
  { value: "good", label: "Good" },
  { value: "excellent", label: "Excellent" },
];

function parseLineList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SmartFeedbackAdminEditor({
  value,
  onChange,
}: {
  value: SmartFeedbackConfig;
  onChange: (nextValue: SmartFeedbackConfig) => void;
}) {
  const normalizedValue = {
    ...getDefaultSmartFeedbackConfig(),
    ...value,
  };

  return (
    <div className="space-y-4 rounded-[1rem] border border-[#eadfca] bg-[#fffaf4] p-4">
      <div className="flex items-center justify-between rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#4b4550]">Feedback intelligent</p>
          <p className="text-sm leading-6 text-[#7b7068]">
            Affiche un conseil doux et utile sous la réponse utilisateur.
          </p>
        </div>
        <input
          type="checkbox"
          checked={normalizedValue.enabled}
          onChange={(event) =>
            onChange({ ...normalizedValue, enabled: event.target.checked })
          }
          className="h-4 w-4"
        />
      </div>

      {normalizedValue.enabled ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Type de feedback
              </span>
              <select
                value={normalizedValue.type}
                onChange={(event) =>
                  onChange({
                    ...normalizedValue,
                    type: event.target.value as SmartFeedbackType,
                  })
                }
                className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
              >
                {FEEDBACK_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center justify-between rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3">
              <span className="text-sm font-semibold text-[#5f544a]">
                Afficher un score de clarté
              </span>
              <input
                type="checkbox"
                checked={normalizedValue.clarityScoreEnabled}
                onChange={(event) =>
                  onChange({
                    ...normalizedValue,
                    clarityScoreEnabled: event.target.checked,
                  })
                }
                className="h-4 w-4"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Longueur minimale recommandee
              </span>
              <input
                type="number"
                min={0}
                value={normalizedValue.minLength}
                onChange={(event) =>
                  onChange({
                    ...normalizedValue,
                    minLength: Math.max(0, Number(event.target.value) || 0),
                  })
                }
                className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Longueur maximale recommandee
              </span>
              <input
                type="number"
                min={0}
                value={normalizedValue.maxLength}
                onChange={(event) =>
                  onChange({
                    ...normalizedValue,
                    maxLength: Math.max(0, Number(event.target.value) || 0),
                  })
                }
                className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Mots génériques à éviter
              </span>
              <textarea
                value={normalizedValue.forbiddenKeywords.join("\n")}
                onChange={(event) =>
                  onChange({
                    ...normalizedValue,
                    forbiddenKeywords: parseLineList(event.target.value),
                  })
                }
                className="min-h-28 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
                placeholder={DEFAULT_GENERIC_WORDS.join("\n")}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Mots cles attendus
              </span>
              <textarea
                value={normalizedValue.requiredKeywords.join("\n")}
                onChange={(event) =>
                  onChange({
                    ...normalizedValue,
                    requiredKeywords: parseLineList(event.target.value),
                  })
                }
                className="min-h-28 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Message si réponse trop courte
              </span>
              <textarea
                value={normalizedValue.improvementMessage}
                onChange={(event) =>
                  onChange({
                    ...normalizedValue,
                    improvementMessage: event.target.value,
                  })
                }
                className="min-h-20 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Message si réponse trop vague
              </span>
              <textarea
                value={normalizedValue.neutralMessage}
                onChange={(event) =>
                  onChange({
                    ...normalizedValue,
                    neutralMessage: event.target.value,
                  })
                }
                className="min-h-20 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Message si réponse correcte
              </span>
              <textarea
                value={normalizedValue.positiveMessage}
                onChange={(event) =>
                  onChange({
                    ...normalizedValue,
                    positiveMessage: event.target.value,
                  })
                }
                className="min-h-20 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Message si réponse excellente
              </span>
              <textarea
                value={normalizedValue.excellentMessage}
                onChange={(event) =>
                  onChange({
                    ...normalizedValue,
                    excellentMessage: event.target.value,
                  })
                }
                className="min-h-20 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
              />
            </label>
          </div>

          {normalizedValue.type === "rule_based" ? (
            <div className="space-y-3 rounded-[0.9rem] border border-[#eadfca] bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                  Regles personnalisees
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...normalizedValue,
                      rules: [
                        ...normalizedValue.rules,
                        {
                          id: crypto.randomUUID(),
                          condition: "length_less_than",
                          value: normalizedValue.minLength,
                          message: "",
                          level: "improve",
                        },
                      ],
                    })
                  }
                  className="rounded-[0.8rem] border border-[#eadfca] bg-[#fff8f1] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]"
                >
                  Ajouter une regle
                </button>
              </div>

              {normalizedValue.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="grid gap-3 rounded-[0.9rem] border border-[#f0e4d3] bg-[#fffdf9] p-4"
                >
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="space-y-2">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                        Condition
                      </span>
                      <select
                        value={rule.condition}
                        onChange={(event) =>
                          onChange({
                            ...normalizedValue,
                            rules: normalizedValue.rules.map((item) =>
                              item.id === rule.id
                                ? {
                                    ...item,
                                    condition: event.target.value as SmartFeedbackRuleCondition,
                                  }
                                : item,
                            ),
                          })
                        }
                        className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                      >
                        {RULE_CONDITIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                        Niveau
                      </span>
                      <select
                        value={rule.level}
                        onChange={(event) =>
                          onChange({
                            ...normalizedValue,
                            rules: normalizedValue.rules.map((item) =>
                              item.id === rule.id
                                ? {
                                    ...item,
                                    level: event.target.value as SmartFeedbackLevel,
                                  }
                                : item,
                            ),
                          })
                        }
                        className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                      >
                        {FEEDBACK_LEVELS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...normalizedValue,
                          rules: normalizedValue.rules.filter((item) => item.id !== rule.id),
                        })
                      }
                      className="self-end text-xs font-black uppercase tracking-[0.12em] text-[#b45247]"
                    >
                      Supprimer la regle
                    </button>
                  </div>

                  <label className="space-y-2">
                    <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                      Valeur
                    </span>
                    <input
                      type="text"
                      value={
                        Array.isArray(rule.value)
                          ? rule.value.join(", ")
                          : typeof rule.value === "number"
                            ? String(rule.value)
                            : ""
                      }
                      onChange={(event) =>
                        onChange({
                          ...normalizedValue,
                          rules: normalizedValue.rules.map((item) =>
                            item.id === rule.id
                              ? {
                                  ...item,
                                  value:
                                    rule.condition === "length_between"
                                      ? (() => {
                                          const [minValue, maxValue] = event.target.value
                                            .split(",")
                                            .map((entry) => Number(entry.trim()) || 0);

                                          return [minValue, maxValue] as [number, number];
                                        })()
                                      : rule.condition === "contains_generic_words" ||
                                          rule.condition === "contains_required_keywords"
                                        ? event.target.value
                                            .split(",")
                                            .map((entry) => entry.trim())
                                            .filter(Boolean)
                                        : Number(event.target.value) || 0,
                                }
                              : item,
                          ),
                        })
                      }
                      className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                      Message
                    </span>
                    <textarea
                      value={rule.message}
                      onChange={(event) =>
                        onChange({
                          ...normalizedValue,
                          rules: normalizedValue.rules.map((item) =>
                            item.id === rule.id
                              ? { ...item, message: event.target.value }
                              : item,
                          ),
                        })
                      }
                      className="min-h-20 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
                    />
                  </label>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
