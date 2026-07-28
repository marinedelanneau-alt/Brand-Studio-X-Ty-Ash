import type { ActiveContentRelease } from "@/lib/content-releases";
import ContentPreviewBanner from "./content-preview-banner";
import { ContentPreviewProvider } from "./content-preview-context";

export default function ContentPreviewFrame({
  preview,
  children,
}: {
  preview: ActiveContentRelease;
  children: React.ReactNode;
}) {
  return (
    <ContentPreviewProvider
      value={{
        activeReleaseId: preview.release?.id ?? null,
        releaseStatus: preview.release?.status ?? null,
        isPreviewMode: preview.isPreviewMode,
        previewMode: preview.previewMode,
        publishedReleaseId: preview.publishedReleaseId,
        draftReleaseId: preview.draftReleaseId,
      }}
    >
      <ContentPreviewBanner preview={preview} />
      {children}
    </ContentPreviewProvider>
  );
}
