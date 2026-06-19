import Image from "next/image";
import audioHostVisual from "@/public/visuel-note-vocale.png";

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
    <div className="overflow-hidden rounded-[1.5rem] border border-[#eadfca] bg-[#fffdf7] shadow-[0_14px_34px_rgba(126,102,78,0.08)]">
      <div className="grid md:grid-cols-[minmax(15rem,22rem)_1fr]">
        <div className="relative min-h-[20rem] bg-[#f4efe9] md:min-h-[24rem]">
          <Image
            src={audioHostVisual}
            alt="Portrait Brand Studio"
            fill
            sizes="(max-width: 768px) 100vw, 22rem"
            className="object-contain object-bottom p-4"
            priority={false}
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-5 bg-[linear-gradient(180deg,#fffdf7,#fff8f1)] px-5 py-6 sm:px-7">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
            {eyebrow}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-[family:var(--font-cormorant)] text-[2rem] leading-none text-[#4b4550]">
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
          <audio controls preload="metadata" className="w-full">
            <source src={src} type="audio/mpeg" />
            Votre navigateur ne peut pas lire cette note vocale.
          </audio>
        </div>
      </div>
    </div>
  );
}
