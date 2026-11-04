"use client";
import type { SubmoduleEditorialIntroduction } from "@/lib/training-types";
import SubmoduleIntroduction from "./submodule-introduction";

export default function SubmoduleEditorialEditor({ value, contentHtml, onChange }: {
  value?: SubmoduleEditorialIntroduction | null;
  contentHtml: string;
  onChange: (value: SubmoduleEditorialIntroduction | null) => void;
}) {
  const inputClass = "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3";
  const update = (change: Partial<SubmoduleEditorialIntroduction>) => onChange({ ...value, layout: "brand_video", ...change });
  return <fieldset className="space-y-4 rounded-xl border border-[var(--border)] p-4">
    <legend className="px-2 font-semibold">Présentation éditoriale</legend>
    <label className="flex items-center gap-3"><input type="checkbox" checked={value?.layout === "brand_video"} onChange={event => onChange(event.target.checked ? { layout: "brand_video", headline: "", paragraphs: [], keyPhrase: "" } : null)} /> Utiliser la structure de « Ton histoire »</label>
    {value?.layout === "brand_video" && <>
      <label className="block space-y-2"><span>Accroche principale</span><textarea className={inputClass} rows={2} value={value.headline ?? ""} onChange={event => update({ headline: event.target.value })} /></label>
      {(value.paragraphs ?? []).map((paragraph, index) => <div key={index} className="space-y-2"><label className="block space-y-2"><span>Paragraphe {index + 1}</span><textarea className={inputClass} rows={3} value={paragraph} onChange={event => update({ paragraphs: value.paragraphs!.map((p, i) => i === index ? event.target.value : p) })} /></label><button type="button" className="text-sm underline" onClick={() => update({ paragraphs: value.paragraphs!.filter((_, i) => i !== index) })}>Retirer ce paragraphe</button></div>)}
      <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-2" onClick={() => update({ paragraphs: [...(value.paragraphs ?? []), ""] })}>Ajouter un paragraphe</button>
      <label className="block space-y-2"><span>Phrase clé en bordeaux</span><textarea className={inputClass} rows={2} value={value.keyPhrase ?? ""} onChange={event => update({ keyPhrase: event.target.value })} /></label>
      <p className="text-sm text-[var(--text-muted)]">L’encart rose final utilise la consigne modifiable ci-dessous.</p>
      <details><summary className="cursor-pointer underline">Prévisualiser l’introduction</summary><div className="mt-4"><SubmoduleIntroduction contentHtml={contentHtml} introduction={value} exerciseCount={0} /></div></details>
    </>}
  </fieldset>;
}
