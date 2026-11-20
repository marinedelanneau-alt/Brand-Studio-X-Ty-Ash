"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function GuestCheckoutForm({ termsId, salesId, email = "" }: { termsId?: string; salesId?: string; email?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), acceptedTerms: form.get("acceptedTerms") === "on", termsId, salesId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Le paiement est momentanément indisponible.");
      const url = new URL(data.url);
      if (url.origin !== "https://checkout.stripe.com") throw new Error("Le lien de paiement est indisponible.");
      window.location.assign(url.toString());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Veuillez réessayer dans quelques instants."); setPending(false);
    }
  }
  return <form onSubmit={submit} className="space-y-5">
    <label className="block space-y-3"><span className="text-sm font-bold text-[var(--text-primary)]">Votre adresse e-mail</span>
      <input name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={email} className="h-14 w-full min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--tyash-primary)]" />
    </label>
    <label className="flex items-start gap-3 text-sm leading-6 text-[var(--text-muted)]"><input type="checkbox" name="acceptedTerms" required className="mt-1.5 shrink-0" />
      <span>J’ai lu et j’accepte les <Link href="/conditions-generales-vente" target="_blank" className="underline">conditions générales de vente</Link> et les <Link href="/conditions-generales-utilisation" target="_blank" className="underline">conditions générales d’utilisation</Link>.</span>
    </label>
    <button type="submit" disabled={pending || !termsId || !salesId} className="flex min-h-16 w-full items-center justify-center rounded-[1.15rem] bs-button-primary px-4 py-4 text-center text-sm font-extrabold uppercase tracking-[0.08em] text-white disabled:opacity-60">{pending ? "Ouverture du paiement…" : "CONTINUER VERS LE PAIEMENT"}</button>
    <p className="text-sm leading-6 text-[var(--text-muted)]">Après votre paiement, vous recevrez un e-mail pour activer votre accès.</p>
    {!termsId || !salesId ? <p role="status" className="text-sm leading-6">L’inscription est momentanément indisponible. Merci de réessayer ultérieurement.</p> : null}
    {error ? <p role="alert" className="text-sm leading-6 text-[var(--status-error-text)]">{error}</p> : null}
  </form>;
}
