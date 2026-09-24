import Image from "next/image";
import Link from "next/link";
import AccessLoginForm from "./ui/access-login-form";
import { getCurrentAccount } from "@/lib/session";
import PaymentSuccessPopup from "./ui/payment-success-popup";

const studioNotes = [
  "Accès immédiat à ton espace de formation",
  "Code personnel simple à réutiliser",
  "Interface éditoriale inspirée de Brand Studio",
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
  const homeTitle = account?.company_name?.trim() || "Brand Studio";

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {paymentSucceeded ? <PaymentSuccessPopup /> : null}
      <section className="bs-access-shell relative mx-auto w-full max-w-[84rem] overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] shadow-[0_16px_44px_rgba(210,189,152,0.09)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,rgb(var(--tyash-glow-rgb)/0),rgb(var(--tyash-glow-rgb)/0.72),rgb(var(--tyash-glow-rgb)/0.42),rgb(var(--tyash-glow-rgb)/0))]" />

        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bs-access-light-surface relative overflow-hidden px-7 py-8 sm:px-9 sm:py-9 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute left-0 top-12 h-28 w-28 rounded-full bg-[var(--tyash-primary)]/8 blur-3xl" />

            <div className="relative flex h-full flex-col gap-7">
              <div className="flex items-center gap-4">
                <Image
                  src="/logo.png"
                  alt="Brand Studio"
                  width={154}
                  height={86}
                  className="h-auto w-[8rem]"
                  priority
                />
                <div className="hidden h-5 w-px bg-[var(--border)] lg:block" />
                <p className="inline-flex rounded-full border border-[var(--tyash-border)] bg-[var(--tyash-soft)] px-5 py-3 text-[0.72rem] font-black uppercase tracking-[0.22em] text-[var(--tyash-label-text)]">
                  Espace de travail
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[11rem_minmax(0,1fr)] lg:items-center">
                <div className="relative mx-auto min-h-[18rem] w-full max-w-[12rem] sm:min-h-[21rem] sm:max-w-[13rem] lg:mx-0 lg:min-h-[22rem] lg:max-w-[11rem]">
                  <Image
                    src="/Icone Accueil - Brand Studio.png"
                    alt="Illustration Brand Studio"
                    fill
                    sizes="(min-width: 1024px) 11rem, (min-width: 640px) 13rem, 12rem"
                    className="object-contain object-center drop-shadow-[0_12px_18px_rgba(198,168,120,0.08)]"
                    priority
                  />
                </div>

                <div className="mx-auto flex w-full max-w-[30rem] flex-col items-start justify-center text-left lg:mx-0 lg:max-w-none">
                  <h1 className="bs-text-on-light-primary max-w-full break-words font-[family:var(--font-cormorant)] text-[2.7rem] leading-[0.95] tracking-[-0.04em] text-[var(--heading-color)] sm:text-[3.45rem] xl:text-[3.95rem]">
                    {homeTitle}
                  </h1>
                  <p className="bs-text-on-light-secondary mt-4 max-w-[24rem] text-[0.97rem] leading-[1.8] text-[var(--text-muted)]">
                    Un espace éditorial pour structurer ton parcours, accéder
                    à tes ressources et avancer avec plus de clarté.
                  </p>

                  <div className="mt-6 grid gap-3 border-l border-[var(--border)] pl-5">
                    {studioNotes.map((item) => (
                      <div
                        key={item}
                        className="bs-text-on-light-secondary flex items-start gap-3 text-[0.9rem] leading-6 text-[var(--text-muted)]"
                      >
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--tyash-medium)]" />
                        <span>{item}</span>
                      </div>
                    ))}
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
                  Le paiement déclenche l&apos;envoi d&apos;un lien personnel
                  pour choisir ton mot de passe. Tu pourras ensuite créer ton
                  compte et choisir ton mot de passe.
                </p>
                <Link
                  href="/pricing"
                  className="bs-access-dark-action mt-4 flex h-12 w-full items-center justify-center rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-5 text-[0.8rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)] transition duration-200 hover:-translate-y-0.5"
                >
                  Souscrire à la formation
                </Link>
              </div>

              <div>
                <p className="bs-text-on-light-muted mt-3 text-sm font-extrabold text-[var(--heading-color)]">
                  Déjà client ?
                </p>
                <p className="bs-text-on-light-secondary mt-1 max-w-[25rem] text-[0.9rem] leading-[1.65] text-[var(--text-muted)]">
                  Connecte-toi avec ton e-mail et ton mot de passe pour
                  retrouver ton espace de travail.
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
                      Ton accès est déjà reconnu. Ouvre directement ton
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
                      Générer mon Guide de Marque
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
