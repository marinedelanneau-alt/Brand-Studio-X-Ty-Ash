"use client";

import { useActionState } from "react";
import { createBrandProject } from "../create-brand-project";

type ProjectState = {
  status: "idle" | "error";
  message: string;
};

const initialState: ProjectState = {
  status: "idle",
  message: "",
};

export default function ProjectNameForm() {
  const [state, formAction, pending] = useActionState(
    createBrandProject,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="brand-project-name"
          className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]"
        >
          Nom du projet
        </label>
        <input
          id="brand-project-name"
          name="name"
          type="text"
          required
          placeholder="Ex. Plateforme Brand Studio"
          className="h-14 w-full rounded-[1rem] border border-[#eadfca] bg-[#fffdf7] px-4 text-base text-[#6a5d53] outline-none transition focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="brand-project-logo"
          className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]"
        >
          Logo
        </label>
        <input
          id="brand-project-logo"
          name="logo"
          type="file"
          accept="image/*"
          className="block w-full rounded-[1rem] border border-[#eadfca] bg-[#fffdf7] px-4 py-4 text-sm text-[#6a5d53] outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#fff6e3] file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.12em] file:text-[#cf7430] focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
        />
        <p className="text-sm leading-6 text-[#8b7a70]">
          Optionnel. PNG, JPG, SVG ou WebP, jusqu&apos;à 5 Mo.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-14 w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Création..." : "Créer mon projet"}
      </button>

      {state.message ? (
        <p className="text-sm leading-6 text-[#b45247]">{state.message}</p>
      ) : null}
    </form>
  );
}
