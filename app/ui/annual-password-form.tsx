"use client";
import { useActionState, useState, type FormEvent } from "react";
import { initializeAnnualPassword } from "@/app/activer/actions";

export function AnnualResendForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(false);
    try {
      const response = await fetch("/api/annual-activation/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: new FormData(event.currentTarget).get("email") }) });
      if (!response.ok) throw new Error("Resend unavailable");
      setSent(true);
    } catch {
      setError(true);
    } finally { setPending(false); }
  }
  return <form onSubmit={submit} className="mt-7 space-y-4">
    <label className="block space-y-2"><span className="text-sm">Votre adresse e-mail</span><input name="email" type="email" autoComplete="email" maxLength={254} required className="h-13 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4" /></label>
    <button disabled={pending} className="min-h-12 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-bold">{pending ? "Demande en cours…" : "Renvoyer mon lien d’activation"}</button>
    {sent ? <p role="status" className="text-sm leading-7">Si un accès payé peut être activé avec cette adresse, un e-mail vous sera envoyé. Vérifiez aussi vos courriers indésirables. Si votre mot de passe est déjà défini, connectez-vous.</p> : null}
    {error ? <p role="alert" className="text-sm leading-7">Votre demande n’a pas pu être transmise. Veuillez réessayer dans quelques instants.</p> : null}
  </form>;
}

export default function AnnualPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(initializeAnnualPassword, { error: "" });
  return <form action={action} className="space-y-5">
    <input type="hidden" name="token" value={token} />
    {[{ name: "password", label: "Mot de passe" }, { name: "confirmation", label: "Confirmer le mot de passe" }].map((field) => <label key={field.name} className="block space-y-2"><span className="text-sm font-bold">{field.label}</span><input name={field.name} type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="h-14 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4" /></label>)}
    <button disabled={pending} className="min-h-14 w-full rounded-xl bs-button-primary px-4 py-4 text-sm font-extrabold text-white">{pending ? "Activation en cours…" : "ENTRER DANS MON ESPACE"}</button>
    {state.error ? <p role="alert" className="text-sm leading-7 text-[var(--status-error-text)]">{state.error}</p> : null}
  </form>;
}
