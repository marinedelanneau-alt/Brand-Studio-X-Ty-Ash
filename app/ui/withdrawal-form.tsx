"use client";
import { useState } from "react";
export default function WithdrawalForm() {
  const [review, setReview] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <form className="space-y-5" onChange={() => setReview(false)} onSubmit={async (event) => {
    event.preventDefault();
    if (!review) { setReview(true); return; }
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/privacy/withdrawal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(form), confirmed: true }) });
      const result = await response.json();
      setMessage(result.message);
    } catch { setMessage("Envoi indisponible. Réessayez ou contactez contact@marined-communication.fr."); }
    finally { setPending(false); }
  }}>
    <label className="block">Nom complet<input required maxLength={200} name="name" autoComplete="name" className="block w-full rounded border p-3" /></label>
    <label className="block">E-mail utilisé pour la commande<input required type="email" name="email" autoComplete="email" className="block w-full rounded border p-3" /></label>
    <label className="block">Référence de commande<input required name="sessionId" maxLength={255} className="block w-full rounded border p-3" /></label>
    <label className="block">E-mail pour recevoir l’accusé de réception<input required type="email" name="receiptEmail" className="block w-full rounded border p-3" /></label>
    {review ? <p role="status">Vérifiez les informations ci-dessus. En confirmant, vous déclarez : « Je vous notifie ma rétractation du contrat Brand Studio correspondant à cette commande. »</p> : null}
    <button disabled={pending} className="rounded bg-[#4b4550] px-5 py-3 text-white">{pending ? "Envoi…" : review ? "Confirmer la rétractation" : "Se rétracter du contrat"}</button>
    <p role="status">{message}</p>
  </form>;
}
