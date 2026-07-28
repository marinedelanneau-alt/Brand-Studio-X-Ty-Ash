import Link from "next/link";
import type { ActiveContentRelease } from "@/lib/content-releases";
import { exitContentPreview } from "@/app/admin/releases/actions";

export default function ContentPreviewBanner({
  preview,
}: {
  preview: ActiveContentRelease;
}) {
  if (!preview.isPreviewMode || !preview.release) return null;

  return (
    <aside
      className="print:hidden sticky top-0 z-[100] border-b border-[#df9b39] bg-[#fff6e3] px-4 py-3 text-[#5f4937]"
      data-content-preview-banner
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b45f26]">
            Mode brouillon — visible uniquement par les administrateurs
          </p>
          <p className="mt-1 text-sm">
            {preview.release.name} · version {preview.release.version_number} ·{" "}
            {preview.previewMode === "new_user"
              ? "jeu de réponses de test séparé"
              : "avec mes réponses actuelles"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/releases"
            className="rounded-xl border border-[#d9b98d] bg-white px-4 py-2 text-sm font-bold"
          >
            Retour à l’administration
          </Link>
          <form action={exitContentPreview}>
            <button className="rounded-xl bg-[#4b4550] px-4 py-2 text-sm font-bold text-white">
              Quitter l’aperçu
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
