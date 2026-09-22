import Link from "next/link";
import { notFound } from "next/navigation";
import { isLegalReleaseEnabled } from "@/lib/legal-release";
import { getLegalDocumentsForAdmin, getPublishedLegalDocument } from "@/lib/legal";
import { getAuthenticatedAdmin } from "@/lib/session";

export default async function LegalDocumentPage({ type, title, preview }: { type: string; title: string; preview?: string }) {
  if (!isLegalReleaseEnabled()) notFound();
  let document = await getPublishedLegalDocument(type);
  if (preview) {
    await getAuthenticatedAdmin();
    document = (await getLegalDocumentsForAdmin()).find((item) => item.id === preview && item.document_type === type) ?? null;
  }
  return <main className="mx-auto w-full max-w-3xl px-5 py-12 text-[#4b4550]">
    <Link href="/" className="underline">Retour à Brand Studio</Link>
    <h1 className="my-6 text-3xl font-semibold">{title}</h1>
    {preview ? <p className="mb-6 rounded-xl bg-amber-100 p-4">Prévisualisation administrateur — document non publié.</p> : null}
    {document ? <><p className="mb-8">Version {document.version}</p>{document.content.map((section) => <section key={section.id} id={section.id} className="mb-8"><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-3 whitespace-pre-wrap leading-7">{section.body}</p></section>)}</> : <p>Ce document n’est pas encore publié. Les informations doivent être finalisées par l’éditeur.</p>}
  </main>;
}
