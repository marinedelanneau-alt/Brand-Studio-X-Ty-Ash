"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "../login";

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

export default function ResetPasswordForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

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
    <form action={formAction} className="space-y-5">
      <label className="block space-y-2">
        <span className="block text-[0.82rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]">
          Nouveau mot de passe
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8 caracteres minimum"
          className={inputClassName}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex h-13 w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#e19b34,#f2cf58)] px-6 text-[0.92rem] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_24px_rgba(227,175,64,0.18)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Mise a jour..." : "Enregistrer mon mot de passe"}
      </button>

      <div className="min-h-7">
        {state.message ? (
          <p
            aria-live="polite"
            className={
              state.status === "error"
                ? "text-sm font-medium leading-6 text-[#b45247]"
                : "text-sm font-medium leading-6 text-[#5f8d63]"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
