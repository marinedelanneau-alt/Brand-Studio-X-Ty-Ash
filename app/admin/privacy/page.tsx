import { getAuthenticatedAdmin } from "@/lib/session";
import { notFound } from "next/navigation";
import { isLegalReleaseEnabled } from "@/lib/legal-release";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updatePrivacyRequest } from "./actions";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!isLegalReleaseEnabled()) notFound();
  await getAuthenticatedAdmin();
  const { data, error } = await createSupabaseServerClient().from("privacy_requests").select("*").order("created_at", { ascending: false }).limit(200);
  const { data: withdrawals, error: withdrawalError } = await createSupabaseServerClient().from("commercial_withdrawals_v1").select("*").order("received_at", { ascending: false }).limit(200);
  return <main className="mx-auto max-w-5xl space-y-5 p-6"><h1 className="text-3xl font-semibold">Demandes de droits et rétractation</h1>
    <p>Vérifiez l’identité, traitez la demande et répondez à l’utilisateur avant de la clôturer. Le changement de statut ne supprime aucune donnée et ne rembourse aucun achat. Pour une rétractation, vérifiez immédiatement les délais propres au contrat.</p>
    {error ? <p>Les demandes ne sont pas disponibles. Vérifiez que la migration privacy_requests a été appliquée.</p> : null}
    <section className="space-y-3"><h2 className="text-xl font-semibold">Rétractations des commandes commerciales</h2>
      {withdrawalError ? <p>Liste indisponible : vérifiez la migration commerciale.</p> : null}
      {withdrawals?.map((item) => <article key={item.session_id} className="rounded border p-4"><p>{item.customer_name} — {item.session_id}</p><p>{item.declaration}</p><p>Reçue : {item.received_at} — {item.status}</p><p>Accusé : {item.receipt_sent_at ? "envoyé" : "à renvoyer"} — {item.receipt_email}</p></article>)}
    </section>
    {data?.map((request) => <article key={request.id} className="rounded-xl border bg-[var(--card)] p-5"><h2 className="font-semibold">{request.request_type} — compte {request.account_id}</h2><p>Référence : {request.id}</p><p>Reçue le {new Date(request.created_at).toLocaleDateString("fr-FR")} · échéance données : {new Date(request.due_at).toLocaleDateString("fr-FR")}</p><p className="my-4 whitespace-pre-wrap">{request.message}</p><form action={updatePrivacyRequest} className="flex gap-3"><input type="hidden" name="id" value={request.id} /><select name="status" defaultValue={request.status} className="border p-2"><option value="received">Reçue</option><option value="processing">En cours</option><option value="completed">Traitée et réponse envoyée</option></select><button className="rounded-lg border p-2">Enregistrer</button></form></article>)}
  </main>;
}
