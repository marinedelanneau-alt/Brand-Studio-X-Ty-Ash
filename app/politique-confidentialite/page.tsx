import LegalDocumentPage from "@/app/ui/legal-document-page";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  return <LegalDocumentPage type="privacy_policy" title="Politique de confidentialité" preview={(await searchParams).preview} />;
}
