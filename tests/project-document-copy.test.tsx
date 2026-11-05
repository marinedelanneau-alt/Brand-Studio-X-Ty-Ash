import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GeneratedBrandGuide } from "../lib/brand-guide";

vi.mock("../app/brand-guide/actions", () => ({ saveBrandGuideExport: vi.fn() }));

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("project document presentation", () => {
  it("renames historical snapshots for client and Admin without modifying them", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cplzwnlstcpqqzqeawgs.supabase.co");
    vi.resetModules();
    const { GuideCover } = await import("../app/ui/brand-guide");
    const guide = {
      brandName: "Projet témoin", generatedAt: "2026-11-05T12:00:00Z",
      brandAssets: {}, cover: { title: "Guide de Marque - Projet témoin", subtitle: "Signature", introLine: "Introduction" },
    } as GeneratedBrandGuide;
    const before = JSON.stringify(guide);
    const client = renderToStaticMarkup(<GuideCover guide={guide} />);
    const admin = renderToStaticMarkup(<GuideCover guide={guide} readOnly />);
    expect(client).toContain("TON CARNET DE PROJET");
    expect(admin).toContain("BRIEF STRATÉGIQUE VIDÉO");
    expect(client).toContain("Projet témoin");
    expect(client).not.toContain("Guide de Marque");
    expect(JSON.stringify(guide)).toBe(before);
  });

  it("preserves original Brand Studio naming", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://original.supabase.co");
    const copy = await import("../lib/project-document-copy");
    expect(copy.projectDocumentTitle).toBe("Guide de marque");
    expect(copy.projectDocumentCopy("Original", "TYASH")).toBe("Original");
  });
});
