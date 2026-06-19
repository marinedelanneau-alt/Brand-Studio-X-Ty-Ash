import Image from "next/image";

type VoiceNotePlayerProps = {
  src?: string | null;
  eyebrow?: string;
  title?: string;
  visualSrc?: string;
};

export default function VoiceNotePlayer({
  src,
  eyebrow = "Note vocale",
  title = "Ecouter l'audio",
  visualSrc = "/Icone%20Accueil%20-%20Brand%20Studio.png",
}: VoiceNotePlayerProps) {
  if (!src?.trim()) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-[#eadfca] bg-[#fffdf7] px-4 py-4 shadow-[0_14px_34px_rgba(126,102,78,0.08)] sm:px-5 sm:py-5">
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

      <div className="relative grid gap-4 md:grid-cols-[11rem_1fr] md:items-center">
        <div className="relative h-40 overflow-visible md:h-36">
          <div className="absolute left-0 top-0 h-full w-36 overflow-hidden rounded-[1.1rem] border border-white/80 bg-[#f4efe9] shadow-[0_12px_24px_rgba(75,69,80,0.12)] md:w-40">
            <Image
              src={visualSrc}
              alt="Portrait Brand Studio"
              width={320}
              height={420}
              className="h-full w-full object-cover object-[50%_24%]"
            />
          </div>
          <span className="absolute -left-1 top-5 rounded-[0.5rem] border-[3px] border-[#4b4550] bg-[#f3f0ea] px-2 py-1 text-lg leading-none text-[#4b4550] shadow-[4px_4px_0_rgba(75,69,80,0.18)]">
            &quot;
          </span>
          <span className="absolute left-28 bottom-4 rounded-[0.55rem] border-[3px] border-[#4b4550] bg-[#f3f0ea] px-2 py-1 text-lg leading-none text-[#4b4550] shadow-[4px_4px_0_rgba(75,69,80,0.18)]">
            &quot;
          </span>
          <div className="absolute bottom-2 left-24 flex h-14 w-14 items-center justify-center rounded-full border border-[#d9d0e4] bg-white/90 shadow-[0_8px_18px_rgba(75,69,80,0.12)]">
            <span className="flex h-9 w-6 items-end justify-center rounded-t-full rounded-b-[0.6rem] bg-[#2f2c2b] px-1 pb-1.5">
              <span className="h-5 w-full rounded-full bg-[#171514]" />
            </span>
            <span className="absolute bottom-3 h-1 w-8 rounded-full bg-[#2f2c2b]" />
          </div>
        </div>

        <div className="min-w-0 rounded-[1.1rem] bg-white/62 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
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
