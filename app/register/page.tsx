import Image from "next/image";
import Link from "next/link";
import RegisterForm from "../ui/register-form";
import { findActivationCodeByToken, findUsableActivationCodeByToken } from "@/lib/activation-codes";
import { getPublishedLegalDocument } from "@/lib/legal";
import { BRAND_STUDIO_OFFER } from "@/lib/brand-studio-offer";

const values = [
  "Lien personnel reçu après paiement",
  "Choix de ton mot de passe",
  "Connexion ensuite par e-mail et mot de passe",
];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ activation?: string | string[] }>;
}) {
  const query = await searchParams;
  const activationToken =
    typeof query.activation === "string" ? query.activation : "";
  const activation = activationToken
    ? await findUsableActivationCodeByToken(activationToken)
    : null;
  const activationRecord = activationToken && !activation
    ? await findActivationCodeByToken(activationToken)
    : activation;
  const accountAlreadyCreated = Boolean(activationRecord?.consumed_at);

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(184,171,152,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(184,171,152,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgb(var(--tyash-glow-rgb)/0.24),transparent_20%),radial-gradient(circle_at_88%_18%,rgba(219,232,216,0.45),transparent_20%),radial-gradient(circle_at_78%_84%,rgb(var(--tyash-glow-rgb)/0.18),transparent_22%)]" />

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="relative overflow-hidden rounded-[2.6rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] px-7 py-7 shadow-[0_26px_80px_rgba(210,189,152,0.18)] sm:px-10 sm:py-10">
          <div className="absolute inset-x-0 top-0 h-[4px] bg-[linear-gradient(90deg,rgb(var(--tyash-glow-rgb)/0),rgb(var(--tyash-glow-rgb)/0.9),rgb(var(--tyash-glow-rgb)/0.75),rgb(var(--tyash-glow-rgb)/0))]" />
          <div className="grid items-start gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="flex flex-col gap-5">
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
                  Ouvrir ton
                  <br />
                  espace client
                </h1>
                <p className="mt-5 max-w-lg text-lg leading-[1.75] text-[var(--text-muted)]">
                  Crée un accès élégant et professionnel, conçu comme une
                  interface de studio de design graphique.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)]/76 p-6 shadow-[0_18px_36px_rgba(221,204,176,0.14)]">
                  <p className="inline-flex rounded-full bs-status-light bg-[#f2eef7] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Parcours
                  </p>
                  <p className="mt-6 font-[family:var(--font-cormorant)] text-[2.2rem] leading-tight text-[var(--heading-color)]">
                    Email.
                    <br />
                    Nom.
                    <br />
                    Entreprise.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--tyash-subtle)] p-6 shadow-[0_18px_36px_rgba(221,204,176,0.14)]">
                  <p className="inline-flex rounded-full bs-status-light bg-[#eef6eb] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[var(--status-success-text)]">
                    Ce que tu obtiens
                  </p>
                  <div className="mt-5 grid gap-3">
                    {values.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm leading-6 text-[var(--text-muted)]">
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--tyash-medium)]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
              >
                <span className="text-base leading-none">&lt;</span>
                Retour au login
              </Link>
            </div>

            <div className="rounded-[2.4rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-7 shadow-[0_22px_54px_rgba(221,204,176,0.14)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="inline-flex rounded-full bs-status-light bg-[#f2eef7] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Inscription
                  </p>
                  <h2 className="mt-5 font-[family:var(--font-cormorant)] text-[2.4rem] leading-[0.95] tracking-[-0.04em] text-[var(--heading-color)] sm:text-[3rem]">
                    Créer ton
                    <br />
                    accès studio
                  </h2>
                </div>
                <div className="rounded-[1.6rem] bg-[var(--tyash-soft)] px-4 py-3 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--tyash-label-text)]">
                    Accès personnel
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Prêt après ton paiement
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-md text-base leading-7 text-[var(--text-muted)]">
                {activation
                  ? "Choisis ton mot de passe pour créer ton compte. Ton adresse e-mail est déjà associée à ton paiement."
                  : accountAlreadyCreated
                    ? "Ton compte a déjà été créé avec ce lien. Tu peux maintenant te connecter avec ton e-mail et ton mot de passe."
                  : "Ce lien personnel est absent, invalide ou expiré. Reprends le lien reçu par e-mail après ton paiement."}
              </p>

              <div className="mt-7">
                {activation ? (
                  <RegisterForm registrationToken={activation.code} email={activation.email} legalEnabled={activation.offer_version === BRAND_STUDIO_OFFER.version} termsId={activation.offer_version === BRAND_STUDIO_OFFER.version ? (await getPublishedLegalDocument("terms_of_use"))?.id : undefined} />
                ) : accountAlreadyCreated ? (
                  <Link href="/" className="flex h-16 w-full items-center justify-center rounded-[1.15rem] bs-button-primary px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_30px_rgb(var(--tyash-glow-rgb)/0.24)]">
                    Me connecter
                  </Link>
                ) : (
                  <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--tyash-subtle)] p-5 text-sm leading-7 text-[var(--text-muted)]">
                    Pour protéger ton accès, la création du compte est disponible uniquement depuis le lien personnel envoyé après ton paiement.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
