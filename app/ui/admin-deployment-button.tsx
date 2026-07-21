"use client";

import { useActionState, useEffect, useState } from "react";
import {
  publishAdminDraftToAllUsers,
  type AdminDeploymentState,
} from "@/app/admin/modules/actions";

const initialState: AdminDeploymentState = { status: "idle", message: "" };

export default function AdminDeploymentButton() {
  const [state, formAction, pending] = useActionState(
    publishAdminDraftToAllUsers,
    initialState,
  );
  const [progress, setProgress] = useState(0);
  const displayedProgress = state.status === "success" && !pending ? 100 : progress;

  useEffect(() => {
    if (!pending) return;

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current;
        if (current < 35) return Math.min(current + 7, 35);
        if (current < 70) return Math.min(current + 4, 70);
        return Math.min(current + 1, 92);
      });
    }, 450);

    return () => window.clearInterval(timer);
  }, [pending]);

  return (
    <div className="mt-5 max-w-xl">
      <form
        action={formAction}
        onSubmit={() => setProgress(4)}
      >
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-[0.95rem] bg-[#4b4550] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_32px_rgba(75,69,80,0.18)] transition hover:bg-[#3f3943] disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Déploiement en cours…" : "Déployer à tous les utilisateurs"}
        </button>
      </form>

      {pending || state.status === "success" ? (
        <div className="mt-4 rounded-[1rem] border border-[#eadfca] bg-white/80 p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-4 text-sm font-semibold text-[#4b4550]">
            <span>{pending ? "Publication de la nouvelle version" : "Déploiement terminé"}</span>
            <span>{displayedProgress}%</span>
          </div>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#f1e9dc]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={displayedProgress}
          >
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#d98632,#f1cc56)] transition-[width] duration-500 ease-out"
              style={{ width: `${displayedProgress}%` }}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-[#7b7068]">
            {pending
              ? "Ne ferme pas cette page pendant la mise à jour des modules."
              : state.message}
          </p>
        </div>
      ) : null}

      {state.status === "error" && !pending ? (
        <div className="mt-4 rounded-[1rem] border border-[#efc6bf] bg-[#fff4f1] p-4" role="alert">
          <p className="text-sm font-semibold text-[#9d4e40]">Le déploiement n’a pas abouti.</p>
          <p className="mt-1 text-sm leading-6 text-[#9d4e40]">{state.message}</p>
        </div>
      ) : null}
    </div>
  );
}
