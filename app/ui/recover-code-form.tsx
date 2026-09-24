"use client";

import { useActionState } from "react";
import { recoverAccessCode } from "../recover-access-code";

type RecoverState = {
  status: "idle" | "error" | "success";
  message: string;
};

const initialState: RecoverState = {
  status: "idle",
  message: "",
};

const inputClassName =
  "h-16 w-full rounded-[1.15rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] px-5 text-base text-[var(--text-primary)] shadow-[inset_0_1px_0_rgb(var(--tyash-highlight-rgb)/0.9),0_12px_24px_rgba(223,203,171,0.12)] outline-none transition duration-200 placeholder:text-[var(--text-muted)] focus:-translate-y-0.5 focus:border-[var(--tyash-primary)] focus:ring-4 focus:ring-[var(--tyash-focus-ring)]/20";

export default function RecoverCodeForm() {
  const [state, formAction, pending] = useActionState(
    recoverAccessCode,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]"
        >
          E-mail de connexion
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

      <button
        type="submit"
        disabled={pending}
        className="flex h-16 w-full items-center justify-center rounded-[1.15rem] bs-button-primary px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_30px_rgb(var(--tyash-glow-rgb)/0.24)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Envoi..." : "Recevoir mon code"}
      </button>

      <div className="min-h-7">
        {state.message ? (
          <p
            aria-live="polite"
            className={
              state.status === "error"
                ? "text-sm font-medium leading-6 text-[var(--status-error-text)]"
                : "text-sm font-medium leading-6 text-[var(--status-warning-text)]"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
