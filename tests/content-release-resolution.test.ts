import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  published: { id: "v1", status: "published" } as { id: string; status: string } | null,
  draft: { id: "v2", status: "draft" }, error: null as { message: string } | null,
  reads: [] as string[],
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ from: (table: string) => {
    db.reads.push(table); let requestedId: unknown;
    const query = {
      select: () => query, eq: (_column: string, value: unknown) => { requestedId = value; return query; },
      maybeSingle: async () => ({ error: db.error, data: table === "application_release_state"
        ? { published_release_id: "v1", current_draft_release_id: "v2" }
        : requestedId === "v1" ? db.published : db.draft }),
    }; return query;
  } }),
}));
import { resolveActiveContentRelease } from "../lib/content-releases";

describe("résolution réelle de la publication officielle", () => {
  beforeEach(() => {
    vi.stubEnv("CONTENT_RELEASE_READ_MODE", "controlled");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADMIN_DRAFT_PREVIEW", "false");
    db.published = { id: "v1", status: "published" }; db.error = null; db.reads = [];
  });
  afterEach(() => vi.unstubAllEnvs());
  it.each(["published", "legacy", ""])("rejette le mode %s sans retour historique", async (mode) => {
    vi.stubEnv("CONTENT_RELEASE_READ_MODE", mode);
    await expect(resolveActiveContentRelease({ account: { role: "user" } })).rejects.toThrow("doit valoir controlled");
    expect(db.reads).toEqual([]);
  });
  it.each(["missing", "archived", "database"])("rejette une release %s sans retour historique", async (failure) => {
    if (failure === "missing") db.published = null;
    if (failure === "archived") db.published!.status = "archived";
    if (failure === "database") db.error = { message: "Base indisponible" };
    await expect(resolveActiveContentRelease({ account: { role: "user" } })).rejects.toThrow();
    expect(db.reads).not.toContain("brand_modules");
  });
  it("ignore une demande de brouillon utilisateur et bloque l'aperçu admin en production", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADMIN_DRAFT_PREVIEW", "true");
    for (const role of ["user", "admin"]) {
      const result = await resolveActiveContentRelease({ account: { role }, previewMode: "new_user" });
      expect(result.release?.id).toBe("v1"); expect(result.isPreviewMode).toBe(false);
    }
  });
  it("autorise exclusivement l'aperçu admin explicite hors production", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "preview"); vi.stubEnv("NEXT_PUBLIC_ENABLE_ADMIN_DRAFT_PREVIEW", "true");
    expect((await resolveActiveContentRelease({ account: { role: "admin" }, previewMode: "current_answers" })).release?.id).toBe("v2");
    expect((await resolveActiveContentRelease({ account: { role: "user" }, previewMode: "current_answers" })).release?.id).toBe("v1");
  });
});
