import { cookies } from "next/headers";
import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { PLATFORM_CHECKOUT_FLOW } from "@/lib/platform-checkout";
import { getCurrentAccount } from "@/lib/session";
import { getAnnualPayment } from "@/lib/annual-payments";
import { annualPaymentGrantsAccess } from "@/lib/annual-offer";
import PaymentConfirmationRefresh from "@/app/ui/payment-confirmation-refresh";
import BrandStudioTyAshLockup from "@/app/ui/brand-studio-tyash-lockup";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PURCHASE_COOKIE, fingerprint } from "@/lib/annual-guest-security";
import type { GuestAnnualPayment } from "@/lib/annual-activation";
import { annualLiveMode } from "@/lib/annual-stripe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Votre commande — Brand Studio", robots: { index: false, follow: false } };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: id } = await searchParams;
  const purchaseOwner = (await cookies()).get(PURCHASE_COOKIE)?.value;
  if (purchaseOwner && /^[a-f0-9]{64}$/.test(purchaseOwner) && typeof id === "string" && /^cs_[a-zA-Z0-9_]+$/.test(id)) {
    let payment: GuestAnnualPayment | null = null;
    try {
      const result = await createSupabaseServerClient().from("annual_payments").select("*")
        .eq("session_id", id).eq("owner_hash", fingerprint(purchaseOwner)).eq("live_mode", annualLiveMode()).maybeSingle<GuestAnnualPayment>();
      if (!result.error) payment = result.data;
    } catch { console.error("[annual-confirmation] Guest purchase lookup unavailable"); }
    if (payment) {
      const ready = annualPaymentGrantsAccess(payment) && payment.fulfillment_state === "ready" && !!payment.email_message_id;
      const review = ["refunded", "disputed"].includes(payment.status) || !["pending", "ready"].includes(payment.fulfillment_state) || (payment.status === "paid" && !!payment.expires_at && Date.parse(payment.expires_at) <= Date.now());
      const retry = ["failed", "expired"].includes(payment.status);
      return <main className="min-h-screen px-4 py-12"><section className="mx-auto max-w-2xl rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-6 sm:p-10">
        <BrandStudioTyAshLockup compact />
        <h1 className="mt-8 font-[family:var(--font-cormorant)] text-4xl leading-tight">{ready ? "Votre projet vidéo peut commencer !" : review ? "Votre commande nécessite une vérification." : retry ? "Votre paiement n’a pas été finalisé." : "Votre accès est en cours de confirmation."}</h1>
        {ready ? <><p className="mt-6 leading-8">Votre paiement a bien été confirmé.</p><p className="mt-4 leading-8">{payment.activation_required && !payment.password_initialized_at ? "Nous venons de vous envoyer un e-mail pour créer votre mot de passe et accéder à Brand Studio X TyASH." : "Votre accès est disponible. Connectez-vous avec votre mot de passe habituel."}</p><p className="mt-4 text-sm leading-7">Pensez à vérifier vos courriers indésirables.</p><Link href={payment.activation_required && !payment.password_initialized_at ? "/activer" : "/"} className="mt-7 inline-block underline">{payment.activation_required && !payment.password_initialized_at ? "Renvoyer mon lien d’activation" : "Se connecter"}</Link></> : <p className="mt-6 leading-8">{review ? "Vos données et vos droits existants sont conservés. Contactez le support pour vérifier cette commande avant tout nouvel achat." : retry ? "Vous pouvez revenir au paiement pour réessayer." : "Nous attendons la confirmation sécurisée du paiement et la préparation de votre accès. Si vous avez déjà payé, ne repassez pas commande. L’e-mail vous sera envoyé dès que votre accès sera prêt."}</p>}
        {!ready && !review && !retry ? <PaymentConfirmationRefresh /> : null}
        {retry ? <Link href="/register" className="mt-7 inline-block underline">Réessayer le paiement</Link> : null}
        <a href="mailto:contact@marined-communication.fr" className="mt-7 block text-sm underline">Contacter le support</a>
      </section></main>;
    }
  }
  const account = await getCurrentAccount();
  if (account?.annual_access_required) {
    let payment = null;
    try { payment = await getAnnualPayment(account.id); } catch {
      console.error("[annual-confirmation] Payment lookup unavailable");
    }
    const ownsPayment = !!payment && payment.session_id === id;
    const active = ownsPayment && payment && account.is_active && annualPaymentGrantsAccess(payment);
    const blocked = ownsPayment && payment && ["refunded", "disputed"].includes(payment.status);
    const retryable = ownsPayment && payment && ["failed", "expired"].includes(payment.status);
    return <main className="min-h-screen px-5 py-12"><section className="mx-auto max-w-2xl rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 sm:p-12">
      <BrandStudioTyAshLockup compact />
      <h1 className="mt-8 text-3xl font-semibold">{active ? "Bienvenue dans Brand Studio X TyASH !" : blocked ? "Votre accès nécessite une vérification." : retryable ? "Votre paiement n’a pas été finalisé." : "Votre accès est en cours de confirmation."}</h1>
      <p className="mt-6 leading-8">{active ? "Votre accès est activé pour 1 an. Vous pouvez maintenant commencer à construire votre projet vidéo." : blocked ? "Un remboursement ou une contestation a suspendu vos droits. Vos données sont conservées. Contactez le support." : retryable ? "Aucun accès n’a été activé. Vous pouvez revenir à la page de paiement." : "Nous attendons la confirmation sécurisée du paiement. Si vous avez déjà payé, ne repassez pas commande."}</p>
      {!active && !blocked && !retryable ? <PaymentConfirmationRefresh /> : null}
      {active ? <Link href="/mon-espace" className="mt-8 inline-block rounded-xl bs-button-primary px-6 py-4 font-bold">Accéder à mon espace</Link> : retryable ? <Link href="/commander" className="mt-8 inline-block underline">Retour au paiement</Link> : null}
      <a href="mailto:contact@marined-communication.fr" className="mt-6 block text-sm underline">Contacter le support</a>
    </section></main>;
  }
  let state: "paid" | "pending" | "open" | "unknown" = "unknown";
  try {
    const owner = (await cookies()).get("platform_checkout_owner")?.value;
    if (owner && typeof id === "string" && /^cs_[a-zA-Z0-9_]+$/.test(id)) {
      const session = await getStripe().checkout.sessions.retrieve(id);
      if (session.metadata?.checkout_flow === PLATFORM_CHECKOUT_FLOW && session.metadata.return_owner === owner) {
        state = ["paid", "no_payment_required"].includes(session.payment_status) ? "paid" : session.status === "complete" ? "pending" : "open";
      }
    }
  } catch { /* An unavailable Stripe response must never be presented as a paid order. */ }
  const messages = {
    paid: ["Votre paiement est confirmé.", "Votre accès est en cours de préparation. Votre lien d’activation vous sera envoyé par e-mail. Si vous avez acheté depuis votre compte, retrouvez votre accès dans votre espace. Pensez à vérifier vos courriers indésirables."],
    pending: ["Votre paiement est en cours de validation.", "Vous recevrez votre lien d’activation après confirmation du paiement. Il n’est pas nécessaire de passer une nouvelle commande."],
    open: ["Votre paiement n’est pas finalisé.", "Votre accès sera activé uniquement après confirmation du paiement. Vous pouvez revenir à la page de commande."],
    unknown: ["Nous ne pouvons pas vérifier votre commande.", "Si vous avez déjà réglé votre commande, vérifiez votre boîte e-mail ou contactez Marine avant de recommencer le paiement."],
  };
  const [title, description] = messages[state];
  return <main className="flex min-h-screen items-center justify-center bg-[#fffaf0] px-5 py-12 text-[var(--order-ink)]"><section className="w-full max-w-xl rounded-[2rem] border border-[var(--order-border-strong)] bg-[var(--order-payment)] p-8 sm:p-12"><p className="text-xs font-bold uppercase tracking-widest text-[var(--order-accent)]">Brand Studio × Ty-Ash</p><h1 className="mt-5 text-3xl font-bold">{title}</h1><p className="mt-5 leading-8">{description}</p><Link href={state === "open" ? "/commander" : "/"} className="mt-8 inline-block rounded-xl bg-[var(--order-button)] px-6 py-4 font-bold text-[var(--order-button-ink)]">{state === "open" ? "Retour à la commande" : "Accéder à votre espace"}</Link><p className="mt-6 text-sm"><a href="mailto:contact@marined-communication.fr" className="underline">Contacter Marine</a></p></section></main>;
}
