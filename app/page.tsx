import BrandStudioTyAshLockup from "@/app/ui/brand-studio-tyash-lockup";
import { projectDocumentCopy } from "@/lib/project-document-copy";
import Image from "next/image";
import Link from "next/link";
import AccessLoginForm from "./ui/access-login-form";
import { getCurrentAccount } from "@/lib/session";
import PaymentSuccessPopup from "./ui/payment-success-popup";

const studioNotes = [
  "Clarifiez vos objectifs et les messages à transmettre.",
  "Explorez votre univers et donnez une direction à vos idées.",
  "Construisez votre carnet de projet à votre rythme.",
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string | string[] }>;
}) {
  const query = await searchParams;
  const paymentSucceeded = query.payment === "success";
  const account = await getCurrentAccount();
  const hasAccess = Boolean(account);

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {paymentSucceeded ? <PaymentSuccessPopup /> : null}
      <section className="bs-access-shell relative mx-auto w-full max-w-[84rem] overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] shadow-[0_16px_44px_rgba(210,189,152,0.09)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,rgb(var(--tyash-glow-rgb)/0),rgb(var(--tyash-glow-rgb)/0.72),rgb(var(--tyash-glow-rgb)/0.42),rgb(var(--tyash-glow-rgb)/0))]" />

        <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.8fr)]">
          <div className="bs-access-light-surface relative overflow-hidden px-7 py-8 sm:px-9 sm:py-9 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute left-0 top-12 h-28 w-28 rounded-full bg-[var(--tyash-primary)]/8 blur-3xl" />

            <div className="relative flex h-full flex-col gap-8 sm:gap-10">
              <BrandStudioTyAshLockup />

              <div className="min-w-0">
                <h1 className="bs-text-on-light-primary font-[family:var(--font-cormorant)] text-[clamp(1.75rem,9vw,2.25rem)] font-normal leading-[1.12] tracking-[-0.035em] text-[var(--heading-color)] sm:text-[clamp(2.65rem,4vw,3.35rem)] lg:text-[clamp(2rem,3.1vw,3.1rem)]">
                  Une belle vidéo commence<span className="hidden sm:inline"><br /></span><span className="sm:hidden"> </span>par une idée claire.
                </h1>
                <p className="bs-text-on-light-primary mt-5 max-w-[38rem] text-[1.08rem] font-semibold leading-[1.5] text-[var(--heading-color)] sm:text-[1.2rem]">
                  Avant de passer derrière la caméra, passons derrière vos idées.
                </p>
                <p className="bs-text-on-light-secondary mt-3 max-w-[38rem] text-[0.97rem] leading-[1.8] text-[var(--text-muted)]">
                  Explorez vos intentions, affinez vos messages et construisez un projet vidéo qui vous ressemble.
                </p>

                <div className="mt-7 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,0.8fr)] sm:gap-7">
                  <ul className="grid gap-4 border-l border-[var(--border)] pl-5">
                    {studioNotes.map((item) => (
                      <li
                        key={item}
                        className="bs-text-on-light-secondary flex items-start gap-3 text-[0.9rem] leading-6 text-[var(--text-muted)]"
                      >
                        <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--tyash-medium)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div aria-hidden="true" className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-[1.5rem] border border-[var(--tyash-border)] bg-[var(--tyash-soft)] p-5">
                    <div className="relative aspect-[1878/523] w-full max-w-[11rem] overflow-hidden">
                      <Image
                        src="/tyash-logo-transparent.png"
                        alt=""
                        width={2122}
                        height={741}
                        sizes="176px"
                        className="tyash-partner-logo absolute left-[-6.02%] top-[-24.67%] h-[141.683%] w-auto max-w-none"
                      />
                    </div>
                    <svg className="h-10 w-10 text-[var(--tyash-primary)]" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="18.5" stroke="currentColor" />
                      <path d="m17 13 10 7-10 7V13Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bs-access-light-surface border-t border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] px-6 py-6 sm:px-8 sm:py-7 lg:border-l lg:border-t-0 lg:px-8 lg:py-7">
            <div className="flex h-full flex-col justify-center gap-5">
              <div className="bs-access-dark-panel rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_12px_24px_rgba(223,203,171,0.1)]">
                <p className="inline-flex rounded-full bs-status-light bg-[#eef6eb] px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.2em] text-[var(--status-success-text)]">
                  Nouveau client
                </p>
                <p className="bs-text-on-dark-secondary mt-3 text-[0.86rem] leading-6 text-[var(--text-muted)]">
                  Renseignez votre e-mail, puis réglez votre accès de 365 jours
                  avec un paiement unique de 52 €. Vous choisirez votre mot
                  de passe après le paiement.
                </p>
                <Link
                  href="/register"
                  className="bs-access-dark-action mt-4 flex h-12 w-full items-center justify-center rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-5 text-[0.8rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)] transition duration-200 hover:-translate-y-0.5"
                >
                  Entrer dans l’outil
                </Link>
              </div>

              <div>
                <p className="bs-text-on-light-muted mt-3 text-sm font-extrabold text-[var(--heading-color)]">
                  Déjà client ?
                </p>
                <p className="bs-text-on-light-secondary mt-1 max-w-[25rem] text-[0.9rem] leading-[1.65] text-[var(--text-muted)]">
                  Connectez-vous avec votre e-mail et votre mot de passe pour
                  retrouver votre projet vidéo.
                </p>
              </div>

              <div>
                {hasAccess ? (
                  <div className="bs-access-dark-panel space-y-6 rounded-[1.9rem] border border-[var(--border)] bg-[var(--surface)] p-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="bs-text-on-dark-primary text-xs font-black uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Session active
                      </p>
                      <span className="rounded-full bg-[var(--tyash-soft)] px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.16em] text-[var(--tyash-label-text)]">
                        active
                      </span>
                    </div>
                    <p className="bs-text-on-dark-secondary text-base leading-7 text-[var(--text-muted)]">
                      Votre accès est déjà reconnu. Ouvrez directement votre
                      espace client.
                    </p>
                    <Link
                      href="/mon-espace"
                      className="bs-access-primary-action flex h-16 w-full items-center justify-center rounded-[1.2rem] bs-button-primary px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_22px_rgb(var(--tyash-glow-rgb)/0.18)] transition duration-200 hover:-translate-y-0.5"
                    >
                      Ouvrir mon espace
                    </Link>
                    <Link
                      href="/brand-guide"
                      className="bs-access-guide-action flex h-14 w-full items-center justify-center rounded-[1.1rem] border border-[var(--tyash-border)] bg-[var(--tyash-soft)] px-6 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--tyash-label-text)] transition duration-200 hover:-translate-y-0.5"
                    >
                      {projectDocumentCopy("G\u00e9n\u00e9rer mon Guide de Marque", "CR\u00c9ER MON CARNET")}
                    </Link>
                  </div>
                ) : (
                  <AccessLoginForm />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
