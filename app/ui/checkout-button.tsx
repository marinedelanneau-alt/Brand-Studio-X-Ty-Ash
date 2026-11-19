"use client";
import { useState } from "react";
export default function CheckoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function pay() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/stripe/create-checkout-session", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error ?? "Impossible d’ouvrir le paiement.");
      const url = new URL(data.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Adresse de paiement invalide.");
      window.location.assign(url.toString());
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible d’ouvrir le paiement."); setPending(false); }
  }
  return <div><button type="button" onClick={pay} disabled={pending} className="flex min-h-14 w-full items-center justify-center rounded-xl bs-button-primary px-5 py-4 font-bold disabled:opacity-60">{pending ? "Ouverture du paiement…" : "Accéder à Brand Studio — 52 €"}</button>{error ? <p role="alert" className="mt-4 text-sm text-[var(--status-error-text)]">{error}</p> : null}</div>;
}
