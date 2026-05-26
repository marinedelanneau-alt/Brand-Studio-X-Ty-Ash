import Image from "next/image";
import Link from "next/link";
import CheckoutButton from "@/app/ui/checkout-button";
import { getCurrentAccount } from "@/lib/session";

export default async function PricingPage() {
  const account = await getCurrentAccount();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-5xl gap-8 border-t border-[#eadfca] pt-8 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Brand Studio"
              width={154}
              height={86}
              className="h-auto w-[8rem]"
              priority
            />
            <span className="inline-flex rounded-full border border-[#efd7b8] bg-[#fff6e3] px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
              Formation
            </span>
          </div>

          <h1 className="mt-10 font-[family:var(--font-cormorant)] text-[3.2rem] leading-[0.95] text-[#4b4550] sm:text-[4.2rem]">
            Brand Studio
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#6f645b]">
            Accedez a la formation Brand Studio pour structurer votre strategie,
            votre positionnement, votre personnalite de marque et votre guide de
            marque final.
          </p>

          <div className="mt-8 grid gap-4 text-sm leading-7 text-[#7b7068] sm:grid-cols-2">
            <div className="border-l border-[#eadfca] pl-5">
              <p className="font-black uppercase tracking-[0.16em] text-[#cf7430]">
                Modules
              </p>
              <p className="mt-2">Parcours complet avec exercices et progression.</p>
            </div>
            <div className="border-l border-[#eadfca] pl-5">
              <p className="font-black uppercase tracking-[0.16em] text-[#cf7430]">
                Acces
              </p>
              <p className="mt-2">Paiement unique ou abonnement selon la configuration.</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[1.6rem] border border-[#eadfca] bg-white p-6 shadow-[0_18px_46px_rgba(210,189,152,0.1)]">
          <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#7a7087]">
            Offre
          </p>
          <h2 className="mt-4 text-2xl font-black text-[#4b4550]">Brand Studio</h2>
          <p className="mt-3 text-sm leading-7 text-[#7b7068]">
            Prix configure dans Stripe via <span className="font-semibold">STRIPE_PRICE_ID</span>.
          </p>
          <div className="mt-6">
            {account ? (
              <CheckoutButton />
            ) : (
              <Link
                href="/register"
                className="flex h-14 w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_22px_rgba(227,175,64,0.18)] transition duration-200 hover:-translate-y-0.5"
              >
                Creer mon compte
              </Link>
            )}
          </div>
          <p className="mt-4 text-xs leading-6 text-[#8a8078]">
            {account
              ? "L'acces est debloque uniquement apres validation du webhook Stripe."
              : "Creez votre compte avant paiement pour associer l'acces a votre espace."}
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex text-sm font-bold text-[#cf7430] underline-offset-4 hover:underline"
          >
            Retour a la connexion
          </Link>
        </aside>
      </section>
    </main>
  );
}
