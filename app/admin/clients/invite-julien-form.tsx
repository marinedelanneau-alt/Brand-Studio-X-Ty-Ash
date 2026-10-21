"use client";
import { useActionState } from "react";
import { inviteJulien } from "./viewer-actions";
import type { JulienInvitationState } from "@/lib/julien-invitation";
import BrevoErrorNotice from "./brevo-error-notice";
const initial: JulienInvitationState = { status: "idle", account: "unchecked", accessGranted: false, emailSent: false, message: "" };
export default function InviteJulienForm() {
  const [state, action, pending] = useActionState(inviteJulien, initial);
  return <form action={action} className="mt-3 space-y-3">
    <button disabled={pending} className="bs-button-primary rounded px-4 py-2 disabled:opacity-50">{pending ? "Invitation en cours…" : "Inviter Julien"}</button>
    {state.status !== "idle" ? <div aria-live="polite">
      <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
      <ul className="mt-2 text-sm">
        <li>Compte : {({ unchecked: "non vérifié", absent: "absent", created: "créé", existing: "existant" })[state.account]}</li>
        <li>Accès gratuit et suivi clients : {state.accessGranted ? "accordés" : "non accordés"}</li>
        <li>Email : {state.emailSent ? "accepté par Brevo pour envoi" : "non envoyé"}</li>
      </ul>
      {state.brevoError ? <BrevoErrorNotice diagnostic={state.brevoError} /> : null}
    </div> : null}
  </form>;
}
