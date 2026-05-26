"use client";

import { useState } from "react";

export default function BillingPortalButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Impossible d'ouvrir la facturation");
      }

      window.location.href = data.url;
    } catch (portalError) {
      setError(
        portalError instanceof Error
          ? portalError.message
          : "Impossible d'ouvrir la facturation",
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openPortal}
        disabled={isLoading}
        className="flex h-11 w-full items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a] transition disabled:cursor-wait disabled:opacity-70"
      >
        {isLoading ? "Ouverture..." : "Mettre a jour ma facturation"}
      </button>
      {error ? <p className="text-xs font-semibold text-[#b84a33]">{error}</p> : null}
    </div>
  );
}
