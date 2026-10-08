import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  controlled: false,
  publishLegacy: vi.fn(),
  publishRelease: vi.fn(),
  syncSnapshot: vi.fn(),
  ready: vi.fn(),
  revalidate: vi.fn(),
  saveDraft: vi.fn(),
  saveVoiceNote: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => { throw new Error(`redirect:${url}`); },
  unstable_rethrow: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getAuthenticatedAdmin: async () => ({ id: 42 }) }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/training", () => ({
  publishAdminModuleDraft: mocks.publishLegacy,
  getAdminWorkingModules: async () => [],
  createAdminVoiceNoteUploadTarget: vi.fn(),
  deleteAdminModuleDefinitionDraft: vi.fn(),
  saveAdminModuleDefinitionDraft: mocks.saveDraft,
  saveAdminVoiceNoteToDraft: mocks.saveVoiceNote,
}));
vi.mock("@/lib/content-releases", () => ({
  isControlledAdminPublishingEnabled: () => true,
  isControlledProductionContentEnabled: () => mocks.controlled,
  getApplicationReleaseState: async () => ({ current_draft_release_id: "draft-1" }),
  updateCurrentDraftSnapshot: mocks.syncSnapshot,
  markContentReleaseReady: mocks.ready,
  publishContentRelease: mocks.publishRelease,
  createContentDraft: vi.fn(),
}));

import { persistAdminVoiceNoteUrl, publishFinalVersionForAllUsers, saveAdminModuleDraft } from "../app/admin/modules/actions";

describe("publication vers la source lue par les utilisateurs", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.controlled = false; });

  it("refuse une question invalide sans retirer silencieusement des exercices", async () => {
    const form = new FormData();
    form.set("moduleId", "1");
    form.set("title", "Mon entreprise");
    form.set("position", "1");
    form.set("submodulesJson", JSON.stringify([{
      title: "Valeurs", contentHtml: "<p>Valeurs</p>",
      exerciseGroups: [{ groupId: "values", questions: [
        { type: "open", question: "Question valide", options: [] },
        { type: "multiple", question: "Question sans choix", options: [] },
      ] }],
    }]));
    const result = await saveAdminModuleDraft(form);
    expect(result.status).toBe("error");
    expect(result.message).toContain("au moins deux choix");
    expect(mocks.saveDraft).not.toHaveBeenCalled();
    expect(mocks.publishLegacy).not.toHaveBeenCalled();
  });

  it("publie les tables historiques même si la prévisualisation admin utilise les releases", async () => {
    await expect(publishFinalVersionForAllUsers()).rejects.toThrow("status=published");
    expect(mocks.publishLegacy).toHaveBeenCalledWith(42);
    expect(mocks.publishRelease).not.toHaveBeenCalled();
    expect(mocks.revalidate).toHaveBeenCalledWith("/mon-espace");
  });

  it("synchronise et publie la release lorsque les utilisateurs lisent les releases", async () => {
    mocks.controlled = true;
    await expect(publishFinalVersionForAllUsers()).rejects.toThrow("status=published");
    expect(mocks.syncSnapshot).toHaveBeenCalledWith({ releaseId: "draft-1", modules: [] });
    expect(mocks.ready).toHaveBeenCalledWith(expect.objectContaining({ releaseId: "draft-1" }));
    expect(mocks.publishRelease).toHaveBeenCalledWith(expect.objectContaining({ releaseId: "draft-1" }));
    expect(mocks.publishLegacy).not.toHaveBeenCalled();
  });

  it("ne signale pas une réussite si la publication échoue", async () => {
    mocks.publishLegacy.mockRejectedValueOnce(new Error("Publication impossible"));
    await expect(publishFinalVersionForAllUsers()).rejects.toThrow("Publication impossible");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it.each([false, true])("applique une sauvegarde aux utilisateurs (mode controlled=%s)", async (controlled) => {
    mocks.controlled = controlled;
    const form = new FormData();
    form.set("moduleId", "1");
    form.set("title", "Module modifié");
    form.set("position", "1");
    form.set("isPublished", "on");
    form.set("submodulesJson", JSON.stringify([{
      clientId: "2", title: "Mission", contentHtml: "<p>Texte modifié</p>",
      videoUrl: "", audioUrl: "", audioTranscript: "", exerciseGroups: [],
    }]));
    const result = await saveAdminModuleDraft(form);
    expect(result.status).toBe("success");
    expect(mocks.saveDraft).toHaveBeenCalled();
    expect(controlled ? mocks.publishRelease : mocks.publishLegacy).toHaveBeenCalledOnce();
    expect(mocks.revalidate).toHaveBeenCalledWith("/mon-espace");
  });

  it("remonte l'échec de publication lors d'une sauvegarde", async () => {
    mocks.publishLegacy.mockRejectedValueOnce(new Error("Publication impossible"));
    const form = new FormData();
    form.set("title", "Module");
    form.set("position", "1");
    form.set("submodulesJson", JSON.stringify([{
      title: "Mission", contentHtml: "<p>Texte</p>", exerciseGroups: [],
    }]));
    expect(await saveAdminModuleDraft(form)).toEqual({ status: "error", message: "Publication impossible" });
  });

  it.each([false, true])("publie les notes vocales vers la source utilisateur (controlled=%s)", async (controlled) => {
    mocks.controlled = controlled;
    const form = new FormData();
    form.set("moduleId", "1");
    form.set("submoduleId", "2");
    form.set("target", "submodule");
    form.set("audioUrl", "https://example.com/introduction.mp3");

    expect((await persistAdminVoiceNoteUrl(form)).status).toBe("success");
    expect(mocks.saveVoiceNote).toHaveBeenCalledWith(expect.objectContaining({
      accountId: 42, moduleId: 1, targetId: 2,
    }));
    expect(controlled ? mocks.publishRelease : mocks.publishLegacy).toHaveBeenCalledOnce();
    expect(mocks.revalidate).toHaveBeenCalledWith("/mon-espace", "layout");
  });

  it("remonte l'échec de publication d'une note vocale", async () => {
    mocks.publishLegacy.mockRejectedValueOnce(new Error("Publication impossible"));
    const form = new FormData();
    form.set("moduleId", "1");
    form.set("submoduleId", "2");
    form.set("target", "submodule");
    form.set("audioUrl", "https://example.com/introduction.mp3");

    expect(await persistAdminVoiceNoteUrl(form)).toEqual({
      status: "error", message: "Publication impossible", url: "",
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
