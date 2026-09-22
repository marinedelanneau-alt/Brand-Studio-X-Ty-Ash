"use client";
import Link from "next/link";
import { useState } from "react";
import { immediateServiceConsent } from "@/lib/brand-studio-offer";
export default function BrandStudioOrderForm({ termsId }: { termsId: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return <form className="space-y-5" onSubmit={async (event) => {
    event.preventDefault(); setPending(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/stripe/create-brand-studio-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ termsId, email: form.get("email"), acceptedTerms: form.get("acceptedTerms") === "on", immediateAccess: form.get("immediateAccess") === "on" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Adresse de paiement invalide.");
      window.location.assign(url.href);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Paiement indisponible."); setPending(false); }
  }}>
    <label className="block">E-mail<input type="email" name="email" autoComplete="email" required className="mt-2 block w-full rounded-lg border p-3" /></label>
    <label className="flex gap-3"><input type="checkbox" name="acceptedTerms" required /><span>J’accepte les <Link href="/conditions-generales-vente" target="_blank" className="underline">CGV</Link>.</span></label>
    <label className="flex items-start gap-3"><input type="checkbox" name="immediateAccess" required className="mt-1" /><span>{immediateServiceConsent}</span></label>
    <p><Link href="/politique-confidentialite" className="underline">Utilisation de vos données et exercice de vos droits</Link></p>
    <button disabled={pending} className="w-full rounded-xl bg-[#4b4550] px-5 py-4 text-white disabled:opacity-50">{pending ? "Préparation…" : "Commander avec obligation de paiement — 289 €"}</button><p role="status">{message}</p>
  </form>;
}
