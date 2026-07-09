"use client";

import { startTransition, useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginWithPassword, sendPasswordlessLoginLink } from "../login";

type ActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

const inputClassName =
  "h-13 w-full rounded-[1rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffef9,#fff8dc)] px-5 text-[0.95rem] text-[#6a5d53] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_22px_rgba(223,203,171,0.1)] outline-none transition duration-200 placeholder:text-[#a19388] focus:-translate-y-0.5 focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/22";

export default function AccessLoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    loginWithPassword,
    initialState,
  );
  const [magicLinkState, magicLinkAction, magicLinkPending] = useActionState(
    sendPasswordlessLoginLink,
    initialState,
  );
  const visibleState = magicLinkState.message ? magicLinkState : state;

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    startTransition(() => {
      router.push("/mon-espace");
      router.refresh();
    });
  }, [router, state.status]);

  return (
    <form action={formAction} className="max-w-[41rem] space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-[0.82rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]"
        >
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="hello@brandstudio.fr"
          className={`${inputClassName} max-w-[41rem]`}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-[0.82rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]"
        >
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Ton mot de passe"
          className={`${inputClassName} max-w-[41rem]`}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-13 w-full max-w-[41rem] items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#e19b34,#f2cf58)] px-6 text-[0.92rem] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_24px_rgba(227,175,64,0.18)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Connexion..." : "Entrer"}
      </button>

      <button
        type="submit"
        formAction={magicLinkAction}
        formNoValidate
        disabled={magicLinkPending}
        className="flex h-13 w-full max-w-[41rem] items-center justify-center rounded-[1rem] border border-[#eadfca] bg-white px-6 text-[0.82rem] font-extrabold uppercase tracking-[0.12em] text-[#6f645b] shadow-[0_10px_22px_rgba(223,203,171,0.1)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {magicLinkPending ? "Envoi du lien..." : "Recevoir un lien sans mot de passe"}
      </button>

      <div className="min-h-7">
        {visibleState.message ? (
          <p
            aria-live="polite"
            className={
              visibleState.status === "error"
                ? "text-sm font-medium leading-6 text-[#b45247]"
                : "text-sm font-medium leading-6 text-[#5f8d63]"
            }
          >
            {visibleState.message}
          </p>
        ) : null}
      </div>

      <div className="rounded-[1.65rem] border border-[#eadfca] bg-[#fffdf7] p-5 shadow-[0_14px_28px_rgba(223,203,171,0.12)]">
        <p className="inline-flex rounded-full bg-[#eef6eb] px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.2em] text-[#72806f]">
          Nouveau client
        </p>
        <p className="mt-4 text-sm leading-6 text-[#8b7a70]">
          Le paiement declenche l&apos;envoi d&apos;un code d&apos;activation.
          Tu pourras ensuite créer ton compte et choisir ton mot de passe.
        </p>
        <Link
          href="/pricing"
          className="mt-5 flex h-14 w-full items-center justify-center rounded-[1.1rem] border border-[#eadfca] bg-white px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-[#82766b] transition duration-200 hover:-translate-y-0.5"
        >
          Souscrire a la formation
        </Link>
      </div>
    </form>
  );
}
