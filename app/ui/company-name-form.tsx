"use client";

import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useActionState, useState } from "react";
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
  const initialCompanyName = currentCompanyName?.trim() ?? "";
  const [isEditing, setIsEditing] = useState(!initialCompanyName);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [editVersion, setEditVersion] = useState(0);
  const [submittedEditVersion, setSubmittedEditVersion] = useState(-1);
  const [state, formAction, pending] = useActionState(
    updateCompanyName,
    initialState,
  );
  const hasSuccessfulSave =
    state.status === "success" && submittedEditVersion === editVersion;
  const shouldShowDisplay = companyName.trim().length > 0 && (!isEditing || hasSuccessfulSave);

  if (shouldShowDisplay) {
    return (
      <div className="mt-5 space-y-2">
        <p className="block text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]">
          Nom de l&apos;entreprise
        </p>
        <button
          type="button"
          onClick={() => {
            setEditVersion((current) => current + 1);
            setIsEditing(true);
          }}
          className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-[0.95rem] border border-[#eadfca] bg-[#fffdf7] px-4 py-3 text-left text-sm text-[#6a5d53] transition hover:border-[#cf7430] hover:bg-white"
          aria-label="Modifier le nom de l'entreprise"
          title="Modifier le nom de l'entreprise"
        >
          <span className="min-w-0 break-words">{companyName}</span>
          <PencilSquareIcon className="h-4 w-4 shrink-0 text-[#cf7430] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-5 space-y-3"
      onSubmit={() => setSubmittedEditVersion(editVersion)}
    >
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
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Ex. Maison Lumiere"
          className="h-12 w-full rounded-[0.95rem] border border-[#eadfca] bg-[#fffdf7] px-4 text-sm text-[#6a5d53] outline-none transition focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b625a] transition hover:border-[#cf7430] hover:text-[#cf7430] disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Mise à jour..." : "Enregistrer"}
      </button>

      {state.status === "error" && state.message ? (
        <p
          className="text-sm leading-6 text-[#b45247]"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
