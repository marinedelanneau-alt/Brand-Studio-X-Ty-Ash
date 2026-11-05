"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripe = key ? loadStripe(key) : null;

export default function EmbeddedPlatformCheckout() {
  const [clientSecret, setClientSecret] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!stripe) return <p role="status" className="rounded-2xl bg-[var(--order-notice)] p-6 text-sm leading-7">Le paiement sera disponible prochainement. Pour toute question, contactez <a href="mailto:contact@marined-communication.fr" className="underline">Marine</a>.</p>;

  if (clientSecret) return <EmbeddedCheckoutProvider stripe={stripe} options={{ clientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>;

  return <form className="space-y-5" onSubmit={async (event) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    setPending(true); setError("");
    try {
      const response = await fetch("/api/stripe/create-embedded-checkout-session", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok || !result.clientSecret) throw new Error(result.error || "Impossible de préparer le paiement.");
      setClientSecret(result.clientSecret);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Veuillez réessayer dans quelques instants.");
    } finally { setPending(false); }
  }}>
    <label htmlFor="order-email" className="block text-sm font-semibold">Votre adresse e-mail</label>
    <input id="order-email" name="email" type="email" autoComplete="email" required disabled={pending} placeholder="vous@exemple.fr" className="w-full rounded-xl border border-[var(--order-border-strong)] bg-[var(--order-payment)] px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--order-focus)]" />
    <p className="text-sm leading-6 text-[var(--order-muted)]">Vous recevrez votre lien d’activation à cette adresse après validation du paiement.</p>
    <button disabled={pending} className="w-full rounded-xl bg-[var(--order-button)] px-5 py-4 font-bold text-[var(--order-button-ink)] transition hover:bg-[var(--order-button-hover)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--order-outline)] disabled:opacity-60">{pending ? "Préparation du paiement…" : "Continuer vers le paiement sécurisé"}</button>
    <p role="status" aria-live="polite" className="text-sm text-[var(--order-error)]">{error}</p>
  </form>;
}
