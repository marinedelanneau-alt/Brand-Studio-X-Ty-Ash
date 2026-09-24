"use client";

import {
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import {
  parseEditorialCalendarEntries,
  serializeEditorialCalendarEntries,
} from "@/lib/editorial-calendar";

const NOTION_EDITORIAL_CALENDAR_URL =
  "https://app.notion.com/p/Calendrier-ditorial-2026-a78057792efe83fbbceb01081b9458a7";
const CANVA_TEMPLATES_URL =
  "https://www.canva.com/design/DAHP2_LsQcU/eJAHoEt6GUN3JoluV9iZ0A/edit?ui=e30";

function getNotionCalendarAnswer() {
  return serializeEditorialCalendarEntries([
    {
      id: "notion-editorial-calendar-2026",
      date: "2026-01-01",
      title: "Calendrier editorial Notion 2026",
      channel: "Notion",
      status: "scheduled",
      notes: NOTION_EDITORIAL_CALENDAR_URL,
    },
  ]);
}

export default function EditorialCalendarExercise({
  answers,
  onChange,
}: {
  answers: string[];
  onChange: (nextValues: string[]) => void;
}) {
  const entries = useMemo(() => parseEditorialCalendarEntries(answers), [answers]);

  useEffect(() => {
    if (entries.length > 0) {
      return;
    }

    onChange(getNotionCalendarAnswer());
  }, [entries.length, onChange]);

  return (
    <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_16px_34px_rgba(126,102,78,0.07)]">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">
            Calendrier editorial
          </p>
          <h3 className="mt-1 text-xl font-semibold text-[var(--heading-color)]">
            Vue Notion 2026
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-primary)]">
            Complete directement ton calendrier editorial dans Notion. La vue ci-dessous reprend
            ton espace de travail dedie.
          </p>
        </div>
        <a
          href={NOTION_EDITORIAL_CALENDAR_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-black uppercase tracking-[0.12em] text-[var(--text-primary)] transition hover:border-[var(--tyash-primary)] hover:text-[var(--tyash-label-text)]"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          Ouvrir dans Notion
        </a>
      </div>

      <div className="bg-[var(--background)] p-3 sm:p-4">
        <a
          href={NOTION_EDITORIAL_CALENDAR_URL}
          target="_blank"
          rel="noreferrer"
          className="group relative block overflow-hidden rounded-[1.1rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_16px_34px_rgba(126,102,78,0.08)]"
          aria-label="Ouvrir le calendrier editorial Notion"
        >
          <Image
            src="/notion-editorial-calendar-preview.png"
            alt="Apercu de la page Notion Calendrier editorial 2026"
            width={1440}
            height={1000}
            sizes="(max-width: 768px) 100vw, 1080px"
            className="w-full object-cover object-top"
            priority
          />
          <span className="absolute right-4 top-4 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--card)]/95 px-4 text-xs font-black uppercase tracking-[0.12em] text-[var(--heading-color)] opacity-100 shadow-[0_10px_24px_rgba(47,42,54,0.14)] transition group-hover:bg-[#2f2a36] group-hover:text-white sm:opacity-0 sm:group-hover:opacity-100">
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            Ouvrir
          </span>
        </a>
        <div className="mt-3 flex items-start gap-3 rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)]">
          <CalendarDaysIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--tyash-label-text)]" />
          <p>
            Apercu direct de la page Notion. Clique sur l&apos;image ou sur le bouton pour modifier le
            calendrier complet dans Notion.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
        <div className="overflow-hidden rounded-[1.1rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_16px_34px_rgba(126,102,78,0.08)]">
          <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--tyash-soft)] text-[var(--tyash-label-text)]">
                <RectangleGroupIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">
                  Templates Canva
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--heading-color)]">
                  Crée tes contenus plus rapidement
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-primary)]">
                  Retrouve les templates prêts à personnaliser pour transformer ton calendrier
                  éditorial en publications cohérentes avec ta marque.
                </p>
              </div>
            </div>

            <a
              href={CANVA_TEMPLATES_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--tyash-primary)] px-5 text-xs font-black uppercase tracking-[0.12em] text-[var(--tyash-text-on-primary)] shadow-[0_10px_24px_rgb(var(--tyash-glow-rgb)/0.22)] transition hover:bg-[var(--tyash-primary-hover)]"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              Ouvrir les templates
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
