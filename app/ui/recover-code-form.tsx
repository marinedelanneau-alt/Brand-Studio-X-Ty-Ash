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
  "h-16 w-full rounded-[1.15rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffef9,#fff8dc)] px-5 text-base text-[#6a5d53] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_24px_rgba(223,203,171,0.12)] outline-none transition duration-200 placeholder:text-[#aa9d91] focus:-translate-y-0.5 focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20";

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
          className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]"
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
        className="flex h-16 w-full items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,#e19b34,#f2cf58)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_30px_rgba(227,175,64,0.24)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Envoi..." : "Recevoir mon code"}
      </button>

      <div className="min-h-7">
        {state.message ? (
          <p
            aria-live="polite"
            className={
              state.status === "error"
                ? "text-sm font-medium leading-6 text-[#c16a5c]"
                : "text-sm font-medium leading-6 text-[#b98744]"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
