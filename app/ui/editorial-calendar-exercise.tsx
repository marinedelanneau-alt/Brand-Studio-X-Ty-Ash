"use client";

import {
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
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
        <div className="grid gap-4 rounded-[1.1rem] border border-[#eadfca] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_18rem] sm:p-5">
          <div className="flex min-h-72 flex-col justify-between rounded-[1rem] border border-[#eadfca] bg-[#fffdf8] p-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b625a]">
                <CalendarDaysIcon className="h-4 w-4 text-[#cf7430]" />
                Notion
              </div>
              <h4 className="mt-6 max-w-2xl text-2xl font-semibold text-[#2f2a36]">
                Calendrier editorial 2026
              </h4>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f645b]">
                Ton calendrier editorial est gere dans Notion pour conserver la vue complete, les
                cartes et les statuts de publication au meme endroit.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Vue Notion", "Mises a jour en direct", "Acces complet"].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-3 py-2 text-xs font-semibold text-[#6f645b]"
                >
                  <CheckCircleIcon className="h-4 w-4 text-[#cf7430]" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[1rem] border border-[#eadfca] bg-[#faf6ef] p-4">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, index) => (
                <div
                  key={index}
                  className={`aspect-square rounded-[0.45rem] border border-[#eadfca] ${
                    [4, 9, 15, 22, 28].includes(index)
                      ? "bg-[#cf7430]"
                      : index % 6 === 0
                        ? "bg-[#f3dfbd]"
                        : "bg-white"
                  }`}
                />
              ))}
            </div>
            <a
              href={NOTION_EDITORIAL_CALENDAR_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2f2a36] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#cf7430]"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              Acceder au calendrier
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
