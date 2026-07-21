import { getActiveBrandPersonaSections, getBrandPersonaFields, parseStoredBrandPersonaConfig } from "@/lib/brand-persona";
import { parseIndexedAnswerItems } from "@/lib/exercise-types";
import type { WorkspaceModule } from "@/lib/training-types";

export type PersonaCv = {
  firstName: string;
  profile: string;
  traits: string;
  tone: string;
  values: string;
  interactions: string;
  quote: string;
  sections: Array<{ title: string; entries: Array<{ label: string; value: string }> }>;
};

export function buildPersonaCv(exercise: WorkspaceModule["exercises"][number], answers: string[]): PersonaCv {
  const config = parseStoredBrandPersonaConfig(exercise.options);
  const fields = getBrandPersonaFields(config);
  const indexed = parseIndexedAnswerItems(answers);
  const valueForIndex = (index: number) => indexed.filter((item) => item.questionIndex === index)
    .sort((a, b) => a.valueIndex - b.valueIndex).map((item) => item.value.trim()).filter(Boolean).join(", ");
  const valueForId = (id: string) => {
    const index = fields.findIndex((field) => field.id === id);
    return index < 0 ? "" : valueForIndex(index);
  };
  const join = (ids: string[]) => ids.map(valueForId).filter(Boolean).join(" • ");

  return {
    firstName: valueForId("persona_first_name"),
    profile: join(["persona_age_approx", "persona_symbolic_profession", "persona_summary_sentence"]),
    traits: valueForId("dominant_traits"),
    tone: valueForId("tone_of_voice"),
    values: join(["core_priority", "defends", "credibility_source"]),
    interactions: join(["welcome_style", "reassurance_style", "advisor_type"]),
    quote: valueForId("defining_quote"),
    sections: getActiveBrandPersonaSections(config).map((section) => ({
      title: section.title,
      entries: section.questions.flatMap((question) => {
        const index = fields.findIndex((field) => field.id === question.id);
        const value = index < 0 ? "" : valueForIndex(index);
        return value ? [{ label: question.label.replace(/\[prenom\]/gi, valueForId("persona_first_name") || "La marque"), value }] : [];
      }),
    })).filter((section) => section.entries.length > 0),
  };
}
