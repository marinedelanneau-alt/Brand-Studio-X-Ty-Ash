import type { BrevoDiagnostic } from "@/lib/brevo-diagnostics";

// Only render the sanitized DTO returned by the Admin-only server action.
export default function BrevoErrorNotice({ diagnostic }: { diagnostic: BrevoDiagnostic }) {
  const parts = [diagnostic.httpStatus === null ? null : `HTTP ${diagnostic.httpStatus}`, diagnostic.code, diagnostic.message].filter(Boolean);
  return <p role="alert" className="mt-3 text-sm">
    Erreur d’envoi : {parts.join(" — ") || "Envoi non confirmé. Aucun détail disponible."}
  </p>;
}
