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
export type ActionView = "timeline" | "table" | "kanban";

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
