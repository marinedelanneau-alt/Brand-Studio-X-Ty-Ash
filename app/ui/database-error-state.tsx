import Link from "next/link";

export default function DatabaseErrorState({
  title,
  message,
  backHref = "/",
  backLabel = "Retour a l'accueil",
}: {
  title: string;
  message: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <section className="rounded-[1.6rem] border border-[#eadfca] bg-white p-6 shadow-[0_18px_46px_rgba(210,189,152,0.1)] sm:p-8">
      <p className="inline-flex rounded-full bg-[#fff6e3] px-4 py-2 text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
        Service indisponible
      </p>
      <h1 className="mt-5 font-[family:var(--font-cormorant)] text-[2.3rem] leading-[0.98] text-[#4b4550] sm:text-[2.8rem]">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-8 text-[#7b7068]">
        {message}
      </p>
      <div className="mt-6">
        <Link
          href={backHref}
          className="inline-flex h-12 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-[#fff8f1] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6b625a]"
        >
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
