"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Impossible d'ouvrir le paiement");
      }

      const checkoutUrl = new URL(data.url);
      if (checkoutUrl.protocol !== "https:") {
        throw new Error("L'adresse de paiement retournée est invalide");
      }
      window.location.assign(checkoutUrl.toString());
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Impossible d'ouvrir le paiement",
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={startCheckout}
        disabled={isLoading}
        className="flex h-14 w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_22px_rgba(227,175,64,0.18)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {isLoading ? "Ouverture..." : "Accéder à la formation"}
      </button>
      {error ? <p className="text-sm font-semibold text-[#b84a33]">{error}</p> : null}
    </div>
  );
}
