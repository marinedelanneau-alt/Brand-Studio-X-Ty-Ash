import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RegisterSuccessPage() {
  const cookieStore = await cookies();
  const generatedCode = cookieStore.get("registration-access-code")?.value;
  const clientName = cookieStore.get("registration-client-name")?.value;
  const emailStatus = cookieStore.get("registration-email-status")?.value;
  const emailWarning = cookieStore.get("registration-email-warning")?.value;

  if (!generatedCode) {
    redirect("/register");
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(184,171,152,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(184,171,152,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(243,198,35,0.24),transparent_20%),radial-gradient(circle_at_88%_18%,rgba(219,232,216,0.45),transparent_20%),radial-gradient(circle_at_78%_84%,rgba(246,178,107,0.18),transparent_22%)]" />

      <section className="relative mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="relative overflow-hidden rounded-[2.6rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff6e9)] px-7 py-7 shadow-[0_26px_80px_rgba(210,189,152,0.18)] sm:px-10 sm:py-10">
          <div className="absolute inset-x-0 top-0 h-[4px] bg-[linear-gradient(90deg,rgba(243,198,35,0),rgba(243,198,35,0.9),rgba(246,178,107,0.75),rgba(243,198,35,0))]" />
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_1fr]">
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
                Bienvenue
                <br />
                {clientName ?? "dans Brand Studio"}
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-[1.75] text-[#82766b]">
                Votre compte est pret. Votre code personnel a ete prepare pour
                vous permettre d&apos;entrer dans votre espace client.
              </p>

              <div className="mt-8 rounded-[1.8rem] bg-[#fffaf1] p-5">
                <p className="inline-flex rounded-full bg-[#eef6eb] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[#72806f]">
                  Votre code
                </p>
                <p className="mt-5 text-3xl font-black tracking-[0.16em] text-[#514b57] sm:text-4xl">
                  {generatedCode}
                </p>
              </div>
            </div>

            <div className="rounded-[2.4rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffefd,#fff8f0)] p-7 shadow-[0_22px_54px_rgba(221,204,176,0.14)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="inline-flex rounded-full bg-[#f2eef7] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[#7a7087]">
                    Confirmation
                  </p>
                  <h2 className="mt-5 font-[family:var(--font-cormorant)] text-[2.4rem] leading-[0.95] tracking-[-0.04em] text-[#514b57] sm:text-[3rem]">
                    Votre acces
                    <br />
                    est pret
                  </h2>
                </div>
                <div className="rounded-[1.6rem] bg-[#fff5da] px-4 py-3 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#cf7430]">
                    Activation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#82766b]">
                    Connexion immediate
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-md text-base leading-7 text-[#82766b]">
                Conservez votre code et utilisez-le pour vos prochaines
                connexions a l&apos;espace client.
              </p>

              <div className="mt-6 space-y-3">
                {emailStatus === "sent" ? (
                  <p className="rounded-[1.2rem] border border-[#f0df98] bg-[#fff8d9] px-4 py-3 text-sm font-medium leading-6 text-[#b98744]">
                    Un e-mail contenant votre code vient d&apos;etre envoye.
                  </p>
                ) : null}

                {emailWarning ? (
                  <p className="rounded-[1.2rem] border border-[#efd6c8] bg-[#fff1ea] px-4 py-3 text-sm font-medium leading-6 text-[#c16a5c]">
                    {emailWarning}
                  </p>
                ) : null}
              </div>

              <div className="mt-8 flex flex-col gap-4">
                <Link
                  href="/"
                  className="flex h-15 w-full items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,#e19b34,#f2cf58)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_30px_rgba(227,175,64,0.24)] transition duration-200 hover:-translate-y-0.5"
                >
                  Aller au login
                </Link>
                <Link
                  href="/recover-code"
                  className="flex h-15 w-full items-center justify-center rounded-[1.15rem] border border-[#eadfca] bg-white px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-[#82766b] transition duration-200 hover:-translate-y-0.5"
                >
                  Recuperer le code
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
