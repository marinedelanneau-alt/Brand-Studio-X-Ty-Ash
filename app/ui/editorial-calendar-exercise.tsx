"use client";

import {
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo } from "react";
import {
  parseEditorialCalendarEntries,
  serializeEditorialCalendarEntries,
} from "@/lib/editorial-calendar";

const NOTION_EDITORIAL_CALENDAR_URL =
  "https://app.notion.com/p/Calendrier-ditorial-2026-a78057792efe83fbbceb01081b9458a7";

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
    <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-[#eadfca] bg-white shadow-[0_16px_34px_rgba(126,102,78,0.07)]">
      <div className="flex flex-col gap-4 border-b border-[#eadfca] bg-[#fffdf7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
            Calendrier editorial
          </p>
          <h3 className="mt-1 text-xl font-semibold text-[#4b4550]">
            Vue Notion 2026
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f645b]">
            Complete directement ton calendrier editorial dans Notion. La vue ci-dessous reprend
            ton espace de travail dedie.
          </p>
        </div>
        <a
          href={NOTION_EDITORIAL_CALENDAR_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#eadfca] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a] transition hover:border-[#cf7430] hover:text-[#cf7430]"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          Ouvrir dans Notion
        </a>
      </div>

      <div className="bg-[#fbf6ee] p-3 sm:p-4">
        <div className="overflow-hidden rounded-[1.1rem] border border-[#eadfca] bg-white">
          <iframe
            src={NOTION_EDITORIAL_CALENDAR_URL}
            title="Calendrier editorial 2026 Notion"
            className="h-[76vh] min-h-[680px] w-full bg-white"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="mt-3 flex items-start gap-3 rounded-[1rem] border border-[#eadfca] bg-white px-4 py-3 text-sm leading-6 text-[#6f645b]">
          <CalendarDaysIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#cf7430]" />
          <p>
            Si Notion demande une connexion ou ouvre une page blanche dans l&apos;integration, utilise
            le bouton ci-dessus pour acceder au calendrier dans un nouvel onglet.
          </p>
        </div>
      </div>
    </div>
  );
}
