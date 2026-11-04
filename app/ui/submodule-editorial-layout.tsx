export default function SubmoduleEditorialLayout({ headline, paragraphs, keyPhrase, label }: {
  headline?: string; paragraphs?: string[]; keyPhrase?: string; label?: string;
}) {
  return <aside aria-label={label} className="mb-7 max-w-3xl space-y-4 border-b border-[var(--border)] pb-6">
    {headline && <h3 className="font-[family:var(--font-cormorant)] text-2xl leading-snug text-[var(--heading-color)] sm:text-3xl">{headline}</h3>}
    {!!paragraphs?.length && <div className="space-y-4 text-[0.98rem] leading-7 text-[var(--text-primary)]">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>}
    {keyPhrase && <p className="border-l-2 border-[var(--tyash-primary)] pl-4 font-[family:var(--font-cormorant)] text-xl font-semibold leading-relaxed text-[var(--tyash-label-text)]">{keyPhrase}</p>}
  </aside>;
}
