"use client";

import { CheckCircleIcon, EnvelopeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function PaymentSuccessPopup() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#403a40]/45 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="payment-success-title">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-[#eadfca] bg-[#fffdf8] p-7 shadow-[0_28px_90px_rgba(64,58,64,0.28)] sm:p-9">
        <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#cf7430,#f0cf55)]" />
        <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="absolute right-5 top-5 rounded-full p-2 text-[#8b7a70] transition hover:bg-[#f7efe4] hover:text-[#cf7430]">
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef6eb] text-[#72806f]">
          <CheckCircleIcon className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#cf7430]">Paiement confirmé</p>
        <h2 id="payment-success-title" className="mt-3 pr-8 font-[family:var(--font-cormorant)] text-4xl leading-none text-[#4b4550]">
          Ton lien personnel est en route.
        </h2>
        <div className="mt-6 flex gap-4 rounded-[1.3rem] border border-[#eadfca] bg-white p-5">
          <EnvelopeIcon className="mt-0.5 h-7 w-7 shrink-0 text-[#cf7430]" aria-hidden="true" />
          <p className="text-sm leading-7 text-[#746961]">
            Un e-mail vient de t’être envoyé. Ouvre le lien personnel qu’il contient pour choisir ton mot de passe, créer ton compte et accéder à la formation.
          </p>
        </div>
        <p className="mt-4 text-xs leading-6 text-[#8a8077]">
          Pense à vérifier les dossiers Promotions, Notifications ou Spam si tu ne le vois pas dans ta boîte de réception.
        </p>
        <button type="button" onClick={() => setOpen(false)} className="mt-7 flex h-14 w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-white">
          J’ai compris
        </button>
      </div>
    </div>
  );
}
