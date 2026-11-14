import Image from "next/image";

export default function BrandStudioTyAshLockup({ compact = false }: { compact?: boolean }) {
  const brandStudioHeight = compact ? "h-9 sm:h-11" : "h-11 sm:h-14";
  const tyAshHeight = compact ? "h-[1.625rem] sm:h-8" : "h-8 sm:h-10";

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-3.5">
      {/* Optical sizing: Ty Ash's solid lettering needs less height than the illustrated Brand Studio mark. */}
      <div className={`relative aspect-[272/166] shrink-0 overflow-hidden ${brandStudioHeight}`}>
        <Image
          src="/logo.png"
          alt="Brand Studio"
          width={280}
          height={280}
          sizes={compact ? "(min-width: 640px) 75px, 61px" : "(min-width: 640px) 95px, 75px"}
          className="absolute left-[-1.1%] top-[-33.74%] h-[168.675%] w-auto max-w-none"
          preload
        />
      </div>

      <span
        aria-hidden="true"
        className="text-[0.9rem] font-medium leading-none text-[var(--text-muted)] opacity-80 sm:text-[1.1rem]"
      >
        ×
      </span>

      <div className={`relative aspect-[1878/523] shrink-0 overflow-hidden ${tyAshHeight}`}>
        <Image
          src="/tyash-logo-transparent.png"
          alt="TYASH Studio"
          width={2122}
          height={741}
          sizes={compact ? "(min-width: 640px) 130px, 106px" : "(min-width: 640px) 163px, 130px"}
          className="tyash-partner-logo absolute left-[-6.02%] top-[-24.67%] h-[141.683%] w-auto max-w-none"
          preload
        />
      </div>
    </div>
  );
}
