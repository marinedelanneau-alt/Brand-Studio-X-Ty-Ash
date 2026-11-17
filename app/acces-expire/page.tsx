import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getSubscriptionAccessStatus } from "@/lib/subscriptions";
import BrandStudioTyAshLockup from "@/app/ui/brand-studio-tyash-lockup";
import LogoutButton from "@/app/ui/logout-button";
import { isAccountExpired } from "@/lib/account-lifetime";

export default async function ExpiredAccessPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/");
  const access = await getSubscriptionAccessStatus(account.id);
  if (access.accessGranted) redirect("/mon-espace");
  const expired = isAccountExpired(account);
  return <main className="min-h-screen px-5 py-12"><section className="mx-auto max-w-2xl rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 sm:p-12">
    <BrandStudioTyAshLockup compact />
    <h1 className="mt-8 text-3xl font-semibold">{expired ? "Votre accès à Brand Studio X TyASH est arrivé à son terme." : "Votre accès à Brand Studio X TyASH est suspendu."}</h1>
    <p className="mt-6 leading-8">{expired ? "Votre année d’accès est terminée. Vos données sont conservées conformément à notre politique de conservation." : "Votre paiement ou vos droits d’accès nécessitent une vérification. Contactez-nous avant de repasser commande. Vos données sont conservées."}</p>
    <p className="mt-4 leading-8">Aucun renouvellement automatique n’est effectué.</p>
    <a href="mailto:contact@marined-communication.fr" className="mt-7 inline-block rounded-xl bs-button-primary px-6 py-4 font-bold">Contacter le support</a>
    <Link href="/politique-confidentialite" className="mt-5 block text-sm underline">Politique de confidentialité</Link>
    <div className="mt-6"><LogoutButton /></div>
  </section></main>;
}
