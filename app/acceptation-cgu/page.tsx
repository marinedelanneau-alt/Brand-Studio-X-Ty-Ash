import { redirect } from "next/navigation";
import LegalAcceptanceForm from "@/app/ui/legal-acceptance-form";
import { getAuthenticatedAccount } from "@/lib/session";
import { getCurrentTermsRequirement } from "@/lib/legal";

export default async function AcceptancePage() {
  const account = await getAuthenticatedAccount();
  if (!account.auth_user_id) redirect("/mon-espace");
  const document = await getCurrentTermsRequirement(account.auth_user_id, account);
  if (!document) redirect("/mon-espace");
  return <main className="min-h-screen bg-[#fbf7ef] px-5 py-12 text-[#4b4550]"><section className="mx-auto max-w-2xl rounded-3xl border border-[#eadfca] bg-[#fffdf8] p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-widest text-[#cf7430]">Information importante</p><h1 className="mt-4 text-3xl font-semibold">Nos Conditions Générales d’Utilisation évoluent</h1><p className="mt-5 leading-7">{document.change_summary || "Consultez le document complet avant de poursuivre."}</p><dl className="mt-5 grid gap-2 text-sm"><div><dt className="inline font-bold">Version : </dt><dd className="inline">{document.version}</dd></div><div><dt className="inline font-bold">Entrée en vigueur : </dt><dd className="inline">{document.effective_at ? new Date(document.effective_at).toLocaleDateString("fr-FR") : "À définir"}</dd></div></dl><LegalAcceptanceForm documentId={document.id}/></section></main>;
}
