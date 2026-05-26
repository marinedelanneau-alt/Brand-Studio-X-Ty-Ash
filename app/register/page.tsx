import Image from "next/image";
import Link from "next/link";
import RegisterForm from "../ui/register-form";

const values = [
  "Code d'activation recu apres paiement",
  "Creation du compte avec mot de passe",
  "Connexion ensuite par e-mail et mot de passe",
];

export default function RegisterPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(184,171,152,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(184,171,152,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(243,198,35,0.24),transparent_20%),radial-gradient(circle_at_88%_18%,rgba(219,232,216,0.45),transparent_20%),radial-gradient(circle_at_78%_84%,rgba(246,178,107,0.18),transparent_22%)]" />

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="relative overflow-hidden rounded-[2.6rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff6e9)] px-7 py-7 shadow-[0_26px_80px_rgba(210,189,152,0.18)] sm:px-10 sm:py-10">
          <div className="absolute inset-x-0 top-0 h-[4px] bg-[linear-gradient(90deg,rgba(243,198,35,0),rgba(243,198,35,0.9),rgba(246,178,107,0.75),rgba(243,198,35,0))]" />
          <div className="grid items-start gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="flex flex-col gap-5">
              <div className="rounded-[2.4rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffefd,#fff8f0)] p-7 shadow-[0_22px_54px_rgba(221,204,176,0.14)] sm:p-8">
                <p className="inline-flex rounded-full border border-[#efd7b8] bg-[#fff6e3] px-5 py-3 text-[0.82rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
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
                <h1 className="mt-8 max-w-lg font-[family:var(--font-cormorant)] text-[3rem] leading-[0.96] tracking-[-0.04em] text-[#514b57] sm:text-[4rem]">
                  Ouvrir votre
                  <br />
                  espace client
                </h1>
                <p className="mt-5 max-w-lg text-lg leading-[1.75] text-[#82766b]">
                  Creez un acces elegant et professionnel, concu comme une
                  interface de studio de design graphique.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-[2rem] border border-[#eadfca] bg-white/76 p-6 shadow-[0_18px_36px_rgba(221,204,176,0.14)]">
                  <p className="inline-flex rounded-full bg-[#f2eef7] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[#7a7087]">
                    Parcours
                  </p>
                  <p className="mt-6 font-[family:var(--font-cormorant)] text-[2.2rem] leading-tight text-[#514b57]">
                    Email.
                    <br />
                    Nom.
                    <br />
                    Entreprise.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-[#eadfca] bg-[#fffaf1] p-6 shadow-[0_18px_36px_rgba(221,204,176,0.14)]">
                  <p className="inline-flex rounded-full bg-[#eef6eb] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[#72806f]">
                    Ce que vous obtenez
                  </p>
                  <div className="mt-5 grid gap-3">
                    {values.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm leading-6 text-[#82766b]">
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#f0cf55]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[#8b7a70] transition hover:text-[#6a5d53]"
              >
                <span className="text-base leading-none">&lt;</span>
                Retour au login
              </Link>
            </div>

            <div className="rounded-[2.4rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffefd,#fff8f0)] p-7 shadow-[0_22px_54px_rgba(221,204,176,0.14)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="inline-flex rounded-full bg-[#f2eef7] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[#7a7087]">
                    Inscription
                  </p>
                  <h2 className="mt-5 font-[family:var(--font-cormorant)] text-[2.4rem] leading-[0.95] tracking-[-0.04em] text-[#514b57] sm:text-[3rem]">
                    Creer votre
                    <br />
                    acces studio
                  </h2>
                </div>
                <div className="rounded-[1.6rem] bg-[#fff5da] px-4 py-3 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#cf7430]">
                    Activation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#82766b]">
                    Code envoye apres paiement
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-md text-base leading-7 text-[#82766b]">
                Renseignez le code recu par e-mail, puis choisissez votre mot de
                passe pour activer votre acces.
              </p>

              <div className="mt-7">
                <RegisterForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
