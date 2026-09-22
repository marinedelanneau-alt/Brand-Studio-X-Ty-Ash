import Link from "next/link";
import { notFound } from "next/navigation";
import { isLegalReleaseEnabled } from "@/lib/legal-release";
import { getAuthenticatedAccount } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PrivacyRequestForm from "@/app/ui/privacy-request-form";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!isLegalReleaseEnabled()) notFound();
  const account = await getAuthenticatedAccount();
  const { data: requests } = await createSupabaseServerClient().from("privacy_requests").select("id,request_type,status,created_at,due_at").eq("account_id", account.id).order("created_at", { ascending: false }).limit(50);
  return <main className="mx-auto w-full max-w-3xl px-5 py-12"><Link href="/mon-espace" className="underline">Mon espace</Link><h1 className="my-6 text-3xl font-semibold">Mes données et mes droits</h1>
    <p className="leading-7">Téléchargez les données de votre compte et de votre projet ou transmettez une demande à l’équipe. Les demandes relatives aux données personnelles reçoivent en principe une réponse sous un mois. Les fichiers et copies enregistrés sur vos appareils restent sous votre contrôle.</p>
    <a href="/api/privacy/export" className="my-6 inline-block rounded-xl border p-3">Télécharger mes données (JSON)</a>
    <p><Link href="/politique-confidentialite" className="underline">Consulter la politique de confidentialité</Link></p>
    <PrivacyRequestForm />
    {requests?.length ? <section className="mt-8"><h2 className="text-xl font-semibold">Suivi de mes demandes</h2><ul className="mt-4 space-y-3">{requests.map((request) => <li key={request.id} className="rounded-xl border p-3">Référence : {request.id}<br />{new Date(request.created_at).toLocaleDateString("fr-FR")} — {request.status === "completed" ? "Traitée" : request.status === "processing" ? "En cours" : "Reçue"}</li>)}</ul></section> : null}
  </main>;
}
