"use client";

import { useState, useTransition } from "react";
import { resetCurrentUserAnswers } from "@/app/reset-user-answers";
import { clearAnswerDatabaseForUser } from "@/lib/persistence/answerDatabase";

const DRAFT_PREFIXES = [
  "brand-studio-module-answers:",
  "brand-studio-session-module-answers:",
];

function clearAnswerCache(storage: Storage) {
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key && DRAFT_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      storage.removeItem(key);
    }
  }
}

export default function ResetAnswersButton({ userId }: { userId: number }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetAnswers() {
    startTransition(async () => {
      const result = await resetCurrentUserAnswers();
      setMessage(result.message);

      if (result.status !== "success") {
        return;
      }

      clearAnswerCache(window.localStorage);
      clearAnswerCache(window.sessionStorage);
      await clearAnswerDatabaseForUser(userId);
      window.location.assign("/mon-espace");
    });
  }

  return (
    <div className="border-t border-[var(--border)] pt-6">
      <p className="text-[0.76rem] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
        Paramètres du compte
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
        Supprime toutes tes réponses et remet ta progression à zéro.
      </p>
      {!isConfirming ? (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          className="mt-4 text-sm font-bold text-[var(--status-error-text)] underline decoration-[#e9b9b1] underline-offset-4"
        >
          Réinitialiser mes réponses
        </button>
      ) : (
        <div className="mt-4 rounded-[1rem] border border-[#efc6bf] bs-status-light bg-[#fff4f1] p-4">
          <p className="text-sm font-semibold leading-6 text-[var(--status-error-text)]">
            Cette action supprimera uniquement tes réponses et ta progression. Elle est irréversible.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={resetAnswers}
              className="rounded-full bg-[#b45247] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-60"
            >
              {isPending ? "Réinitialisation..." : "Confirmer"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsConfirming(false)}
              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--text-primary)]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {message ? <p className="mt-3 text-sm text-[var(--status-error-text)]">{message}</p> : null}
    </div>
  );
}
