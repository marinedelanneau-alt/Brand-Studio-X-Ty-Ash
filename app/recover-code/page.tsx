import Image from "next/image";
import Link from "next/link";
import RecoverCodeForm from "../ui/recover-code-form";

export default function RecoverCodePage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(184,171,152,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(184,171,152,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgb(var(--tyash-glow-rgb)/0.24),transparent_20%),radial-gradient(circle_at_88%_18%,rgba(219,232,216,0.45),transparent_20%),radial-gradient(circle_at_78%_84%,rgb(var(--tyash-glow-rgb)/0.18),transparent_22%)]" />

      <section className="relative mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="relative overflow-hidden rounded-[2.6rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] px-7 py-7 shadow-[0_26px_80px_rgba(210,189,152,0.18)] sm:px-10 sm:py-10">
          <div className="absolute inset-x-0 top-0 h-[4px] bg-[linear-gradient(90deg,rgb(var(--tyash-glow-rgb)/0),rgb(var(--tyash-glow-rgb)/0.9),rgb(var(--tyash-glow-rgb)/0.75),rgb(var(--tyash-glow-rgb)/0))]" />
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2.4rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-7 shadow-[0_22px_54px_rgba(221,204,176,0.14)] sm:p-8">
              <p className="inline-flex rounded-full border border-[var(--tyash-border)] bg-[var(--tyash-soft)] px-5 py-3 text-[0.82rem] font-black uppercase tracking-[0.22em] text-[var(--tyash-label-text)]">
                Espace de travail
              </p>
              <Image
                src="/logo.png"
                alt="Brand Studio"
                width={154}
                height={86}
                className="mt-8 h-auto w-[8.8rem]"
                priority
              />
              <h1 className="mt-8 max-w-lg font-[family:var(--font-cormorant)] text-[3rem] leading-[0.96] tracking-[-0.04em] text-[var(--heading-color)] sm:text-[4rem]">
                Récupérer ton
                <br />
                code d&apos;accès
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-[1.75] text-[var(--text-muted)]">
                Un écran d&apos;assistance cohérent avec le reste du studio, pour
                renvoyer ton code simplement et proprement.
              </p>

              <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
              >
                <span className="text-base leading-none">&lt;</span>
                Retour au login
              </Link>
            </div>

            <div className="rounded-[2.4rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-7 shadow-[0_22px_54px_rgba(221,204,176,0.14)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="inline-flex rounded-full bs-status-light bg-[#f2eef7] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Assistance
                  </p>
                  <h2 className="mt-5 font-[family:var(--font-cormorant)] text-[2.4rem] leading-[0.95] tracking-[-0.04em] text-[var(--heading-color)] sm:text-[3rem]">
                    Renvoyer mon
                    <br />
                    code
                  </h2>
                </div>
                <div className="rounded-[1.6rem] bs-status-light bg-[#eef6eb] px-4 py-3 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--status-success-text)]">
                    Recuperation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Envoi à ton e-mail
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-md text-base leading-7 text-[var(--text-muted)]">
                Nous renvoyons ton code à l&apos;adresse e-mail associée à ton
                compte.
              </p>

              <div className="mt-7">
                <RecoverCodeForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
