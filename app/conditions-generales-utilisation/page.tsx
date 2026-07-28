import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalDocumentsForAdmin, getPublishedLegalDocument, isLegalPreviewEnabled } from "@/lib/legal";

export const dynamic = "force-dynamic";

export default async function TermsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const previewId = typeof query.preview === "string" ? query.preview : null;
  let document = await getPublishedLegalDocument("terms_of_use");
  let preview = false;
  if (!document && previewId && isLegalPreviewEnabled()) {
    document = (await getLegalDocumentsForAdmin()).find((item) => item.id === previewId) ?? null;
    preview = Boolean(document);
  }
  if (!document) notFound();
  return (
    <main className="min-h-screen bg-[#fbf7ef] px-5 py-10 text-[#4b4550]">
      <article className="mx-auto max-w-3xl rounded-3xl border border-[#eadfca] bg-white p-6 shadow-sm sm:p-10">
        {preview ? <p className="mb-6 rounded-xl bg-amber-100 px-4 py-3 text-sm font-bold">Prévisualisation Admin — ce document n’est pas publié.</p> : null}
        <Link href="/" className="text-sm font-semibold text-[#cf7430]">← Retour à Brand Studio</Link>
        <h1 className="mt-6 text-3xl font-semibold">{document.title}</h1>
        <p className="mt-3 text-sm text-[#786d64]">Version {document.version} · Mise à jour le {new Date(document.updated_at).toLocaleDateString("fr-FR")}</p>
        <nav aria-label="Sommaire" className="my-8 rounded-2xl bg-[#fbf7ef] p-5">
          <p className="font-bold">Sommaire</p>
          <ol className="mt-3 space-y-2 text-sm">{document.content.map((section) => <li key={section.id}><a className="underline" href={`#${section.id}`}>{section.title}</a></li>)}</ol>
        </nav>
        <div className="space-y-9">{document.content.map((section) => <section id={section.id} key={section.id}><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-[#625a55]">{section.body}</p></section>)}</div>
      </article>
    </main>
  );
}
