import "server-only";

import { isMissingDatabaseObject } from "@/lib/database-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BrandProject, WorkspaceModule } from "@/lib/training-types";

export const ACTION_STATUSES = [
  "Idée",
  "À préparer",
  "Planifiée",
  "En cours",
  "Terminée",
  "En pause",
] as const;

export const ACTION_OBJECTIVES = [
  "Me faire connaître",
  "Créer du lien",
  "Faire comprendre mon expertise",
  "Renforcer la confiance",
  "Obtenir des contacts",
  "Développer mes ventes",
  "Fidéliser mes clients",
  "Lancer une nouveauté",
  "Autre",
] as const;

export const ACTION_TYPES = [
  "Réseaux sociaux",
  "Newsletter / Email",
  "Site internet",
  "Référencement",
  "Événement",
  "Salon professionnel",
  "Presse",
  "Influence",
  "Partenariat",
  "Prospection",
  "Supports imprimés",
  "Communication locale",
  "Relation client",
  "Lancement",
  "Autre",
] as const;

export const ACTION_RESOURCES = [
  "Temps",
  "Graphiste",
  "Photographe",
  "Imprimeur",
  "Lieu",
  "Budget publicitaire",
  "Outil",
  "Partenaire",
  "Prestataire",
] as const;

export type ImpactLevel = "Faible" | "Moyen" | "Fort";
export type EffortLevel = "Léger" | "Moyen" | "Important";
export type ActionStatus = (typeof ACTION_STATUSES)[number];
export type ActionView = "table" | "kanban";

export type CommunicationAction = {
  id: string;
  user_id: number;
  project_id: number;
  source_idea_id: string | null;
  title: string;
  description: string | null;
  objective: string | null;
  secondary_objective: string | null;
  target_audience: string[];
  action_type: string | null;
  start_date: string | null;
  target_month: string | null;
  target_quarter: string | null;
  recurrence: string | null;
  impact_level: ImpactLevel | null;
  effort_level: EffortLevel | null;
  calculated_priority: string | null;
  estimated_budget: number | null;
  required_resources: string[];
  external_help_needed: string | null;
  first_step: string | null;
  status: ActionStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CommunicationActionInput = {
  id?: string;
  source_idea_id?: string | null;
  title: string;
  description?: string | null;
  objective?: string | null;
  secondary_objective?: string | null;
  target_audience?: string[];
  action_type?: string | null;
  start_date?: string | null;
  target_month?: string | null;
  target_quarter?: string | null;
  recurrence?: string | null;
  impact_level?: ImpactLevel | null;
  effort_level?: EffortLevel | null;
  estimated_budget?: number | null;
  required_resources?: string[];
  external_help_needed?: string | null;
  first_step?: string | null;
  status?: ActionStatus;
  sort_order?: number;
};

export type CommunicationActionSuggestion = {
  id: string;
  title: string;
  description: string;
  objective: string;
  action_type: string;
  first_step: string;
  target_audience: string[];
  rationale: string;
};

type CommunicationActionRecord = Omit<
  CommunicationAction,
  "target_audience" | "required_resources"
> & {
  target_audience: unknown;
  required_resources: unknown;
};

function toTextArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function normalizeStatus(status: string | null | undefined): ActionStatus {
  return ACTION_STATUSES.includes(status as ActionStatus)
    ? (status as ActionStatus)
    : "Idée";
}

export function calculateActionPriority(
  impactLevel?: ImpactLevel | null,
  effortLevel?: EffortLevel | null,
) {
  if (impactLevel === "Fort" && effortLevel === "Léger") {
    return "À lancer en priorité";
  }

  if (impactLevel === "Fort" && effortLevel === "Important") {
    return "À préparer";
  }

  if (impactLevel === "Faible" && effortLevel === "Important") {
    return "À reconsidérer";
  }

  return "À planifier";
}

export function mapCommunicationAction(record: CommunicationActionRecord): CommunicationAction {
  return {
    ...record,
    target_audience: toTextArray(record.target_audience),
    required_resources: toTextArray(record.required_resources),
    status: normalizeStatus(record.status),
  };
}

function getNextSortOrder(actions: CommunicationAction[]) {
  return actions.reduce((max, action) => Math.max(max, action.sort_order), 0) + 1;
}

function buildActionPayload(
  input: CommunicationActionInput,
  accountId: number,
  projectId: number,
  sortOrder: number,
) {
  const impact = input.impact_level ?? null;
  const effort = input.effort_level ?? null;

  return {
    user_id: accountId,
    project_id: projectId,
    source_idea_id: input.source_idea_id ?? null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    objective: input.objective?.trim() || null,
    secondary_objective: input.secondary_objective?.trim() || null,
    target_audience: input.target_audience ?? [],
    action_type: input.action_type?.trim() || null,
    start_date: input.start_date || null,
    target_month: input.target_month?.trim() || null,
    target_quarter: input.target_quarter?.trim() || null,
    recurrence: input.recurrence?.trim() || null,
    impact_level: impact,
    effort_level: effort,
    calculated_priority: calculateActionPriority(impact, effort),
    estimated_budget: input.estimated_budget ?? null,
    required_resources: input.required_resources ?? [],
    external_help_needed: input.external_help_needed?.trim() || null,
    first_step: input.first_step?.trim() || null,
    status: normalizeStatus(input.status),
    sort_order: input.sort_order ?? sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export async function getCommunicationActions(projectId: number) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("communication_actions")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<CommunicationActionRecord[]>();

  if (error) {
    if (isMissingDatabaseObject(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data ?? []).map(mapCommunicationAction);
}

export async function upsertCommunicationAction(input: {
  accountId: number;
  projectId: number;
  action: CommunicationActionInput;
}) {
  if (!input.action.title.trim()) {
    throw new Error("Donne un nom à ton action.");
  }

  const supabase = createSupabaseServerClient();
  const existingActions = await getCommunicationActions(input.projectId);
  const payload = buildActionPayload(
    input.action,
    input.accountId,
    input.projectId,
    getNextSortOrder(existingActions),
  );

  const query = input.action.id
    ? supabase
        .from("communication_actions")
        .update(payload)
        .eq("id", input.action.id)
        .eq("project_id", input.projectId)
    : supabase
        .from("communication_actions")
        .insert({ ...payload, created_at: new Date().toISOString() });

  const { data, error } = await query
    .select("*")
    .single<CommunicationActionRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return mapCommunicationAction(data);
}

export async function deleteCommunicationAction(input: {
  projectId: number;
  actionId: string;
}) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("communication_actions")
    .delete()
    .eq("id", input.actionId)
    .eq("project_id", input.projectId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function duplicateCommunicationAction(input: {
  accountId: number;
  projectId: number;
  actionId: string;
}) {
  const actions = await getCommunicationActions(input.projectId);
  const source = actions.find((action) => action.id === input.actionId);

  if (!source) {
    throw new Error("Action introuvable.");
  }

  return upsertCommunicationAction({
    accountId: input.accountId,
    projectId: input.projectId,
    action: {
      ...source,
      id: undefined,
      title: `${source.title} - copie`,
      status: "Idée",
      sort_order: getNextSortOrder(actions),
    },
  });
}

export async function updateCommunicationActionStatus(input: {
  projectId: number;
  actionId: string;
  status: ActionStatus;
}) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("communication_actions")
    .update({
      status: normalizeStatus(input.status),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.actionId)
    .eq("project_id", input.projectId)
    .select("*")
    .single<CommunicationActionRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return mapCommunicationAction(data);
}

export function getActionPeriodLabel(action: CommunicationAction) {
  if (action.start_date) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(`${action.start_date}T12:00:00`));
  }

  return action.target_month || action.target_quarter || "Pas encore décidé";
}

export function groupActionsByPeriod(actions: CommunicationAction[]) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const nextMonthLimit = new Date(now.getFullYear(), now.getMonth() + 4, 1);

  return {
    now: actions.filter(
      (action) =>
        action.status === "En cours" ||
        action.calculated_priority === "À lancer en priorité",
    ),
    thisMonth: actions.filter((action) => {
      if (action.target_month === currentMonth) {
        return true;
      }

      return action.start_date?.startsWith(currentMonth) ?? false;
    }),
    soon: actions.filter((action) => {
      if (!action.start_date) {
        return false;
      }

      const date = new Date(`${action.start_date}T12:00:00`);
      return date > now && date < nextMonthLimit && !action.start_date.startsWith(currentMonth);
    }),
    later: actions.filter(
      (action) => !action.start_date && !action.target_month && !action.target_quarter,
    ),
  };
}

function collectAnswerSignals(modules: WorkspaceModule[]) {
  const values = modules.flatMap((module) =>
    module.exercises.flatMap((exercise) => module.answers[exercise.id] ?? []),
  );
  const text = values.join(" ").toLowerCase();
  const audiences = Array.from(
    new Set(
      values
        .filter((value) =>
          /client|cible|audience|persona|prospect|partenaire|prescripteur/i.test(value),
        )
        .map((value) => value.replace(/__answer_item__:\d+:\d+:/g, "").trim())
        .filter(Boolean)
        .slice(0, 4),
    ),
  );

  return { text, audiences };
}

export function getSuggestedCommunicationActions(input: {
  project: BrandProject;
  modules: WorkspaceModule[];
}) {
  const signals = collectAnswerSignals(input.modules);
  const target = signals.audiences.length > 0 ? signals.audiences : ["Prospects"];
  const suggestions: CommunicationActionSuggestion[] = [];

  if (/expert|savoir|conseil|strategie|stratégie|accompagn/i.test(signals.text)) {
    suggestions.push({
      id: "expertise-content",
      title: "Publier une série de contenus conseils",
      description:
        "Transformer ton expertise en 3 à 5 contenus simples pour aider ton audience à comprendre ta valeur.",
      objective: "Faire comprendre mon expertise",
      action_type: "Réseaux sociaux",
      first_step: "Lister les trois questions que tes clients te posent le plus souvent.",
      target_audience: target,
      rationale: "Tes réponses mettent en avant une posture d'expertise ou d'accompagnement.",
    });
  }

  if (/local|proxim|lieu|ville|territoire|salon|evenement|événement/i.test(signals.text)) {
    suggestions.push({
      id: "local-partnership",
      title: "Créer une action de visibilité locale",
      description:
        "Identifier un lieu, un partenaire ou un événement local où ta marque peut être visible.",
      objective: "Me faire connaître",
      action_type: "Communication locale",
      first_step: "Choisir trois lieux ou partenaires à contacter cette semaine.",
      target_audience: target,
      rationale: "Certaines réponses évoquent la proximité, le terrain ou l'événementiel.",
    });
  }

  if (/confiance|preuve|temoignage|témoignage|client|reassur|rassur/i.test(signals.text)) {
    suggestions.push({
      id: "client-proof",
      title: "Collecter des témoignages clients",
      description:
        "Demander un retour court à quelques clients pour renforcer la confiance autour de ton offre.",
      objective: "Renforcer la confiance",
      action_type: "Relation client",
      first_step: "Préparer un message simple à envoyer à trois clients satisfaits.",
      target_audience: ["Prospects", "Clients actuels"],
      rationale: "Le besoin de rassurer ou de prouver la valeur de la marque ressort du parcours.",
    });
  }

  suggestions.push({
    id: "monthly-newsletter",
    title: "Lancer une newsletter mensuelle",
    description:
      "Créer un rendez-vous simple pour garder le lien et partager les actualités importantes.",
    objective: "Créer du lien",
    action_type: "Newsletter / Email",
    first_step: "Choisir l'outil d'envoi et définir le thème du premier email.",
    target_audience: target,
    rationale: "C'est une action durable qui complète les réseaux sociaux sans dépendre d'un algorithme.",
  });

  return suggestions.slice(0, 4);
}
