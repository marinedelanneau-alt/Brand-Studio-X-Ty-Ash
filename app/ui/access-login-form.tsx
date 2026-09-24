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
  "h-12 w-full rounded-[1rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] px-5 text-[0.92rem] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgb(var(--tyash-highlight-rgb)/0.9),0_10px_20px_rgba(223,203,171,0.1)] outline-none transition duration-200 placeholder:text-[var(--text-muted)] focus:-translate-y-0.5 focus:border-[var(--tyash-primary)] focus:ring-4 focus:ring-[var(--tyash-focus-ring)]/22";

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
    <form action={formAction} className="bs-access-login max-w-[41rem] space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-[0.82rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]"
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
          className="block text-[0.82rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]"
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
            className="absolute inset-y-0 right-1 flex w-12 touch-none select-none items-center justify-center rounded-[0.8rem] text-[var(--text-muted)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--tyash-label-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tyash-focus-ring)]"
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
        className="bs-access-primary-action flex h-12 w-full max-w-[41rem] items-center justify-center rounded-[1rem] bs-button-primary px-6 text-[0.86rem] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_12px_22px_rgb(var(--tyash-glow-rgb)/0.18)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Connexion..." : "Entrer"}
      </button>

      <button
        type="submit"
        formAction={resetAction}
        formNoValidate
        disabled={resetPending}
        className="w-full max-w-[41rem] text-center text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--tyash-label-text)] transition hover:text-[var(--tyash-label-text)] disabled:cursor-wait disabled:opacity-70"
      >
        {resetPending ? "Envoi en cours..." : "Mot de passe oublie ?"}
      </button>

      <div className="min-h-5">
        {visibleState.message ? (
          <p
            aria-live="polite"
            className={
              visibleState.status === "error"
                ? "text-sm font-medium leading-6 text-[var(--status-error-text)]"
                : "text-sm font-medium leading-6 text-[var(--status-success-text)]"
            }
          >
            {visibleState.message}
          </p>
        ) : null}
      </div>

    </form>
  );
}
