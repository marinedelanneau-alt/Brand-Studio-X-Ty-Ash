"use client";

import { useActionState } from "react";
import { updateCompanyName } from "../update-company-name";

type CompanyNameState = {
  status: "idle" | "error" | "success";
  message: string;
};

const initialState: CompanyNameState = {
  status: "idle",
  message: "",
};

export default function CompanyNameForm({
  currentCompanyName,
}: {
  currentCompanyName?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateCompanyName,
    initialState,
  );

  return (
    <form action={formAction} className="mt-5 space-y-3">
      <div className="space-y-2">
        <label
          htmlFor="company-name"
          className="block text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]"
        >
          Nom de l&apos;entreprise
        </label>
        <input
          id="company-name"
          name="companyName"
          type="text"
          required
          maxLength={120}
          defaultValue={currentCompanyName ?? ""}
          placeholder="Ex. Maison Lumiere"
          className="h-12 w-full rounded-[0.95rem] border border-[#eadfca] bg-[#fffdf7] px-4 text-sm text-[#6a5d53] outline-none transition focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a] transition hover:border-[#cf7430] hover:text-[#cf7430] disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Mise a jour..." : "Enregistrer"}
      </button>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm leading-6 text-[#b45247]"
              : "text-sm leading-6 text-[#5f8d63]"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
