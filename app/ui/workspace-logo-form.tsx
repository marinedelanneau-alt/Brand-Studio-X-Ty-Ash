"use client";

import { useActionState, useRef } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { updateWorkspaceLogo } from "../update-workspace-logo";

type LogoState = {
  status: "idle" | "error" | "success";
  message: string;
};

const initialState: LogoState = {
  status: "idle",
  message: "",
};

export default function WorkspaceLogoForm({
  currentLogoUrl,
  projectName,
}: {
  currentLogoUrl?: string | null;
  projectName?: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateWorkspaceLogo,
    initialState,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="mt-3 space-y-2">
      {!currentLogoUrl ? (
        <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Logo de l&apos;espace
        </p>
      ) : null}

      <input
        ref={inputRef}
        name="logo"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          if (event.currentTarget.files?.length) {
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className={`group relative overflow-hidden disabled:cursor-wait disabled:opacity-70 ${
          currentLogoUrl
            ? "h-20 w-fit max-w-full rounded-[0.8rem] bg-transparent"
            : "flex h-12 w-full items-center justify-center rounded-[0.95rem] border border-[var(--border)] bg-[var(--card)] px-4 text-sm"
        } font-black uppercase tracking-[0.12em] text-[var(--text-primary)]`}
      >
        {currentLogoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentLogoUrl}
              alt={projectName ? `Logo de ${projectName}` : "Mon logo"}
              className="h-full w-auto max-w-full object-contain"
            />
            <span className="pointer-events-none absolute inset-0 rounded-[1rem] bg-[radial-gradient(circle_at_bottom_right,rgba(75,69,80,0.08),transparent_24%)] opacity-0 transition duration-200 group-hover:opacity-100" />
            <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]/92 text-[var(--tyash-label-text)] opacity-0 shadow-[0_6px_14px_rgba(107,98,90,0.1)] transition duration-200 group-hover:opacity-100">
              <PencilSquareIcon className="h-4 w-4" />
            </span>
          </>
        ) : (
          <span>{pending ? "Import..." : "Mon logo"}</span>
        )}
      </button>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm leading-6 text-[var(--status-error-text)]"
              : "text-sm leading-6 text-[var(--status-success-text)]"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
