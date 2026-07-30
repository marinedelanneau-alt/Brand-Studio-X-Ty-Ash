"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
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
    <form className="space-y-3" onSubmit={startCheckout}>
      <div>
        <label
          htmlFor="checkout-email"
          className="mb-2 block text-sm font-bold text-[#4b4550]"
        >
          E-mail <span className="text-[#b84a33]">*</span>
        </label>
        <input
          id="checkout-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
          placeholder="email@exemple.com"
          className="h-12 w-full rounded-[0.9rem] border border-[#dfd5c6] bg-white px-4 text-sm text-[#4b4550] outline-none transition placeholder:text-[#aaa098] focus:border-[#df9b39] focus:ring-2 focus:ring-[#df9b39]/20 disabled:cursor-wait disabled:opacity-70"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="flex h-14 w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_22px_rgba(227,175,64,0.18)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {isLoading ? "Ouverture..." : "Accéder à la formation"}
      </button>
      {error ? <p className="text-sm font-semibold text-[#b84a33]">{error}</p> : null}
    </form>
  );
}
