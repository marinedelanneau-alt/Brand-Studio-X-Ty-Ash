import AccessPageBackground from "@/app/ui/access-page-background";
import BrandStudioTyAshLockup from "@/app/ui/brand-studio-tyash-lockup";
import GuestCheckoutForm from "@/app/ui/guest-checkout-form";
import LegacyRegistrationPage from "@/app/ui/legacy-registration-page";
import { getPublishedLegalDocument } from "@/lib/legal";
import { getCurrentAccount } from "@/lib/session";
import { getSubscriptionAccessStatus } from "@/lib/subscriptions";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Votre projet vidéo commence ici — Brand Studio X TyASH" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ activation?: string | string[]; payment?: string }> }) {
  const query = await searchParams;
  if (typeof query.activation === "string" && query.activation) return <LegacyRegistrationPage searchParams={Promise.resolve(query)} />;
  const account = await getCurrentAccount();
  if (account && (await getSubscriptionAccessStatus(account.id)).accessGranted) redirect("/mon-espace");
  if (account?.access_started_at || account?.is_active === false) redirect("/acces-expire");
  const [terms, sales] = await Promise.all([getPublishedLegalDocument("terms_of_use"), getPublishedLegalDocument("sales_terms")]);
  return <main className="relative isolate min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:py-14">
    <AccessPageBackground />
    <section className="relative mx-auto max-w-4xl rounded-[2.6rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-6 shadow-[0_26px_80px_rgba(210,189,152,0.18)] sm:p-10">
      <BrandStudioTyAshLockup compact />
      <div className="mt-9 grid items-start gap-9 lg:grid-cols-2 lg:gap-12">
        <div><h1 className="font-[family:var(--font-cormorant)] text-[2.7rem] leading-[1.02] tracking-[-0.035em] text-[var(--heading-color)] sm:text-5xl">Votre projet vidéo commence ici.</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--text-muted)]">Un parcours guidé pour clarifier vos idées, définir vos objectifs et construire un projet vidéo qui vous ressemble.</p>
          <div className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--tyash-subtle)] p-5"><p className="text-xl font-bold text-[var(--heading-color)]">52 €</p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Accès pendant 365 jours</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Paiement unique, sans renouvellement automatique.</p></div>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Offre réservée aux professionnels. TVA non applicable, article 293 B du CGI.</p>
        </div>
        <div className="min-w-0">
          {query.payment === "cancelled" ? <p role="status" className="mb-5 text-sm leading-7">Votre paiement n’a pas été finalisé. Vous pouvez reprendre votre paiement. Si vous avez déjà payé, attendez votre confirmation avant de recommencer.</p> : null}
          <GuestCheckoutForm termsId={terms?.id} salesId={sales?.id} email={account?.email} />
          <Link href="/" className="mt-7 block text-center text-sm underline">Déjà un accès ? Se connecter</Link>
        </div>
      </div>
      <nav aria-label="Informations légales" className="mt-9 flex flex-wrap gap-x-5 gap-y-3 border-t border-[var(--border)] pt-6 text-xs leading-6 text-[var(--text-muted)] underline">
        <Link href="/mentions-legales">Mentions légales</Link><Link href="/politique-confidentialite">Politique de confidentialité</Link><Link href="/conditions-generales-vente">CGV</Link>
      </nav>
    </section>
  </main>;
}
