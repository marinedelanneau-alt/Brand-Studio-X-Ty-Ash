import Image from "next/image";
import Link from "next/link";
import CheckoutButton from "@/app/ui/checkout-button";

export default function PricingPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-5xl gap-8 border-t border-[var(--border)] pt-8 lg:grid-cols-[1fr_24rem] lg:items-start">
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
            <span className="inline-flex rounded-full border border-[var(--tyash-border)] bg-[var(--tyash-soft)] px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">
              Formation
            </span>
          </div>

          <h1 className="mt-10 font-[family:var(--font-cormorant)] text-[3.2rem] leading-[0.95] text-[var(--heading-color)] sm:text-[4.2rem]">
            Brand Studio
          </h1>
          <p className="mt-6 text-lg leading-8 text-[var(--text-primary)]">
            Accède à la formation Brand Studio pour structurer ta stratégie,
            ton positionnement, ta personnalité de marque et ton guide de
            marque final.
          </p>

          <div className="mt-8 grid gap-4 text-sm leading-7 text-[var(--text-muted)] sm:grid-cols-2">
            <div className="border-l border-[var(--border)] pl-5">
              <p className="font-black uppercase tracking-[0.16em] text-[var(--tyash-label-text)]">
                Modules
              </p>
              <p className="mt-2">Parcours complet avec exercices et progression.</p>
            </div>
            <div className="border-l border-[var(--border)] pl-5">
              <p className="font-black uppercase tracking-[0.16em] text-[var(--tyash-label-text)]">
                Accès
              </p>
              <p className="mt-2">Paiement unique ou abonnement selon la configuration.</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_18px_46px_rgba(210,189,152,0.1)]">
          <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Offre
          </p>
          <h2 className="mt-4 text-2xl font-black text-[var(--heading-color)]">Brand Studio</h2>
          <div className="mt-6">
            <CheckoutButton />
          </div>
          <Link
            href="/"
            className="mt-5 inline-flex text-sm font-bold text-[var(--tyash-label-text)] underline-offset-4 hover:underline"
          >
            Retour à la connexion
          </Link>
        </aside>
      </section>
    </main>
  );
}
