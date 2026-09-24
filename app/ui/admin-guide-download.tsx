"use client";

import { useState } from "react";

export default function AdminGuideDownload({ userId }: { userId: number }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function download() {
    setPending(true);
    setMessage("Génération du guide à partir des réponses enregistrées…");
    try {
      const response = await fetch(`/admin/users/${userId}/guide/download`, { cache: "no-store" });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "Le téléchargement a échoué.");
      }
      if (!response.headers.get("Content-Type")?.includes("application/pdf")) throw new Error("Reconnectez-vous à votre compte administrateur.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || `guide-de-marque-${userId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Guide de Marque téléchargé.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Le PDF n’a pas pu être téléchargé.");
    } finally {
      setPending(false);
    }
  }
  return <div className="space-y-2">
    <button type="button" onClick={download} disabled={pending} className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--heading-color)] disabled:cursor-wait disabled:opacity-60">
      {pending ? "Génération du PDF…" : "Télécharger le Guide de Marque (PDF)"}
    </button>
    <p role="status" aria-live="polite" className="max-w-lg text-sm text-[var(--text-primary)]">{message}</p>
  </div>;
}
