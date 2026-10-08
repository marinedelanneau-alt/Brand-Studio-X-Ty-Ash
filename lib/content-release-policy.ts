import type { ContentPreviewMode } from "./content-releases";

export type ReleaseSelectionIntent = {
  source: "legacy" | "controlled";
  requestedReleaseId: string | null;
  previewRequested: boolean;
};

export function resolveReleaseSelectionIntent(input: {
  viewerIsAdmin: boolean;
  adminPreviewEnabled: boolean;
  controlledProductionEnabled: boolean;
  previewMode: ContentPreviewMode | null;
  publishedReleaseId: string | null;
  draftReleaseId: string | null;
}): ReleaseSelectionIntent {
  const previewRequested =
    input.viewerIsAdmin &&
    input.adminPreviewEnabled &&
    input.previewMode !== null;

  // Configuration errors are rejected by the server resolver. They must never
  // select a different content source here.
  return {
    source: "controlled",
    requestedReleaseId:
      previewRequested && input.draftReleaseId
        ? input.draftReleaseId
        : input.publishedReleaseId,
    previewRequested,
  };
}
