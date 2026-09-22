import LegalDocumentPage from "@/app/ui/legal-document-page";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  return <LegalDocumentPage type="sales_terms" title="Conditions générales de vente" preview={(await searchParams).preview} />;
}
