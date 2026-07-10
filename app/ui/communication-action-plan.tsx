"use client";

import {
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState, useTransition } from "react";
import {
  changeCommunicationActionStatus,
  copyCommunicationAction,
  removeCommunicationAction,
  saveCommunicationAction,
} from "@/app/communication-actions-actions";
import {
  ACTION_OBJECTIVES,
  ACTION_RESOURCES,
  ACTION_STATUSES,
  ACTION_TYPES,
  calculateActionPriority,
  getActionPeriodLabel,
  groupActionsByPeriod,
  type ActionStatus,
  type ActionView,
  type CommunicationAction,
  type CommunicationActionInput,
  type CommunicationActionSuggestion,
  type EffortLevel,
  type ImpactLevel,
} from "@/lib/communication-action-shared";

const TARGET_OPTIONS = [
  "Prospects",
  "Clients actuels",
  "Partenaires",
  "Prescripteurs",
  "Collaborateurs",
  "Grand public",
  "Autre",
];

const OBJECTIVE_ICONS = ["👀", "🤝", "💡", "⭐", "📩", "🛒", "💛", "🚀", "✏️"];
const TYPE_ICONS = ["📱", "✉️", "🌐", "🔎", "🎤", "🏢", "📰", "🤳", "🤝", "📞", "🖨️", "📍", "💬", "🚀", "✨"];

type Filters = {
  period: string;
  type: string;
  objective: string;
  priority: string;
  status: string;
};

type FormStep = 0 | 1 | 2 | 3 | 4 | 5;

const emptyAction: CommunicationActionInput = {
  title: "",
  description: "",
  objective: null,
  secondary_objective: null,
  target_audience: [],
  action_type: null,
  start_date: null,
  target_month: null,
  target_quarter: null,
  recurrence: "Ponctuelle",
  impact_level: "Moyen",
  effort_level: "Moyen",
  estimated_budget: null,
  required_resources: [],
  external_help_needed: "",
  first_step: "",
  status: "Idée",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getPriorityClass(priority?: string | null) {
  if (priority === "À lancer en priorité") return "border-[#d7ead5] bg-[#f1f8ed] text-[#4f7c55]";
  if (priority === "À préparer") return "border-[#f0dfba] bg-[#fff7e7] text-[#9a641f]";
  if (priority === "À reconsidérer") return "border-[#efd2cc] bg-[#fff1ee] text-[#9d4e40]";
  return "border-[#eadfca] bg-white text-[#6b625a]";
}

function getStatusClass(status: ActionStatus) {
  if (status === "Terminée") return "border-[#d7ead5] bg-[#eef8ec] text-[#4f7c55]";
  if (status === "En cours") return "border-[#d9e6f5] bg-[#eff6ff] text-[#416f9d]";
  if (status === "Planifiée") return "border-[#f0dfba] bg-[#fff7e7] text-[#9a641f]";
  if (status === "En pause") return "border-[#e2dbe9] bg-[#f8f4fb] text-[#756387]";
  return "border-[#eadfca] bg-white text-[#6b625a]";
}

function filterActions(actions: CommunicationAction[], filters: Filters) {
  return actions.filter((action) => {
    if (filters.type && action.action_type !== filters.type) return false;
    if (filters.objective && action.objective !== filters.objective) return false;
    if (filters.priority && action.calculated_priority !== filters.priority) return false;
    if (filters.status && action.status !== filters.status) return false;
    if (filters.period === "dated" && !action.start_date && !action.target_month && !action.target_quarter) return false;
    if (filters.period === "undated" && (action.start_date || action.target_month || action.target_quarter)) return false;
    return true;
  });
}

function ActionCard({
  action,
  onEdit,
  onOpen,
  onDelete,
  onDuplicate,
  onStatus,
}: {
  action: CommunicationAction;
  onEdit: (action: CommunicationAction) => void;
  onOpen: (action: CommunicationAction) => void;
  onDelete: (action: CommunicationAction) => void;
  onDuplicate: (action: CommunicationAction) => void;
  onStatus: (id: string, status: ActionStatus) => void;
}) {
  return (
    <article className="rounded-[1.15rem] border border-[#eadfca] bg-white p-4 shadow-[0_12px_28px_rgba(126,102,78,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onOpen(action)} className="min-w-0 text-left">
          <p className="text-lg font-semibold leading-6 text-[#2f2a36]">{action.title}</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6f645b]">
            {action.description || action.first_step || "Action à préciser."}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onEdit(action)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#eadfca] text-[#6b625a] transition hover:border-[#cf7430] hover:text-[#cf7430]"
          aria-label="Modifier l'action"
        >
          <PencilSquareIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {action.action_type ? <Badge>{action.action_type}</Badge> : null}
        {action.objective ? <Badge>{action.objective}</Badge> : null}
        <Badge>{getActionPeriodLabel(action)}</Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <span className={cx("rounded-[0.8rem] border px-3 py-2 text-xs font-bold", getPriorityClass(action.calculated_priority))}>
          {action.calculated_priority || "À planifier"}
        </span>
        <select
          value={action.status}
          onChange={(event) => onStatus(action.id, event.target.value as ActionStatus)}
          className={cx("h-10 rounded-[0.8rem] border px-3 text-xs font-bold outline-none", getStatusClass(action.status))}
          aria-label="Changer le statut"
        >
          {ACTION_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
      {action.first_step ? (
        <div className="mt-4 rounded-[0.95rem] border border-[#f0e4d3] bg-[#fffaf4] px-3 py-3">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#cf7430]">Première étape</p>
          <p className="mt-1 text-sm leading-6 text-[#5f544a]">{action.first_step}</p>
        </div>
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        <IconButton label="Dupliquer" onClick={() => onDuplicate(action)}>
          <DocumentDuplicateIcon className="h-4 w-4" />
        </IconButton>
        <IconButton label="Supprimer" onClick={() => onDelete(action)}>
          <TrashIcon className="h-4 w-4" />
        </IconButton>
      </div>
    </article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#eadfca] bg-[#fffdf8] px-3 py-1 text-xs font-semibold text-[#6f645b]">
      {children}
    </span>
  );
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#6b625a] transition hover:border-[#cf7430] hover:text-[#cf7430]"
    >
      {children}
    </button>
  );
}

function MultiSelect({
  values,
  options,
  onChange,
}: {
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() =>
              onChange(selected ? values.filter((value) => value !== option) : [...values, option])
            }
            className={cx(
              "rounded-full border px-3 py-2 text-xs font-bold transition",
              selected
                ? "border-[#cf7430] bg-[#fff1d5] text-[#cf7430]"
                : "border-[#eadfca] bg-white text-[#6b625a]",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function CommunicationActionForm({
  action,
  suggestionsTargets,
  onClose,
  onSaved,
}: {
  action: CommunicationActionInput;
  suggestionsTargets: string[];
  onClose: () => void;
  onSaved: (action: CommunicationAction, message: string) => void;
}) {
  const [draft, setDraft] = useState<CommunicationActionInput>(action);
  const [step, setStep] = useState<FormStep>(0);
  const [formMessage, setFormMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const priority = calculateActionPriority(draft.impact_level, draft.effort_level);
  const targetOptions = Array.from(new Set([...suggestionsTargets, ...TARGET_OPTIONS])).slice(0, 10);
  const canSave = draft.title.trim().length > 0;

  function save() {
    if (!canSave) return;
    startTransition(async () => {
      const result = await saveCommunicationAction({
        ...draft,
        calculated_priority: priority,
      } as CommunicationActionInput);
      if (result.status === "success" && result.data) {
        onSaved(result.data, result.message);
        return;
      }

      setFormMessage(result.message);
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#2f2a36]/35 px-3 py-4 backdrop-blur-sm sm:px-6">
      <div className="ml-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-[1.4rem] border border-[#eadfca] bg-[#fffaf3] shadow-[0_24px_80px_rgba(47,42,54,0.22)]">
        <div className="flex items-center justify-between border-b border-[#eadfca] bg-white px-5 py-4">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">Action communication</p>
            <p className="mt-1 text-lg font-semibold text-[#2f2a36]">
              {draft.id ? "Modifier l'action" : "Ajouter une action"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca] bg-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-[#eadfca] bg-[#fffdf8] px-5 py-3">
          {["Action", "Objectif", "Public", "Type", "Planning", "Priorité"].map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index as FormStep)}
              className={cx(
                "h-2 flex-1 rounded-full transition",
                step >= index ? "bg-[#cf7430]" : "bg-[#eadfca]",
              )}
              aria-label={label}
            />
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {formMessage ? (
            <p className="mb-4 rounded-[0.9rem] border border-[#efc6bf] bg-[#fff4f1] px-4 py-3 text-sm leading-6 text-[#9d4e40]">
              {formMessage}
            </p>
          ) : null}

          {step === 0 ? (
            <div className="space-y-4">
              <Question title="Qu'est-ce que tu veux mettre en place ?" />
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="Ex. lancer une newsletter mensuelle"
                className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-sm outline-none focus:border-[#cf7430]"
              />
              <textarea
                value={draft.description ?? ""}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                placeholder="Décris ton idée en quelques mots"
                className="min-h-28 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-sm outline-none focus:border-[#cf7430]"
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <Question title="Qu'est-ce que cette action doit t'aider à obtenir ?" />
              <div className="grid gap-3 sm:grid-cols-2">
                {ACTION_OBJECTIVES.map((objective, index) => (
                  <ChoiceCard
                    key={objective}
                    selected={draft.objective === objective}
                    onClick={() => setDraft({ ...draft, objective })}
                    label={`${OBJECTIVE_ICONS[index]} ${objective}`}
                  />
                ))}
              </div>
              <label className="block text-sm font-semibold text-[#6f645b]">
                Objectif secondaire
                <select
                  value={draft.secondary_objective ?? ""}
                  onChange={(event) => setDraft({ ...draft, secondary_objective: event.target.value || null })}
                  className="mt-2 h-11 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-3 text-sm"
                >
                  <option value="">Aucun</option>
                  {ACTION_OBJECTIVES.map((objective) => (
                    <option key={objective} value={objective}>{objective}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <Question title="À qui s'adresse principalement cette action ?" />
              <MultiSelect
                values={draft.target_audience ?? []}
                options={targetOptions}
                onChange={(target_audience) => setDraft({ ...draft, target_audience })}
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <Question title="Quel type d'action souhaites-tu mettre en place ?" />
              <div className="grid gap-3 sm:grid-cols-2">
                {ACTION_TYPES.map((type, index) => (
                  <ChoiceCard
                    key={type}
                    selected={draft.action_type === type}
                    onClick={() => setDraft({ ...draft, action_type: type })}
                    label={`${TYPE_ICONS[index]} ${type}`}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <Question title="Quand souhaites-tu lancer cette action ?" />
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-sm font-semibold text-[#6f645b]">
                  Date précise
                  <input
                    type="date"
                    value={draft.start_date ?? ""}
                    onChange={(event) => setDraft({ ...draft, start_date: event.target.value || null })}
                    className="mt-2 h-11 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-3"
                  />
                </label>
                <label className="text-sm font-semibold text-[#6f645b]">
                  Mois
                  <input
                    type="month"
                    value={draft.target_month ?? ""}
                    onChange={(event) => setDraft({ ...draft, target_month: event.target.value || null })}
                    className="mt-2 h-11 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-3"
                  />
                </label>
                <label className="text-sm font-semibold text-[#6f645b]">
                  Trimestre
                  <select
                    value={draft.target_quarter ?? ""}
                    onChange={(event) => setDraft({ ...draft, target_quarter: event.target.value || null })}
                    className="mt-2 h-11 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-3"
                  >
                    <option value="">Pas décidé</option>
                    <option value="T1">T1</option>
                    <option value="T2">T2</option>
                    <option value="T3">T3</option>
                    <option value="T4">T4</option>
                  </select>
                </label>
              </div>
              <Question title="Cette action est-elle ponctuelle ou récurrente ?" small />
              <select
                value={draft.recurrence ?? "Ponctuelle"}
                onChange={(event) => setDraft({ ...draft, recurrence: event.target.value })}
                className="h-11 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-3 text-sm"
              >
                {["Ponctuelle", "Chaque semaine", "Chaque mois", "Chaque trimestre", "Fréquence personnalisée"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-5">
              <Question title="Quel impact cette action peut-elle avoir ?" />
              <div className="flex flex-wrap gap-2">
                {(["Faible", "Moyen", "Fort"] as ImpactLevel[]).map((value) => (
                  <ChoicePill key={value} selected={draft.impact_level === value} onClick={() => setDraft({ ...draft, impact_level: value })}>{value}</ChoicePill>
                ))}
              </div>
              <Question title="Quel effort demande-t-elle ?" small />
              <div className="flex flex-wrap gap-2">
                {(["Léger", "Moyen", "Important"] as EffortLevel[]).map((value) => (
                  <ChoicePill key={value} selected={draft.effort_level === value} onClick={() => setDraft({ ...draft, effort_level: value })}>{value}</ChoicePill>
                ))}
              </div>
              <div className={cx("rounded-[1rem] border px-4 py-3 text-sm font-semibold", getPriorityClass(priority))}>
                Recommandation : {priority}
              </div>
              <Question title="De quoi as-tu besoin pour réaliser cette action ?" small />
              <MultiSelect
                values={draft.required_resources ?? []}
                options={[...ACTION_RESOURCES]}
                onChange={(required_resources) => setDraft({ ...draft, required_resources })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min="0"
                  value={draft.estimated_budget ?? ""}
                  onChange={(event) => setDraft({ ...draft, estimated_budget: event.target.value ? Number(event.target.value) : null })}
                  placeholder="Budget estimé"
                  className="h-11 rounded-[0.9rem] border border-[#eadfca] bg-white px-3 text-sm"
                />
                <input
                  value={draft.external_help_needed ?? ""}
                  onChange={(event) => setDraft({ ...draft, external_help_needed: event.target.value })}
                  placeholder="Aide extérieure utile"
                  className="h-11 rounded-[0.9rem] border border-[#eadfca] bg-white px-3 text-sm"
                />
              </div>
              <textarea
                value={draft.first_step ?? ""}
                onChange={(event) => setDraft({ ...draft, first_step: event.target.value })}
                placeholder="Quelle est la toute première chose à faire ?"
                className="min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-sm"
              />
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#eadfca] bg-white px-5 py-4">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1) as FormStep)}
            className="h-11 rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]"
            disabled={step === 0}
          >
            Retour
          </button>
          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(Math.min(5, step + 1) as FormStep)}
              className="h-11 rounded-[0.9rem] bg-[#2f2a36] px-5 text-xs font-black uppercase tracking-[0.12em] text-white"
            >
              Continuer
            </button>
          ) : (
            <button
              type="button"
              onClick={save}
              disabled={!canSave || isPending}
              className="h-11 rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-50"
            >
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Question({ title, small = false }: { title: string; small?: boolean }) {
  return (
    <p className={cx("font-semibold text-[#2f2a36]", small ? "text-base" : "text-xl")}>{title}</p>
  );
}

function ChoiceCard({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-[1rem] border px-4 py-3 text-left text-sm font-semibold transition",
        selected ? "border-[#cf7430] bg-[#fff1d5] text-[#2f2a36]" : "border-[#eadfca] bg-white text-[#6b625a]",
      )}
    >
      {label}
    </button>
  );
}

function ChoicePill({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-full border px-4 py-2 text-sm font-bold",
        selected ? "border-[#cf7430] bg-[#fff1d5] text-[#cf7430]" : "border-[#eadfca] bg-white text-[#6b625a]",
      )}
    >
      {children}
    </button>
  );
}

export default function CommunicationActionPlan({
  initialActions,
  suggestions,
  brandName,
  pdfHref,
}: {
  initialActions: CommunicationAction[];
  suggestions: CommunicationActionSuggestion[];
  brandName: string;
  pdfHref: string;
}) {
  const [actions, setActions] = useState(initialActions);
  const [view, setView] = useState<ActionView>("table");
  const [filters, setFilters] = useState<Filters>({ period: "", type: "", objective: "", priority: "", status: "" });
  const [formAction, setFormAction] = useState<CommunicationActionInput | null>(null);
  const [detailAction, setDetailAction] = useState<CommunicationAction | null>(null);
  const [message, setMessage] = useState("");
  const [hasSeenIntro, setHasSeenIntro] = useState(initialActions.length > 0);
  const [isPending, startTransition] = useTransition();
  const filteredActions = useMemo(() => filterActions(actions, filters), [actions, filters]);
  const priorityCount = actions.filter((action) => action.calculated_priority === "À lancer en priorité").length;
  const prepCount = actions.filter((action) => action.calculated_priority === "À préparer").length;
  const thisMonthCount = groupActionsByPeriod(actions).thisMonth.length;
  const nextAction = actions
    .filter((action) => action.status !== "Terminée")
    .sort((left, right) => {
      if (left.calculated_priority === "À lancer en priorité") return -1;
      if (right.calculated_priority === "À lancer en priorité") return 1;
      return (left.start_date ?? "9999").localeCompare(right.start_date ?? "9999");
    })[0];
  const suggestionTargets = Array.from(new Set(suggestions.flatMap((suggestion) => suggestion.target_audience)));

  function refreshAfterMutation(savedAction: CommunicationAction, text: string) {
    setActions((current) => {
      const exists = current.some((action) => action.id === savedAction.id);

      return exists
        ? current.map((action) => (action.id === savedAction.id ? savedAction : action))
        : [savedAction, ...current];
    });
    setHasSeenIntro(true);
    setFormAction(null);
    setMessage(text);
  }

  function handleDelete(action: CommunicationAction) {
    if (!window.confirm("Supprimer cette action de ta feuille de route ?")) return;
    startTransition(async () => {
      const result = await removeCommunicationAction(action.id);
      if (result.status === "success") {
        setActions((current) => current.filter((item) => item.id !== action.id));
      }
      setMessage(result.message);
    });
  }

  function handleDuplicate(action: CommunicationAction) {
    startTransition(async () => {
      const result = await copyCommunicationAction(action.id);
      if (result.status === "success" && result.data) {
        refreshAfterMutation(result.data, result.message);
        return;
      }

      setMessage(result.message);
    });
  }

  function handleStatus(actionId: string, status: ActionStatus) {
    setActions((current) =>
      current.map((action) => (action.id === actionId ? { ...action, status } : action)),
    );
    startTransition(async () => {
      const result = await changeCommunicationActionStatus({ actionId, status });
      setMessage(result.message);
    });
  }

  function prefillSuggestion(suggestion: CommunicationActionSuggestion) {
    setHasSeenIntro(true);
    setFormAction({
      ...emptyAction,
      title: suggestion.title,
      description: suggestion.description,
      objective: suggestion.objective,
      action_type: suggestion.action_type,
      first_step: suggestion.first_step,
      target_audience: suggestion.target_audience,
    });
  }

  if (!hasSeenIntro) {
    return (
      <section className="rounded-[2rem] border border-[#eadfca] bg-white/92 p-6 shadow-[0_18px_46px_rgba(126,102,78,0.08)] sm:p-8">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">Mon plan d&apos;action communication</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-[#2f2a36] sm:text-4xl">
          Transforme tes idées en actions concrètes
        </h1>
        <div className="mt-6 max-w-3xl space-y-4 text-base leading-8 text-[#6f645b]">
          <p>Tu as maintenant posé les bases de ta marque. Il est temps de décider comment tu vas la faire vivre et la faire connaître.</p>
          <p>Dans cet espace, tu vas construire ta feuille de route communication : les actions que tu souhaites lancer, leur objectif, leur priorité et le moment où tu souhaites les réaliser.</p>
          <p>Pas besoin d&apos;en faire trop. L&apos;objectif est de choisir les bonnes actions pour ta marque, puis de les organiser pour savoir exactement par quoi commencer.</p>
        </div>
        <div className="mt-6 rounded-[1.1rem] border border-[#f0dfba] bg-[#fff8e8] px-5 py-4 text-sm leading-7 text-[#6f645b]">
          <strong className="text-[#cf7430]">Conseil</strong> : Commence petit. Trois actions réellement mises en place auront toujours plus d&apos;impact qu&apos;une liste de vingt idées qui restent dans un carnet.
        </div>
        <button
          type="button"
          onClick={() => setHasSeenIntro(true)}
          className="mt-7 inline-flex h-12 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white"
        >
          Construire ma feuille de route
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#eadfca] bg-white/92 p-5 shadow-[0_18px_46px_rgba(126,102,78,0.08)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">Mon plan d&apos;action communication</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#2f2a36]">Ma feuille de route communication</h1>
            <p className="mt-2 text-sm leading-6 text-[#6f645b]">
              Tes prochaines actions pour {brandName}, organisées au même endroit.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={pdfHref} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#eadfca] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Télécharger ma feuille de route
            </a>
            <button
              type="button"
              onClick={() => setFormAction(emptyAction)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#2f2a36] px-4 text-xs font-black uppercase tracking-[0.12em] text-white"
            >
              <PlusIcon className="h-4 w-4" />
              Ajouter une action
            </button>
          </div>
        </div>
        {message ? <p className="mt-4 rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf8] px-4 py-3 text-sm text-[#6f645b]">{message}</p> : null}
      </section>

      {actions.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-3">
          <SummaryTile value={priorityCount} label="actions prioritaires" />
          <SummaryTile value={prepCount} label="actions à préparer" />
          <SummaryTile value={thisMonthCount} label="actions prévues ce mois-ci" />
        </section>
      ) : null}

      {nextAction ? (
        <section className="rounded-[1.4rem] border border-[#eadfca] bg-[#fffdf8] p-5">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">Ta prochaine étape</p>
          <h2 className="mt-2 text-xl font-semibold text-[#2f2a36]">{nextAction.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#6f645b]">Première action : {nextAction.first_step || "Préciser la première étape."}</p>
          <button
            type="button"
            onClick={() => handleStatus(nextAction.id, "En cours")}
            className="mt-4 h-10 rounded-full bg-[#2f2a36] px-4 text-xs font-black uppercase tracking-[0.12em] text-white"
          >
            Je m&apos;y mets
          </button>
        </section>
      ) : null}

      <section className="rounded-[1.4rem] border border-[#eadfca] bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["table", "kanban"] as ActionView[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={cx("h-10 rounded-full border px-4 text-xs font-black uppercase tracking-[0.12em]", view === item ? "border-[#cf7430] bg-[#fff1d5] text-[#cf7430]" : "border-[#eadfca] bg-white text-[#6b625a]")}
              >
                {item === "table" ? "Tableau" : "Kanban"}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect value={filters.period} onChange={(period) => setFilters({ ...filters, period })} options={[["", "Période"], ["dated", "Planifiées"], ["undated", "Sans date"]]} />
            <FilterSelect value={filters.type} onChange={(type) => setFilters({ ...filters, type })} options={[["", "Type"], ...ACTION_TYPES.map((item) => [item, item] as [string, string])]} />
            <FilterSelect value={filters.objective} onChange={(objective) => setFilters({ ...filters, objective })} options={[["", "Objectif"], ...ACTION_OBJECTIVES.map((item) => [item, item] as [string, string])]} />
            <FilterSelect value={filters.priority} onChange={(priority) => setFilters({ ...filters, priority })} options={[["", "Priorité"], ["À lancer en priorité", "Prioritaire"], ["À préparer", "À préparer"], ["À planifier", "À planifier"], ["À reconsidérer", "À reconsidérer"]]} />
            <button type="button" onClick={() => setFilters({ period: "", type: "", objective: "", priority: "", status: "" })} className="h-10 rounded-full border border-[#eadfca] bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]">Réinitialiser</button>
          </div>
        </div>
      </section>

      {actions.length === 0 ? (
        <section className="rounded-[1.4rem] border border-dashed border-[#eadfca] bg-white/80 p-8 text-center">
          <ClipboardDocumentListIcon className="mx-auto h-10 w-10 text-[#cf7430]" />
          <h2 className="mt-4 text-xl font-semibold text-[#2f2a36]">Ta feuille de route est prête à être construite.</h2>
          <p className="mt-2 text-sm leading-6 text-[#6f645b]">Ajoute une première action concrète pour savoir exactement par quoi commencer.</p>
        </section>
      ) : null}

      {view === "table" ? (
        <div className="overflow-hidden rounded-[1.4rem] border border-[#eadfca] bg-white">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr] gap-3 border-b border-[#eadfca] bg-[#fffdf8] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#7a7087] lg:grid">
            <span>Action</span><span>Objectif</span><span>Type</span><span>Date</span><span>Priorité</span><span>Statut</span>
          </div>
          {filteredActions.map((action) => (
            <button key={action.id} type="button" onClick={() => setDetailAction(action)} className="grid w-full gap-2 border-b border-[#f0e4d3] px-4 py-4 text-left text-sm lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr]">
              <strong className="text-[#2f2a36]">{action.title}</strong>
              <span>{action.objective || "-"}</span>
              <span>{action.action_type || "-"}</span>
              <span>{getActionPeriodLabel(action)}</span>
              <span>{action.calculated_priority}</span>
              <span>{action.status}</span>
            </button>
          ))}
        </div>
      ) : null}

      {view === "kanban" ? (
        <div className="grid gap-4 lg:grid-cols-5">
          {(["Idée", "À préparer", "Planifiée", "En cours", "Terminée"] as ActionStatus[]).map((status) => (
            <section key={status} className="rounded-[1.2rem] border border-[#eadfca] bg-[#fffdf8] p-3">
              <h3 className="px-2 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#6b625a]">{status}</h3>
              <div className="mt-2 space-y-3">
                {filteredActions.filter((action) => action.status === status).map((action) => (
                  <ActionCard key={action.id} action={action} onEdit={setFormAction} onOpen={setDetailAction} onDelete={handleDelete} onDuplicate={handleDuplicate} onStatus={handleStatus} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      <section className="rounded-[1.4rem] border border-[#eadfca] bg-white p-5">
        <div className="flex items-center gap-3">
          <SparklesIcon className="h-6 w-6 text-[#cf7430]" />
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">Besoin d&apos;idées ?</p>
            <p className="mt-1 text-sm text-[#6f645b]">D&apos;après les réponses déjà données dans Brand Studio, voici quelques pistes à explorer.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-[1rem] border border-[#eadfca] bg-[#fffdf8] p-4">
              <h3 className="text-lg font-semibold text-[#2f2a36]">{suggestion.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f645b]">{suggestion.description}</p>
              <p className="mt-3 text-xs font-semibold text-[#7a7087]">{suggestion.rationale}</p>
              <button type="button" onClick={() => prefillSuggestion(suggestion)} className="mt-4 h-10 rounded-full border border-[#cf7430] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#cf7430]">
                Ajouter à ma feuille de route
              </button>
            </article>
          ))}
        </div>
      </section>

      {formAction ? (
        <CommunicationActionForm
          action={formAction}
          suggestionsTargets={suggestionTargets}
          onClose={() => setFormAction(null)}
          onSaved={refreshAfterMutation}
        />
      ) : null}

      {detailAction ? (
        <div className="fixed inset-0 z-40 bg-[#2f2a36]/35 px-3 py-4 backdrop-blur-sm sm:px-6">
          <div className="ml-auto h-full max-w-2xl overflow-y-auto rounded-[1.4rem] border border-[#eadfca] bg-white p-5 shadow-[0_24px_80px_rgba(47,42,54,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">Détail de l&apos;action</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#2f2a36]">{detailAction.title}</h2>
              </div>
              <button type="button" onClick={() => setDetailAction(null)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca]">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[#6f645b]">
              <DetailRow label="Description" value={detailAction.description} />
              <DetailRow label="Objectif" value={detailAction.objective} />
              <DetailRow label="Public" value={detailAction.target_audience.join(", ")} />
              <DetailRow label="Type" value={detailAction.action_type} />
              <DetailRow label="Période" value={getActionPeriodLabel(detailAction)} />
              <DetailRow label="Récurrence" value={detailAction.recurrence} />
              <DetailRow label="Priorité" value={detailAction.calculated_priority} />
              <DetailRow label="Ressources" value={detailAction.required_resources.join(", ")} />
              <DetailRow label="Aide extérieure" value={detailAction.external_help_needed} />
              <DetailRow label="Première étape" value={detailAction.first_step} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setFormAction(detailAction)} className="h-11 rounded-full bg-[#2f2a36] px-4 text-xs font-black uppercase tracking-[0.12em] text-white">Modifier</button>
              <button type="button" className="h-11 rounded-full border border-[#eadfca] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]">Créer des contenus associés</button>
            </div>
          </div>
        </div>
      ) : null}

      {isPending ? <p className="text-sm text-[#7a7087]">Sauvegarde en cours...</p> : null}
    </div>
  );
}

function SummaryTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[#eadfca] bg-white p-5">
      <p className="text-3xl font-black text-[#2f2a36]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#6f645b]">{label}</p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-full border border-[#eadfca] bg-white px-3 text-xs font-bold text-[#6b625a]">
      {options.map(([optionValue, label]) => (
        <option key={`${label}-${optionValue}`} value={optionValue}>{label}</option>
      ))}
    </select>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="rounded-[1rem] border border-[#eadfca] bg-[#fffdf8] px-4 py-3">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#cf7430]">{label}</p>
      <p className="mt-1 text-[#5f544a]">{value}</p>
    </div>
  );
}
