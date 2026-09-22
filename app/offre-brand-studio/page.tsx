import { notFound } from "next/navigation";
import { isCommercialReleaseEnabled } from "@/lib/legal-release";
import { getPublishedLegalDocument } from "@/lib/legal";
import BrandStudioOrderForm from "@/app/ui/brand-studio-order-form";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!isCommercialReleaseEnabled()) notFound();
  const terms = await getPublishedLegalDocument("sales_terms");
  return <main className="mx-auto max-w-2xl px-5 py-12"><h1 className="text-4xl font-semibold">Construis ta marque avec Brand Studio</h1><p className="my-6 leading-7">Une expérience numérique guidée pour réfléchir à ta marque, la structurer progressivement et générer tes livrables, notamment ton Guide de Marque.</p><p className="text-3xl font-bold">289 €</p><p className="my-4">Paiement unique. Accès à toute la plateforme pendant 12 mois à compter de la validation de l’achat. Aucun abonnement ni renouvellement automatique.</p>{terms ? <BrandStudioOrderForm termsId={terms.id} /> : <p>Les conditions de vente sont en cours de finalisation.</p>}</main>;
}
