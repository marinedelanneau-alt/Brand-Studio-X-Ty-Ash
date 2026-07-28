"use client";
import Link from "next/link";
import { useState } from "react";
import { acceptCurrentTerms } from "@/app/acceptation-cgu/actions";

export default function LegalAcceptanceForm({ documentId }: { documentId: string }) {
  const [accepted, setAccepted] = useState(false);
  return <form action={acceptCurrentTerms} className="mt-7 space-y-5">
    <input type="hidden" name="documentId" value={documentId}/>
    <label className="flex items-start gap-3 rounded-2xl border border-[#eadfca] bg-white p-4">
      <input required name="accepted" type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} className="mt-1 size-5"/>
      <span>J’ai lu et j’accepte les <Link target="_blank" className="font-semibold underline" href="/conditions-generales-utilisation">Conditions Générales d’Utilisation de Brand Studio</Link>.</span>
    </label>
    <button disabled={!accepted} className="w-full rounded-xl bg-[#cf7430] px-5 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Accepter et continuer</button>
  </form>;
}
