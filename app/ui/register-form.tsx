"use client";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useActionState, useState } from "react";
import { registerAccount } from "../register-account";
import Link from "next/link";

type RegisterState = {
  status: "idle" | "error";
  message: string;
};

const initialState: RegisterState = {
  status: "idle",
  message: "",
};

const inputClassName =
  "h-16 w-full rounded-[1.15rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] px-5 text-base text-[var(--text-primary)] shadow-[inset_0_1px_0_rgb(var(--tyash-highlight-rgb)/0.9),0_12px_24px_rgba(223,203,171,0.12)] outline-none transition duration-200 placeholder:text-[var(--text-muted)] focus:-translate-y-0.5 focus:border-[var(--tyash-primary)] focus:ring-4 focus:ring-[var(--tyash-focus-ring)]/20";

export default function RegisterForm({
  registrationToken,
  email,
  termsId,
  legalEnabled = false,
}: {
  registrationToken: string;
  email: string;
  termsId?: string;
  legalEnabled?: boolean;
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
            className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]"
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
            className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]"
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
              className="absolute inset-y-0 right-0 flex w-16 items-center justify-center text-[var(--text-muted)] transition hover:text-[var(--tyash-label-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tyash-focus-ring)]"
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
            className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]"
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
            className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]"
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

      <div className="rounded-[1.65rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_14px_28px_rgba(223,203,171,0.12)]">
        <p className="inline-flex rounded-full bs-status-light bg-[#eef6eb] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[var(--status-success-text)]">
          Ce que tu obtiens
        </p>
        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
          Après avoir choisi ton mot de passe, ton compte sera créé et tu accéderas directement à la formation.
        </p>
      </div>

      {termsId ? <label className="flex items-start gap-3 text-sm leading-6"><input type="hidden" name="termsId" value={termsId} /><input type="checkbox" name="acceptedTerms" required className="mt-1" /><span>J’ai lu et j’accepte les <Link href="/conditions-generales-utilisation" target="_blank" className="underline">conditions générales d’utilisation</Link>.</span></label> : null}
      <button
        type="submit"
        disabled={pending}
        className="flex h-16 w-full items-center justify-center rounded-[1.15rem] bs-button-primary px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_30px_rgb(var(--tyash-glow-rgb)/0.24)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Création du compte..." : "Créer mon compte"}
      </button>
      {legalEnabled ? <p className="text-sm leading-6 text-[var(--text-primary)]">Les informations du compte servent à fournir votre accès et à sauvegarder vos projets. Consultez la <Link href="/politique-confidentialite" className="underline">politique de confidentialité</Link> et les <Link href="/conditions-generales-utilisation" className="underline">CGU</Link>. L’inscription ne vaut pas consentement à recevoir de la prospection commerciale.</p> : null}

      <div className="min-h-7">
        {state.message ? (
          <p aria-live="polite" className="text-sm font-medium leading-6 text-[var(--status-warning-text)]">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
