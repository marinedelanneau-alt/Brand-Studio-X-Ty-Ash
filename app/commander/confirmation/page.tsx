import { cookies } from "next/headers";
import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { PLATFORM_CHECKOUT_FLOW } from "@/lib/platform-checkout";

export const dynamic = "force-dynamic";
export const metadata = { title: "Votre commande — Brand Studio", robots: { index: false, follow: false } };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: id } = await searchParams;
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
