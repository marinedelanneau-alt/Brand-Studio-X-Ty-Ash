import Link from "next/link";
import BrandStudioTyAshLockup from "@/app/ui/brand-studio-tyash-lockup";
import CheckoutButton from "@/app/ui/checkout-button";
import { getCurrentAccount } from "@/lib/session";
import { getSubscriptionAccessStatus } from "@/lib/subscriptions";
import { redirect } from "next/navigation";

export const metadata = { title: "Accès annuel — Brand Studio X TyASH", description: "55 € TTC pour 365 jours, sans abonnement ni renouvellement automatique." };
export default async function OrderPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const account = await getCurrentAccount();
  const access = account ? await getSubscriptionAccessStatus(account.id) : null;
  if (access?.accessGranted) redirect("/mon-espace");
  if (account?.access_started_at || (account && !account.annual_access_required)) redirect("/acces-expire");
  const { payment } = await searchParams;
  return <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
    <section className="mx-auto max-w-5xl rounded-[2rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-6 sm:p-10">
      <BrandStudioTyAshLockup compact />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_23rem]">
        <div><h1 className="font-[family:var(--font-cormorant)] text-4xl text-[var(--heading-color)] sm:text-5xl">Brand Studio X TyASH</h1>
          <p className="mt-6 text-lg leading-8">Votre espace pour construire un projet vidéo clair, cohérent et fidèle à votre univers.</p>
          <ul className="mt-7 space-y-4 text-[var(--text-muted)]">
            <li>Accès à l’ensemble des modules et exercices.</li><li>Sauvegarde de votre progression et de vos réponses.</li>
            <li>Accès à votre carnet de projet.</li><li>Utilisation de l’outil pendant 365 jours.</li>
          </ul>
        </div>
        <aside className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-2xl font-bold">55 € TTC — Accès pendant 1 an</h2>
          <p className="my-5 text-sm leading-7 text-[var(--text-muted)]">Paiement unique. Vos 365 jours d’accès commencent à la confirmation du paiement. Aucun abonnement ni renouvellement automatique.</p>
          {payment === "cancelled" ? <p role="status" className="mb-5 text-sm">Votre paiement n’est pas finalisé. Votre accès sera activé après confirmation par Stripe. Vous pouvez reprendre le même paiement.</p> : null}
          {account ? <CheckoutButton /> : <><Link href="/register" className="flex min-h-14 items-center justify-center rounded-xl bs-button-primary px-5 py-4 font-bold">Créer mon compte</Link><Link href="/" className="mt-5 block text-center text-sm underline">J’ai déjà un compte</Link></>}
          <p className="mt-5 text-xs leading-6 text-[var(--text-muted)]">Paiement sécurisé par Stripe Checkout. Un paiement correspond à un compte utilisateur.</p>
        </aside>
      </div>
      <nav aria-label="Informations légales" className="mt-9 flex flex-wrap gap-5 border-t border-[var(--border)] pt-6 text-sm underline">
        <Link href="/conditions-generales-vente">Conditions générales de vente</Link><Link href="/mentions-legales">Mentions légales</Link><Link href="/politique-confidentialite">Politique de confidentialité</Link>
      </nav>
    </section>
  </main>;
}
