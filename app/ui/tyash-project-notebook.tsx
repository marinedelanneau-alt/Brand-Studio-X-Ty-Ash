"use client";

import Link from "next/link";
import localFont from "next/font/local";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveBrandGuideExport } from "@/app/brand-guide/actions";
import type { GeneratedBrandGuide } from "@/lib/brand-guide";
import { TYASH_NOTEBOOK_TAGLINE } from "@/lib/tyash-project-notebook";
import type { NotebookAnswer } from "@/lib/tyash-module-notebook-data";
import SummaryAnswerTable from "./summary-answer-table";
import { TYASH_PAPER_STYLE } from "@/lib/tyash-paper";

const display = localFont({ src: "../../public/fonts/tyash-archivo-display.ttf", weight: "900", display: "swap" });
const editorial = localFont({ src: "../../public/fonts/tyash-instrument-serif-italic.ttf", weight: "400", style: "italic", display: "swap" });
const button = "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#C9C2AF] bg-[#fffdf5] px-4 py-2 text-xs font-extrabold uppercase tracking-wider disabled:opacity-50";
const date = (value: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(value));

function Answer({ answer }: { answer: NotebookAnswer }) {
  return <div className="min-w-0 border-b border-[#C9C2AF] py-6 [overflow-wrap:anywhere]">
    <h4 className="font-bold leading-7">{answer.question}</h4>
    {answer.spectrum ? <div className="mt-4">
      <div className="flex justify-between gap-6 text-sm"><span className="max-w-[45%]">{answer.spectrum.left}</span><span className="max-w-[45%] text-right">{answer.spectrum.right}</span></div>
      <svg viewBox="0 0 500 31" className="mt-2 w-full" role="img" aria-label={`${answer.spectrum.left} / ${answer.spectrum.right} : ${answer.spectrum.score === null ? "À compléter" : `${answer.spectrum.score}/100`}`}>
        <line x1="12" y1="12" x2="482" y2="12" stroke="#C9C2AF" strokeWidth="2" />
        {[0, 25, 50, 75, 100].map(value => <line key={value} x1={12 + value * 4.7} y1="8" x2={12 + value * 4.7} y2="16" stroke="#746F62" />)}
        {answer.spectrum.score !== null ? <><line x1="12" y1="12" x2={12 + answer.spectrum.score * 4.7} y2="12" stroke="#991D25" strokeWidth="2" /><circle cx={12 + answer.spectrum.score * 4.7} cy="12" r="4.5" fill="#991D25" /></> : null}
      </svg>
      <p className="text-sm text-[#991D25]">{answer.spectrum.score === null ? "À compléter" : `Position choisie : ${answer.spectrum.score}/100`}</p>
      {answer.value ? <p className="mt-4 whitespace-pre-wrap leading-8">{answer.value}</p> : null}
    </div> : !answer.answered ? <p className={`${editorial.className} mt-2 text-2xl text-[#746F62]`}>À compléter</p> : answer.table ? <div className="mt-4 overflow-x-auto"><SummaryAnswerTable table={answer.table} /></div> : <p className="mt-3 whitespace-pre-wrap leading-8 text-[#34332D]">{answer.value}</p>}
  </div>;
}

export default function TyashProjectNotebookLayout({ guide, latestGeneratedAt, readOnly = false, backHref = "/mon-espace", backLabel = "Retour à mon espace" }: {
  guide: GeneratedBrandGuide; latestGeneratedAt: string | null; readOnly?: boolean; backHref?: string; backLabel?: string;
}) {
  const notebook = guide.projectNotebook!;
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const complete = notebook.total > 0 && notebook.answered === notebook.total;
  async function download() {
    setDownloading(true);
    try {
      const response = await fetch("/brand-guide/download", { cache: "no-store" });
      if (!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf")) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url;
      link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "carnet-de-projet.pdf";
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Votre carnet de projet a été téléchargé.");
    } catch { setMessage("Le téléchargement a échoué. Veuillez réessayer."); }
    finally { setDownloading(false); }
  }
  return <main className="min-h-screen px-4 py-8 text-[#111110] sm:px-6" style={TYASH_PAPER_STYLE}>
    <div className="mx-auto max-w-5xl">
      <nav className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Actions du carnet">
        <Link href={backHref} className={button}>{backLabel}</Link>
        {!readOnly ? <button
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#991D25] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#7D1820] disabled:cursor-wait disabled:opacity-50"
          disabled={downloading}
          aria-busy={downloading}
          onClick={() => void download()}
        >{downloading ? "Préparation…" : "Télécharger mon carnet"}</button> : null}
      </nav>
      <section className="mb-8 rounded-2xl border border-[#C9C2AF] bg-[#fffdf5] p-5 sm:p-7" aria-label="État du carnet">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#991D25]">ÉTAT DU CARNET</h2>
            <p className="mt-3 font-semibold">{complete ? "Votre carnet est complet." : "Votre carnet contient des éléments à compléter."}</p>
            <p className="mt-2 text-sm">{notebook.answered} / {notebook.total} exercices renseignés</p>
            {latestGeneratedAt ? <p className="mt-2 text-xs text-[#746F62]">Dernière sauvegarde : {date(latestGeneratedAt)}</p> : null}
          </div>
          {!readOnly ? <button className={button} disabled={pending} onClick={() => startTransition(async () => { const result = await saveBrandGuideExport(guide); setMessage(result.message); if (result.status === "success") router.refresh(); })}>{pending ? "Actualisation…" : latestGeneratedAt ? "Actualiser" : "Créer mon carnet"}</button> : null}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {notebook.modules.map(module => <Link key={module.id} href={module.href} className="min-w-0 rounded-xl border border-[#C9C2AF] p-4">
            <p className="font-bold [overflow-wrap:anywhere]">{module.title}</p><p className="mt-2 text-sm">{module.answered} / {module.total} exercices — {module.completionPercent}%</p>
            <div className="mt-3 h-1 bg-[#E5DFC9]" role="progressbar" aria-label={module.title} aria-valuenow={module.completionPercent} aria-valuemin={0} aria-valuemax={100}><div className="h-1 bg-[#991D25]" style={{ width: `${Math.max(0, Math.min(module.completionPercent, 100))}%` }} /></div>
          </Link>)}
        </div>
        {message ? <p role="status" className="mt-4 text-sm font-semibold">{message}</p> : null}
      </section>
      <article id="brand-guide-document" className="[overflow-wrap:anywhere]">
        <header className="border-b border-[#C9C2AF] py-10 sm:py-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#991D25]">BRAND STUDIO × TYASH</p>
          <h1 className={`${display.className} mt-7 text-[clamp(2.8rem,8vw,5.5rem)] leading-none uppercase`}>{readOnly ? "BRIEF STRATÉGIQUE VIDÉO" : "TON CARNET DE PROJET"}</h1>
          <p className="mt-6 text-2xl">{notebook.projectName}</p>
          <p className={`${editorial.className} mt-7 max-w-3xl text-3xl leading-tight text-[#991D25] sm:text-4xl`}>{TYASH_NOTEBOOK_TAGLINE}</p>
          <p className="mt-7 text-xs uppercase tracking-widest text-[#746F62]">Généré le {date(notebook.generatedAt)}</p>
        </header>
        {notebook.modules.map(module => <section key={module.id} className="mt-12">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#991D25]">MODULE {String(module.position).padStart(2, "0")}</p>
          <h2 className={`${display.className} mt-3 text-4xl leading-tight uppercase sm:text-5xl`}>{module.title}</h2>
          {module.sections.map(section => <section key={section.id} className="mt-9 rounded-2xl border border-[#C9C2AF] bg-[#fffdf5]/90 p-5 sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#991D25]">{String(module.position).padStart(2, "0")} / {String(section.position).padStart(2, "0")}</p>
            <h3 className={`${display.className} mt-3 border-b border-[#C9C2AF] pb-5 text-3xl uppercase sm:text-4xl`}>{section.title}</h3>
            {section.answers.map(answer => <Answer key={answer.id} answer={answer} />)}
          </section>)}
        </section>)}
        <section className="mt-12 border-t border-[#C9C2AF] py-10">
          <h2 className={`${display.className} text-3xl uppercase sm:text-4xl`}>LE BILAN DE TON PROJET</h2>
          <p className={`${editorial.className} mt-5 text-3xl text-[#991D25]`}>À relire, à compléter, à faire évoluer.</p>
          <p className="mt-6 leading-8">{notebook.answered} réponses renseignées. {notebook.total - notebook.answered} éléments à compléter.</p>
          {notebook.modules.map(module => <p key={module.id} className="mt-4 border-b border-[#C9C2AF] pb-4">{module.title} : {module.answered} / {module.total} — {module.completionPercent}%</p>)}
        </section>
      </article>
    </div>
  </main>;
}
