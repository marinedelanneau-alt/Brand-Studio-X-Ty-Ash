"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

const inputClassName =
  "h-13 w-full rounded-[1rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] px-5 text-[0.95rem] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgb(var(--tyash-highlight-rgb)/0.9),0_12px_22px_rgba(223,203,171,0.1)] outline-none transition duration-200 placeholder:text-[var(--text-muted)] focus:-translate-y-0.5 focus:border-[var(--tyash-primary)] focus:ring-4 focus:ring-[var(--tyash-focus-ring)]/22";

export default function ResetPasswordForm({
  hasCallbackError = false,
}: {
  hasCallbackError?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({
    status: "idle",
    message: "",
  });
  const [pending, setPending] = useState(false);
  const [linkError, setLinkError] = useState(hasCallbackError);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const prepareRecoverySession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const hashError = hashParams.get("error");
      const hashErrorCode = hashParams.get("error_code");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (hashError || hashErrorCode) {
        if (!cancelled) {
          setLinkError(true);
        }
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      const supabase = createSupabaseBrowserClient();

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        window.history.replaceState(null, "", window.location.pathname);

        if (!cancelled) {
          setLinkError(Boolean(error));
          setSessionReady(!error);
        }
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!cancelled) {
        setLinkError(!user);
        setSessionReady(Boolean(user));
      }
    };

    void prepareRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateRecoveryPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (password.length < 8) {
      setState({
        status: "error",
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLinkError(true);
      setState({
        status: "error",
        message:
          "La session de réinitialisation a expiré. Demande un nouveau lien.",
      });
      setPending(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setState({
        status: "error",
        message:
          "Le mot de passe n’a pas pu être mis à jour. Demande un nouveau lien si celui-ci a expiré.",
      });
      setPending(false);
      return;
    }

    setState({
      status: "success",
      message: "Mot de passe mis à jour. Redirection en cours…",
    });
    router.push("/mon-espace");
    router.refresh();
  };

  return (
    <form onSubmit={updateRecoveryPassword} className="space-y-5">
      {linkError ? (
        <div
          role="alert"
          className="rounded-[1rem] border border-[#efc8c1] bs-status-light bg-[#fff4f1] p-4 text-sm font-medium leading-6 text-[var(--status-error-text)]"
        >
          Ce lien de réinitialisation est invalide ou a expiré. Demande un
          nouveau lien depuis la page de connexion.
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="block text-[0.82rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Nouveau mot de passe
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          disabled={linkError || !sessionReady}
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          className={inputClassName}
        />
      </label>

      <button
        type="submit"
        disabled={pending || linkError || !sessionReady}
        className="flex h-13 w-full items-center justify-center rounded-[1rem] bs-button-primary px-6 text-[0.92rem] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_24px_rgb(var(--tyash-glow-rgb)/0.18)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {pending
          ? "Mise à jour…"
          : sessionReady
            ? "Enregistrer mon mot de passe"
            : "Validation du lien..."}
      </button>

      {linkError ? (
        <Link
          href="/"
          className="flex h-13 w-full items-center justify-center rounded-[1rem] border border-[var(--border)] bg-[var(--card)] px-6 text-center text-[0.82rem] font-extrabold uppercase tracking-[0.12em] text-[var(--tyash-label-text)] transition hover:-translate-y-0.5"
        >
          Demander un nouveau lien
        </Link>
      ) : null}

      <div className="min-h-7">
        {state.message ? (
          <p
            aria-live="polite"
            className={
              state.status === "error"
                ? "text-sm font-medium leading-6 text-[var(--status-error-text)]"
                : "text-sm font-medium leading-6 text-[var(--status-success-text)]"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
