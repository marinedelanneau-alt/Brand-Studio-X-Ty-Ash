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
          className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]"
        >
          Nom du projet
        </label>
        <input
          id="brand-project-name"
          name="name"
          type="text"
          required
          placeholder="Ex. Plateforme Brand Studio"
          className="h-14 w-full rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] px-4 text-base text-[var(--text-primary)] outline-none transition focus:border-[var(--tyash-primary)] focus:ring-4 focus:ring-[var(--tyash-focus-ring)]/20"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="brand-project-logo"
          className="block text-[0.9rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]"
        >
          Logo
        </label>
        <input
          id="brand-project-logo"
          name="logo"
          type="file"
          accept="image/*"
          className="block w-full rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm text-[var(--text-primary)] outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[var(--tyash-soft)] file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.12em] file:text-[var(--tyash-label-text)] focus:border-[var(--tyash-primary)] focus:ring-4 focus:ring-[var(--tyash-focus-ring)]/20"
        />
        <p className="text-sm leading-6 text-[var(--text-muted)]">
          Optionnel. PNG, JPG, SVG ou WebP, jusqu&apos;à 5 Mo.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-14 w-full items-center justify-center rounded-[1rem] bs-button-primary px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Création..." : "Créer mon projet"}
      </button>

      {state.message ? (
        <p className="text-sm leading-6 text-[var(--status-error-text)]">{state.message}</p>
      ) : null}
    </form>
  );
}
