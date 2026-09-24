"use client";
import { useActionState } from "react";
import { requestPrivacyAction } from "@/app/mes-donnees/actions";
export default function PrivacyRequestForm() {
  const [state, action, pending] = useActionState(requestPrivacyAction, { message: "" });
  return <form action={action} className="mt-6 grid gap-4">
    <label>Votre demande<select name="requestType" className="mt-2 block w-full rounded-lg border bg-[var(--card)] p-3"><option value="access">Accès à mes données</option><option value="rectification">Rectification</option><option value="erasure">Effacement de mes données / fermeture du compte</option><option value="opposition">Opposition</option><option value="restriction">Limitation du traitement</option><option value="portability">Portabilité</option><option value="withdrawal">Rétractation d’un achat</option></select></label>
    <label>Précisions<textarea name="message" maxLength={4000} rows={4} className="mt-2 block w-full rounded-lg border p-3" /></label>
    <p className="text-sm">N’envoyez pas de mot de passe, numéro de carte ou copie de pièce d’identité. Une demande d’effacement est examinée en tenant compte des obligations de conservation et de votre abonnement.</p>
    <label className="flex gap-2"><input type="checkbox" name="confirmed" required />Je confirme vouloir transmettre cette demande à l’équipe Brand Studio.</label>
    <button disabled={pending} className="rounded-xl bg-[#4b4550] p-3 text-white disabled:opacity-50">{pending ? "Envoi…" : "Confirmer ma demande"}</button>
    <p role="status">{state.message}</p>
  </form>;
}
