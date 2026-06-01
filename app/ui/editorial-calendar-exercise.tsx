"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import {
  EDITORIAL_CALENDAR_STATUS_LABELS,
  parseEditorialCalendarEntries,
  serializeEditorialCalendarEntries,
  type EditorialCalendarEntry,
  type EditorialCalendarStatus,
} from "@/lib/editorial-calendar";

const WEEKDAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const STATUS_STYLES: Record<EditorialCalendarStatus, string> = {
  idea: "bg-[#f2eef7] text-[#7a7087]",
  draft: "bg-[#f4e4f8] text-[#8b5aa2]",
  scheduled: "bg-[#dcefe5] text-[#4f8a6a]",
  published: "bg-[#ddecff] text-[#3f78a8]",
};

type DraftEntry = EditorialCalendarEntry;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthCells(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function createDraft(date: string): DraftEntry {
  return {
    id: crypto.randomUUID(),
    date,
    title: "",
    channel: "",
    status: "idea",
    notes: "",
  };
}

export default function EditorialCalendarExercise({
  answers,
  onChange,
}: {
  answers: string[];
  onChange: (nextValues: string[]) => void;
}) {
  const entries = useMemo(() => parseEditorialCalendarEntries(answers), [answers]);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const firstEntry = entries[0]?.date;
    return firstEntry ? new Date(`${firstEntry}T12:00:00`) : new Date();
  });
  const [draft, setDraft] = useState<DraftEntry | null>(null);
  const monthCells = useMemo(() => getMonthCells(visibleMonth), [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  function persistEntries(nextEntries: EditorialCalendarEntry[]) {
    onChange(serializeEditorialCalendarEntries(nextEntries));
  }

  function saveDraft() {
    if (!draft?.title.trim()) {
      return;
    }

    const nextEntry = {
      ...draft,
      title: draft.title.trim(),
      channel: draft.channel.trim(),
      notes: draft.notes.trim(),
    };
    const exists = entries.some((entry) => entry.id === nextEntry.id);
    const nextEntries = exists
      ? entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry))
      : [...entries, nextEntry];

    persistEntries(nextEntries);
    setDraft(null);
  }

  function deleteEntry(entryId: string) {
    persistEntries(entries.filter((entry) => entry.id !== entryId));
    setDraft(null);
  }

  function moveMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-[#eadfca] bg-white shadow-[0_16px_34px_rgba(126,102,78,0.07)]">
      <div className="flex flex-col gap-4 border-b border-[#eadfca] bg-[#fffdf7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
            Calendrier editorial
          </p>
          <h3 className="mt-1 text-xl font-semibold capitalize text-[#4b4550]">
            {monthLabel}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#6b625a]"
            aria-label="Mois precedent"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date())}
            className="h-10 rounded-full border border-[#eadfca] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]"
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#6b625a]"
            aria-label="Mois suivant"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-[#eadfca] bg-[#fffaf4]">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="px-2 py-2 text-center text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#9a8f86]"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-7">
        {monthCells.map((date) => {
          const dateKey = toDateKey(date);
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
          const dayEntries = entries.filter((entry) => entry.date === dateKey);

          return (
            <div
              key={dateKey}
              className={`group min-h-36 border-b border-[#f0e4d3] px-2 py-2 sm:border-r ${
                isCurrentMonth ? "bg-white" : "bg-[#faf7f1] text-[#a8a098]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#6b625a]">
                  {date.getDate()}
                </span>
                <button
                  type="button"
                  onClick={() => setDraft(createDraft(dateKey))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#cf7430] opacity-100 transition sm:opacity-0 sm:hover:border-[#cf7430] sm:group-hover:opacity-100"
                  aria-label="Ajouter un contenu"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {dayEntries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setDraft(entry)}
                    className="group block w-full rounded-[0.7rem] border border-[#eadfca] bg-[#fffdf9] px-2 py-2 text-left shadow-[0_8px_18px_rgba(126,102,78,0.06)]"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold text-[#4b4550]">
                        {entry.title}
                      </span>
                      <PencilSquareIcon className="h-4 w-4 shrink-0 text-[#cf7430] opacity-0 transition group-hover:opacity-100" />
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      {entry.channel ? (
                        <span className="rounded-full bg-[#fff6e3] px-2 py-1 text-[0.68rem] font-semibold text-[#8b684f]">
                          {entry.channel}
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-1 text-[0.68rem] font-semibold ${STATUS_STYLES[entry.status]}`}
                      >
                        {EDITORIAL_CALENDAR_STATUS_LABELS[entry.status]}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {draft ? (
        <div className="border-t border-[#eadfca] bg-[#fffdf7] px-4 py-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_10rem_10rem]">
            <input
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              placeholder="Titre du contenu"
              className="h-12 rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-sm text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
            />
            <input
              value={draft.channel}
              onChange={(event) => setDraft({ ...draft, channel: event.target.value })}
              placeholder="Canal"
              className="h-12 rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-sm text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
            />
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  status: event.target.value as EditorialCalendarStatus,
                })
              }
              className="h-12 rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-sm text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
            >
              {Object.entries(EDITORIAL_CALENDAR_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={draft.notes}
            onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            placeholder="Notes, angle, appel a l'action..."
            className="mt-3 min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-sm text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
          />
          <div className="mt-3 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => deleteEntry(draft.id)}
              className="flex h-11 items-center gap-2 rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#9d4e40]"
            >
              <TrashIcon className="h-4 w-4" />
              Supprimer
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="h-11 rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveDraft}
                className="h-11 rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-50"
                disabled={!draft.title.trim()}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
