"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import {
  loginWithPassword,
  sendPasswordResetLink,
} from "../login";

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [state, formAction, pending] = useActionState(
    loginWithPassword,
    initialState,
  );
  const [resetState, resetAction, resetPending] = useActionState(
    sendPasswordResetLink,
    initialState,
  );
  const visibleState = resetState.message ? resetState : state;

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
        <div className="relative max-w-[41rem]">
          <input
            id="password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Ton mot de passe"
            className={`${inputClassName} max-w-[41rem] pr-14`}
          />
          <button
            type="button"
            aria-label="Maintenir pour afficher le mot de passe"
            aria-pressed={isPasswordVisible}
            onPointerDown={(event) => {
              event.preventDefault();
              setIsPasswordVisible(true);
            }}
            onPointerUp={() => setIsPasswordVisible(false)}
            onPointerCancel={() => setIsPasswordVisible(false)}
            onPointerLeave={() => setIsPasswordVisible(false)}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                setIsPasswordVisible(true);
              }
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") {
                setIsPasswordVisible(false);
              }
            }}
            onBlur={() => setIsPasswordVisible(false)}
            className="absolute inset-y-0 right-1 flex w-12 touch-none select-none items-center justify-center rounded-[0.8rem] text-[#8b7a70] transition hover:bg-[#f6eddc] hover:text-[#cf7430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0cf55]"
          >
            {isPasswordVisible ? (
              <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <EyeIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
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
        formAction={resetAction}
        formNoValidate
        disabled={resetPending}
        className="w-full max-w-[41rem] text-center text-sm font-extrabold uppercase tracking-[0.12em] text-[#cf7430] transition hover:text-[#9f5526] disabled:cursor-wait disabled:opacity-70"
      >
        {resetPending ? "Envoi en cours..." : "Mot de passe oublie ?"}
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

    </form>
  );
}
