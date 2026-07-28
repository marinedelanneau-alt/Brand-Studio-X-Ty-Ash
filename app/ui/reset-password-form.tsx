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
  "h-13 w-full rounded-[1rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffef9,#fff8dc)] px-5 text-[0.95rem] text-[#6a5d53] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_22px_rgba(223,203,171,0.1)] outline-none transition duration-200 placeholder:text-[#a19388] focus:-translate-y-0.5 focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/22";

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
          className="rounded-[1rem] border border-[#efc8c1] bg-[#fff4f1] p-4 text-sm font-medium leading-6 text-[#a94940]"
        >
          Ce lien de réinitialisation est invalide ou a expiré. Demande un
          nouveau lien depuis la page de connexion.
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="block text-[0.82rem] font-black uppercase tracking-[0.18em] text-[#8b7a70]">
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
        className="flex h-13 w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#e19b34,#f2cf58)] px-6 text-[0.92rem] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_24px_rgba(227,175,64,0.18)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
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
          className="flex h-13 w-full items-center justify-center rounded-[1rem] border border-[#eadfca] bg-white px-6 text-center text-[0.82rem] font-extrabold uppercase tracking-[0.12em] text-[#9f5526] transition hover:-translate-y-0.5"
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
