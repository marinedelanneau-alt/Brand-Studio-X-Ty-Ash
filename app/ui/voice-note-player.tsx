type VoiceNotePlayerProps = {
  src?: string | null;
  eyebrow?: string;
  title?: string;
};

export default function VoiceNotePlayer({
  src,
  eyebrow = "Note vocale",
  title = "Ecouter l'audio",
}: VoiceNotePlayerProps) {
  if (!src?.trim()) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-[#eadfca] bg-[#fffdf7] px-5 py-5 shadow-[0_14px_34px_rgba(126,102,78,0.08)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(232,222,205,0.28)_1px,transparent_1px),linear-gradient(180deg,rgba(232,222,205,0.28)_1px,transparent_1px)] bg-[length:34px_34px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border-[10px] border-[#85819c]/25 bg-[#f8f7fb]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-5 h-14 w-14 rounded-full bg-[#ffd942] shadow-[0_0_0_8px_rgba(255,217,66,0.18)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 bottom-2 h-28 w-28 rounded-full bg-[#b8d0cf]/45"
      />

      <div className="relative grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[#d9d0e4] bg-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
          <span className="absolute -left-3 top-4 rounded-[0.5rem] border-[3px] border-[#4b4550] bg-[#f3f0ea] px-2 py-1 text-lg leading-none text-[#4b4550] shadow-[4px_4px_0_rgba(75,69,80,0.18)]">
            &quot;
          </span>
          <span className="absolute -right-3 bottom-3 rounded-[0.55rem] border-[3px] border-[#4b4550] bg-[#f3f0ea] px-2 py-1 text-lg leading-none text-[#4b4550] shadow-[4px_4px_0_rgba(75,69,80,0.18)]">
            &quot;
          </span>
          <span className="flex h-14 w-9 items-end justify-center rounded-t-full rounded-b-[0.7rem] bg-[#2f2c2b] px-1.5 pb-2">
            <span className="h-8 w-full rounded-full bg-[#171514]" />
          </span>
          <span className="absolute bottom-4 h-1.5 w-10 rounded-full bg-[#2f2c2b]" />
        </div>

        <div className="min-w-0">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
            {eyebrow}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="font-[family:var(--font-cormorant)] text-[1.75rem] leading-none text-[#4b4550]">
              {title}
            </h3>
            <div
              aria-hidden="true"
              className="flex h-8 items-center gap-1 text-[#2f2c2b]"
            >
              {[12, 22, 14, 28, 18, 34, 15, 26, 12].map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="w-0.5 rounded-full bg-current"
                  style={{ height }}
                />
              ))}
            </div>
          </div>
          <audio controls preload="metadata" className="mt-4 w-full">
            <source src={src} type="audio/mpeg" />
            Votre navigateur ne peut pas lire cette note vocale.
          </audio>
        </div>
      </div>
    </div>
  );
}
