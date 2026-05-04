"use client";

import { useActionState } from "react";
import { registerAccount } from "../register-account";

type RegisterState = {
  status: "idle" | "error";
  message: string;
};

const initialState: RegisterState = {
  status: "idle",
  message: "",
};

const inputClassName =
  "h-16 w-full rounded-[1.15rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffef9,#fff8dc)] px-5 text-base text-[#6a5d53] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_24px_rgba(223,203,171,0.12)] outline-none transition duration-200 placeholder:text-[#aa9d91] focus:-translate-y-0.5 focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20";

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAccount,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]"
          >
            E-mail professionnel
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="hello@brandstudio.fr"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="clientName"
            className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]"
          >
            Nom complet
          </label>
          <input
            id="clientName"
            name="clientName"
            type="text"
            required
            autoComplete="name"
            placeholder="Marine Delanneau"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="companyName"
            className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]"
          >
            Entreprise
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            autoComplete="organization"
            placeholder="Brand Studio"
            className={inputClassName}
          />
        </div>
      </div>

      <div className="rounded-[1.65rem] border border-[#eadfca] bg-[#fffdf7] p-5 shadow-[0_14px_28px_rgba(223,203,171,0.12)]">
        <p className="inline-flex rounded-full bg-[#eef6eb] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[#72806f]">
          Ce que vous obtenez
        </p>
        <p className="mt-4 text-sm leading-6 text-[#8b7a70]">
          Votre compte est cree immediatement et un code d&apos;acces personnel
          vous est attribue pour la connexion.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-16 w-full items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,#e19b34,#f2cf58)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_30px_rgba(227,175,64,0.24)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Creation du compte..." : "Creer son compte"}
      </button>

      <div className="min-h-7">
        {state.message ? (
          <p aria-live="polite" className="text-sm font-medium leading-6 text-[#b98744]">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
