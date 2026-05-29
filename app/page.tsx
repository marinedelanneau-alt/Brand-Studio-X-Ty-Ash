import Image from "next/image";
import Link from "next/link";
import AccessLoginForm from "./ui/access-login-form";
import { getCurrentAccount } from "@/lib/session";

const studioNotes = [
  "Acces immediat a votre espace de formation",
  "Code personnel simple a reutiliser",
  "Interface editoriale inspiree de Brand Studio",
];

export default async function Home() {
  const account = await getCurrentAccount();
  const hasAccess = Boolean(account);
  const homeTitle = account?.company_name?.trim() || "Brand Studio";

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative mx-auto w-full max-w-[84rem] overflow-hidden rounded-[2rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff8f1)] shadow-[0_16px_44px_rgba(210,189,152,0.09)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,rgba(243,198,35,0),rgba(243,198,35,0.72),rgba(246,178,107,0.42),rgba(243,198,35,0))]" />

        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden px-7 py-8 sm:px-9 sm:py-9 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute left-0 top-12 h-28 w-28 rounded-full bg-[#f3c623]/8 blur-3xl" />

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
                <div className="hidden h-5 w-px bg-[#eadfca] lg:block" />
                <p className="inline-flex rounded-full border border-[#efd7b8] bg-[#fff6e3] px-5 py-3 text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
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
                  <h1 className="max-w-full break-words font-[family:var(--font-cormorant)] text-[2.7rem] leading-[0.95] tracking-[-0.04em] text-[#4b4550] sm:text-[3.45rem] xl:text-[3.95rem]">
                    {homeTitle}
                  </h1>
                  <p className="mt-4 max-w-[24rem] text-[0.97rem] leading-[1.8] text-[#7b7068]">
                    Un espace editorial pour structurer votre parcours, acceder
                    a vos ressources et avancer avec plus de clarte.
                  </p>

                  <div className="mt-6 grid gap-3 border-l border-[#eadfca] pl-5">
                    {studioNotes.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 text-[0.9rem] leading-6 text-[#7b7068]"
                      >
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#f0cf55]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff8f1)] px-7 py-8 sm:px-9 sm:py-9 lg:border-l lg:border-t-0 lg:px-9 lg:py-10">
            <div className="flex h-full flex-col justify-center gap-8">
              <div>
                <div className="flex flex-col items-start gap-5">
                  <h2 className="font-[family:var(--font-cormorant)] text-[2.2rem] leading-[0.92] tracking-[-0.04em] text-[#4b4550] sm:text-[2.7rem]">
                    Ouvrir votre espace
                  </h2>
                  <p className="inline-flex rounded-full border border-[#efd7b8] bg-[#fff6e3] px-5 py-3 text-[0.7rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
                    Espace de travail
                  </p>
                </div>

                <p className="mt-5 max-w-[23rem] text-[0.95rem] leading-[1.8] text-[#7b7068]">
                  Connectez-vous avec votre e-mail et votre mot de passe pour
                  retrouver votre espace de travail.
                </p>
              </div>

              <div>
                {hasAccess ? (
                  <div className="space-y-6 rounded-[1.9rem] border border-[#efe2d1] bg-[#fffdf7] p-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7a7087]">
                        Session active
                      </p>
                      <span className="rounded-full bg-[#fff1c7] px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#cf7430]">
                        active
                      </span>
                    </div>
                    <p className="text-base leading-7 text-[#7b7068]">
                      Votre acces est deja reconnu. Ouvrez directement votre
                      espace client.
                    </p>
                    <Link
                      href="/mon-espace"
                      className="flex h-16 w-full items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_22px_rgba(227,175,64,0.18)] transition duration-200 hover:-translate-y-0.5"
                    >
                      Ouvrir mon espace
                    </Link>
                    <Link
                      href="/brand-guide"
                      className="flex h-14 w-full items-center justify-center rounded-[1.1rem] border border-[#efd7b8] bg-[#fff6e3] px-6 text-xs font-extrabold uppercase tracking-[0.12em] text-[#cf7430] transition duration-200 hover:-translate-y-0.5"
                    >
                      Generer mon Guide de Marque
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
