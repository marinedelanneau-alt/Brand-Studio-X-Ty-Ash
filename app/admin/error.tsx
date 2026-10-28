"use client";

import { useEffect } from "react";
import { isMissingServerAction } from "@/lib/server-action-error";

export default function AdminError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const isOutdatedPage = isMissingServerAction(error.message);

  useEffect(() => {
    console.error("[admin] Unhandled administration error", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">
        {isOutdatedPage ? "Rechargez l’administration" : "L’administration a rencontré une erreur"}
      </h1>
      <p className="mt-4">
        {isOutdatedPage
          ? "Une ancienne version de la page est restée ouverte après une mise à jour du site."
          : "La page n’a pas pu terminer son opération. Si le problème persiste après le rechargement, transmettez la référence ci-dessous à l’assistance lorsqu’elle est disponible."}
      </p>
      <p className="mt-3">Rechargez la page pour retrouver les modules et vérifier le résultat avant de relancer une publication.</p>
      {error.digest ? <p className="mt-3 text-sm">Référence de l’erreur : <code>{error.digest}</code></p> : null}
      <a href="/admin/modules" className="mt-6 inline-flex rounded-xl border px-5 py-3 font-bold">Ouvrir les modules</a>
    </main>
  );
}
