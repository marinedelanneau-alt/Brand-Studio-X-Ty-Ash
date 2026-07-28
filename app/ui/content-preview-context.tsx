"use client";

import { createContext, useContext } from "react";
import type {
  ContentPreviewMode,
  ContentReleaseStatus,
} from "@/lib/content-releases";

export type ContentPreviewContextValue = {
  activeReleaseId: string | null;
  releaseStatus: ContentReleaseStatus | null;
  isPreviewMode: boolean;
  previewMode: ContentPreviewMode | null;
  publishedReleaseId: string | null;
  draftReleaseId: string | null;
};

const defaultValue: ContentPreviewContextValue = {
  activeReleaseId: null,
  releaseStatus: null,
  isPreviewMode: false,
  previewMode: null,
  publishedReleaseId: null,
  draftReleaseId: null,
};

const ContentPreviewContext = createContext(defaultValue);

export function ContentPreviewProvider({
  value,
  children,
}: {
  value: ContentPreviewContextValue;
  children: React.ReactNode;
}) {
  return (
    <ContentPreviewContext.Provider value={value}>
      {children}
    </ContentPreviewContext.Provider>
  );
}

export function useContentPreview() {
  return useContext(ContentPreviewContext);
}
