import { parseChecklistEntries, parseIndexedAnswerItems } from "@/lib/exercise-types";
import { buildGuideMoodboard } from "@/lib/brand-guide";
import { parseStoredMoodboardAnswer } from "@/lib/moodboard";
import { GuideMoodboard } from "@/app/ui/brand-guide";
import Image from "next/image";

const imagePattern = /^(https?:\/\/|\/|data:image\/).+\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i;
const colorPattern = /^#[0-9a-f]{6}$/i;

export default function AdminAnswerValue({ values, type }: { values: string[]; type: string }) {
  if (type === "moodboard") {
    const moodboard = buildGuideMoodboard(parseStoredMoodboardAnswer(values));
    return (
      <div
        style={{
          "--guide-border": "#eadfca",
          "--guide-accent": "#cf7430",
        } as React.CSSProperties}
      >
        <GuideMoodboard items={moodboard.items} backgroundColor={moodboard.backgroundColor} />
        {moodboard.ambiance ? <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-[#6f645b]">{moodboard.ambiance}</p> : null}
      </div>
    );
  }
  const checklist = parseChecklistEntries(values);
  if (checklist.length) return <ul className="grid gap-2 sm:grid-cols-2">{checklist.map((item, index) => <li key={`${item.label}-${index}`} className="flex gap-3 rounded-xl bg-[#fff8f1] p-4 text-sm text-[#5d5752]"><span aria-hidden="true" className="font-black text-[#cf7430]">{item.checked ? "✓" : "○"}</span><span>{item.label}</span></li>)}</ul>;
  const indexed = parseIndexedAnswerItems(values);
  if (indexed.length) return <dl className="grid gap-3 sm:grid-cols-2">{indexed.map((item) => <div key={`${item.questionIndex}-${item.valueIndex}`} className="rounded-xl bg-[#fff8f1] p-4"><dt className="text-xs font-black uppercase tracking-[0.12em] text-[#7a736d]">Élément {item.questionIndex + 1}</dt><dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#5d5752]">{item.value}</dd></div>)}</dl>;
  if (values.every((value) => colorPattern.test(value.trim()))) return <div className="flex flex-wrap gap-3">{values.map((value) => <span key={value} className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-3 py-2 text-sm font-bold text-[#17213b]"><i className="size-6 rounded-full border border-black/10" style={{ backgroundColor: value }} />{value.toUpperCase()}</span>)}</div>;
  const images = values.filter((value) => imagePattern.test(value.trim()));
  if (images.length) return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{images.map((src) => <a key={src} href={src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-[#eadfca]"><Image unoptimized src={src} width={320} height={320} alt="Élément visuel enregistré" className="aspect-square w-full object-cover" /></a>)}</div>;
  if (["multiple", "single", "boolean", "color", "typography"].includes(type) || values.length > 1) return <div className="flex flex-wrap gap-2">{values.filter(Boolean).map((value, index) => <span key={`${value}-${index}`} className="rounded-full bg-[#fff1c7] px-3 py-2 text-sm font-semibold text-[#6f4a24]">{value}</span>)}</div>;
  return <p className={`whitespace-pre-wrap leading-7 text-[#4f4944] ${type === "baseline" ? "font-[family:var(--font-cormorant)] text-3xl text-[#17213b]" : "text-base"}`}>{values[0]}</p>;
}
