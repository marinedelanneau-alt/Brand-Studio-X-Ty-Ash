import { notFound } from "next/navigation";
import { isLegalReleaseEnabled } from "@/lib/legal-release";
import WithdrawalForm from "@/app/ui/withdrawal-form";
export const dynamic = "force-dynamic";
export default function WithdrawalPage() {
  if (!isLegalReleaseEnabled()) notFound();
  return <main className="mx-auto max-w-2xl space-y-6 px-5 py-12"><h1 className="text-3xl font-semibold">Se rétracter du contrat</h1><p>Vous pouvez déclarer votre rétractation sans créer de compte. Retrouvez la référence de commande dans la confirmation reçue par e-mail. Pour toute difficulté ou commande historique, écrivez à <a className="underline" href="mailto:contact@marined-communication.fr">contact@marined-communication.fr</a>.</p><WithdrawalForm /></main>;
}
