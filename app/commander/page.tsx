import { projectDocumentCopy } from "@/lib/project-document-copy";
import type { Metadata } from "next";
import Link from "next/link";
import EmbeddedPlatformCheckout from "@/app/ui/embedded-platform-checkout";
import { communicationActionPlanEnabled } from "@/lib/platform-features";

export const metadata: Metadata = { title: "Commander — Brand Studio X Ty-Ash", description: "Construisez votre marque avec Brand Studio : votre accès à la plateforme pour 50 € TTC." };

const deliverables = [
  ["04 modules · 60 exercices", "Un parcours guidé pour avancer à votre rythme."],
  ["Votre stratégie de marque", "Des fondations claires pour affirmer votre positionnement."],
  [projectDocumentCopy("Votre guide personnalisé", "Votre carnet de projet"), projectDocumentCopy("Un document de référence pour donner vie à votre marque.", "Vos réponses et les éléments clés pour préparer votre vidéo.")],
  ...(communicationActionPlanEnabled() ? [["Votre plan d’actions", "Des prochaines étapes concrètes pour passer à l’action."]] : []),
  ["45 minutes avec Marine", "Un accompagnement individuel pour éclairer vos choix."],
];

export default function OrderPage() {
  return <main className="min-h-screen bg-[#fffaf0] text-[var(--order-ink)]">
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-7 sm:px-10">
      <Link href="/" className="text-lg font-black tracking-tight">BRAND STUDIO <span className="font-normal">× Ty-Ash</span></Link>
      <Link href="/" className="text-sm underline underline-offset-4">Vous avez déjà un compte ?</Link>
    </header>
    <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-16 pt-5 sm:px-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pt-12">
      <section aria-labelledby="order-title" className="relative overflow-hidden rounded-[2rem] bg-[var(--order-panel)] p-7 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em]">Votre marque commence ici</p>
        <h1 id="order-title" className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Donnez à votre marque<br /><span className="text-[var(--order-accent)]">une direction claire.</span></h1>
        <p className="mt-5 max-w-md leading-7">Retrouvez les outils, la méthode et l’accompagnement pour construire une marque qui vous ressemble.</p>
        <ul className="mt-9 space-y-5">{deliverables.map(([title, description]) => <li key={title} className="flex gap-4"><span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--order-button)] text-[var(--order-button-ink)]">✓</span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm leading-6">{description}</p></div></li>)}</ul>
        <div className="mt-9 border-t border-[#b87524]/30 pt-7"><p className="text-sm font-semibold">Votre accès à Brand Studio X Ty-Ash</p><p className="mt-2"><span className="text-6xl font-bold tracking-tight">50 €</span><span className="ml-2 text-sm font-semibold">TTC</span></p><p className="mt-3 text-sm">Paiement unique · Aucun abonnement</p></div>
      </section>
      <section aria-labelledby="payment-title" className="min-w-0 self-start rounded-[2rem] border border-[var(--order-border)] bg-[var(--order-payment)] p-5 shadow-[0_18px_70px_#a95d1410] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--order-accent)]">La prochaine étape</p>
        <h2 id="payment-title" className="mb-3 mt-3 text-2xl font-bold">Bienvenue dans Brand Studio</h2>
        <p className="mb-7 text-sm leading-7 text-[var(--order-muted)]">Renseignez votre e-mail, puis réglez votre commande directement dans le formulaire sécurisé Stripe.</p>
        <EmbeddedPlatformCheckout />
        <p className="mt-7 border-t border-[var(--order-border)] pt-5 text-center text-xs leading-6 text-[var(--order-muted)]">Paiement sécurisé par Stripe. Vos coordonnées bancaires sont traitées par Stripe.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[var(--order-muted)]"><Link href="/conditions-generales-vente" className="underline">Conditions de vente</Link><Link href="/politique-confidentialite" className="underline">Confidentialité</Link><a href="mailto:contact@marined-communication.fr" className="underline">Contacter Marine</a></div>
      </section>
    </div>
  </main>;
}
