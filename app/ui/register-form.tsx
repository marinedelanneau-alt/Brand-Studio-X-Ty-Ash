"use client";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useActionState, useState } from "react";
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

export default function RegisterForm({
  registrationToken,
  email,
}: {
  registrationToken: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    registerAccount,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5">
        <input name="registrationToken" type="hidden" value={registrationToken} />

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
            defaultValue={email}
            readOnly={Boolean(email)}
            placeholder="hello@brandstudio.fr"
            className={`${inputClassName} ${email ? "cursor-not-allowed opacity-75" : ""}`}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]"
          >
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              className={`${inputClassName} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-16 items-center justify-center text-[#8b7a70] transition hover:text-[#cf7430] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0cf55]"
            >
              {showPassword ? (
                <EyeSlashIcon aria-hidden="true" className="h-6 w-6" />
              ) : (
                <EyeIcon aria-hidden="true" className="h-6 w-6" />
              )}
            </button>
          </div>
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
          Ce que tu obtiens
        </p>
        <p className="mt-4 text-sm leading-6 text-[#8b7a70]">
          Après avoir choisi ton mot de passe, ton compte sera créé et tu accéderas directement à la formation.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-16 w-full items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,#e19b34,#f2cf58)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_30px_rgba(227,175,64,0.24)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Création du compte..." : "Créer mon compte"}
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
