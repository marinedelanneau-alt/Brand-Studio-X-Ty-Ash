import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  state: { published_release_id: "v1", current_draft_release_id: null as string | null },
  releases: {} as Record<string, { id: string; status: string }>,
  snapshots: {} as Record<string, { schema_version: number; modules: unknown[]; updated_at: string; brand_guide_settings: object; pdf_settings: object; interface_settings: object }>,
  rows: {} as Record<string, unknown>, reads: [] as string[], writes: [] as string[], audit: [] as string[],
  revision: 0, publishError: "",
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); }, unstable_rethrow: vi.fn() }));
vi.mock("@/lib/session", () => ({ getAuthenticatedAdmin: async () => ({ id: 42 }) }));
vi.mock("@/lib/module-completion-fallback", () => ({ getCompletedModuleIdsFromCookie: async () => [] }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ from: (table: string) => {
  store.reads.push(table);
  const response = () => ({ data: structuredClone(store.rows[table] ?? null), error: null });
  const query = {
    select: () => query, eq: () => query, order: () => query, limit: () => query, returns: () => query,
    maybeSingle: async () => response(), then: (resolve: (value: unknown) => unknown) => Promise.resolve(response()).then(resolve),
    insert: () => { throw new Error(`Unexpected write:${table}`); }, update: () => { throw new Error(`Unexpected write:${table}`); },
    upsert: () => { throw new Error(`Unexpected write:${table}`); }, delete: () => { throw new Error(`Unexpected write:${table}`); },
  }; return query;
} }) }));
vi.mock("@/lib/content-releases", () => ({
  getApplicationReleaseState: async () => ({ ...store.state }),
  getContentRelease: async (id: string) => store.releases[id] ? { ...store.releases[id] } : null,
  getContentReleaseSnapshot: async (id: string) => structuredClone(store.snapshots[id] ?? null),
  getRequestedPreviewMode: async () => null,
  getAdminPreviewAnswers: async () => ({}),
  resolveActiveContentRelease: async () => {
    const release = store.releases[store.state.published_release_id];
    if (!release || release.status !== "published") throw new Error("Release publiée invalide.");
    return { source: "controlled", release, isPreviewMode: false, previewMode: null };
  },
  listContentReleaseSchedules: async () => [],
  createContentDraft: async (input: { sourceReleaseId: string; replaceCurrentDraft?: boolean }) => {
    const id = `draft-${++store.revision}`;
    if (store.state.current_draft_release_id && !input.replaceCurrentDraft) throw new Error("Draft exists");
    if (store.state.current_draft_release_id) store.releases[store.state.current_draft_release_id].status = "archived";
    store.releases[id] = { id, status: "draft" };
    store.snapshots[id] = structuredClone(store.snapshots[input.sourceReleaseId]);
    store.state.current_draft_release_id = id; return id;
  },
  updateCurrentDraftSnapshot: async (input: { releaseId: string; expectedUpdatedAt: string; modules: unknown[]; brandGuideSettings: object; pdfSettings: object; interfaceSettings: object }) => {
    const snapshot = store.snapshots[input.releaseId];
    if (store.releases[input.releaseId].status !== "draft" || snapshot.updated_at !== input.expectedUpdatedAt) throw new Error("Stale draft");
    snapshot.modules = structuredClone(input.modules);
    snapshot.brand_guide_settings = input.brandGuideSettings; snapshot.pdf_settings = input.pdfSettings; snapshot.interface_settings = input.interfaceSettings;
    snapshot.updated_at = String(++store.revision); store.writes.push("draft_snapshot");
  },
  markContentReleaseReady: async ({ releaseId }: { releaseId: string }) => { store.releases[releaseId].status = "ready"; },
  publishContentRelease: async ({ releaseId }: { releaseId: string }) => {
    if (store.publishError) throw new Error(store.publishError);
    if (store.releases[releaseId].status !== "ready") throw new Error("Not ready");
    store.releases[store.state.published_release_id].status = "archived";
    store.releases[releaseId].status = "published"; store.state.published_release_id = releaseId;
    store.state.current_draft_release_id = null; store.audit.push("release_published");
  },
}));

import { saveAdminModuleDraft, publishFinalVersionForAllUsers } from "../app/admin/modules/actions";
import { getAdminWorkingModules, getWorkspaceData, publishAdminModuleDraft } from "../lib/training";
import { saveAdminReleaseModules } from "../lib/admin-content-release";

const question = (id: number, position: number) => ({ id, position, module_id: 1, submodule_id: 2, stableKey: `exercise_${id}`,
  type: "open", question: `Question ${id} A`, options: [], explanation: "", answer_placeholder: "", audio_url: null, audio_transcript: null });

async function formForPublished(text = "B") {
  const modules = await getAdminWorkingModules(42);
  const form = new FormData();
  form.set("moduleId", "1"); form.set("position", "1"); form.set("isPublished", "on"); form.set("title", `Module ${text}`); form.set("saveMode", "manual");
  form.set("expectedModuleUpdatedAt", modules[0].editorRevision ?? modules[0].updated_at ?? "initial");
  form.set("submodulesJson", JSON.stringify([{ clientId: "2", title: `Sous-module ${text}`, contentHtml: `<p>Texte ${text}</p>`,
    exerciseGroups: [{ groupId: "g1", questions: modules[0].exercises.map((exercise) => ({ clientId: String(exercise.id), type: exercise.type, question: `Question ${exercise.id} ${text}`, options: [] })) }],
  }])); return form;
}

describe("brouillon privé et publication officielle sans mutation utilisateur", () => {
  beforeEach(() => {
    vi.clearAllMocks(); store.revision = 0; store.reads = []; store.writes = []; store.audit = []; store.publishError = "";
    store.state = { published_release_id: "v1", current_draft_release_id: null }; store.releases = { v1: { id: "v1", status: "published" } };
    const exercises = [question(3, 1), question(4, 2)];
    store.snapshots = { v1: { schema_version: 1, updated_at: "0", brand_guide_settings: { theme: "Ty Ash" }, pdf_settings: { size: "A4" }, interface_settings: { mode: "light" }, modules: [{
      id: 1, stableKey: "module_1", position: 1, title: "Module A", is_published: true, updated_at: "initial",
      submodules: [{ id: 2, stableKey: "submodule_2", position: 1, title: "Sous-module A", content_html: "<p>Texte A</p>", exercises }], exercises,
    }] } };
    store.rows = { brand_projects: { id: 10, account_id: 7, name: "Projet existant" }, client_access_codes: { id: 7, role: "user" },
      project_exercise_answers: [{ id: 1, project_id: 10, module_id: 1, exercise_id: 3, answer_text: "Réponse A", selected_options: [], updated_at: "2026-09-23T12:00:00Z" }],
      project_module_states: [{ id: 1, project_id: 10, module_id: 1, is_completed: true }], brand_exports: null, user_answers: [] };
  });

  it("A → brouillon B → utilisateur A → publication B, avec réponses et progression intactes", async () => {
    const before = structuredClone(store.rows); const a = await getWorkspaceData(7);
    expect(a.modules[0].title).toBe("Module A"); expect((await saveAdminModuleDraft(await formForPublished())).status).toBe("success");
    expect(store.state.published_release_id).toBe("v1"); expect(store.audit).toEqual([]);
    expect((await getWorkspaceData(7)).modules[0].title).toBe("Module A"); expect((await getAdminWorkingModules(42))[0].title).toBe("Module B");
    await expect(publishFinalVersionForAllUsers()).rejects.toThrow("status=published");
    const b = await getWorkspaceData(7);
    expect(b.modules[0].title).toBe("Module B"); expect(b.modules[0].submodules[0].title).toBe("Sous-module B");
    expect(b.modules[0].submodules[0].content_html).toBe("<p>Texte B</p>"); expect(b.modules[0].exercises[0].question).toBe("Question 3 B");
    expect(b.modules[0].answers[3]).toEqual(["Réponse A"]); expect(b.modules[0].progress).toEqual(a.modules[0].progress);
    expect(b.project).toEqual(a.project); expect(store.rows).toEqual(before); expect(store.state.current_draft_release_id).toBeNull();
    expect(store.releases.v1.status).toBe("archived"); expect(store.audit).toEqual(["release_published"]);
    expect(store.snapshots[store.state.published_release_id].pdf_settings).toEqual({ size: "A4" });
    expect(store.reads).not.toContain("brand_modules"); expect(store.reads).not.toContain("module_versions");
  });

  it("autorise plusieurs sauvegardes privées et un ajout final avec identité conservée", async () => {
    const form = await formForPublished(); const subs = JSON.parse(String(form.get("submodulesJson")));
    subs[0].exerciseGroups[0].questions.push({ clientId: "new-question", type: "open", question: "Nouvelle question", options: [] });
    form.set("submodulesJson", JSON.stringify(subs)); const first = await saveAdminModuleDraft(form); expect(first.status).toBe("success");
    const added = (await getAdminWorkingModules(42))[0].exercises[2]; form.set("expectedModuleUpdatedAt", first.updatedAt!);
    expect((await saveAdminModuleDraft(form)).status).toBe("success"); expect((await getAdminWorkingModules(42))[0].exercises[2].id).toBe(added.id);
    expect((await getWorkspaceData(7)).modules[0].exercises).toHaveLength(2);
    await expect(publishFinalVersionForAllUsers()).rejects.toThrow("status=published"); const published = (await getWorkspaceData(7)).modules[0];
    expect(published.exercises).toHaveLength(3); expect(published.answers[3]).toEqual(["Réponse A"]);
    expect(published.answers[added.id]).toBeUndefined(); expect(published.progress.isCompleted).toBe(true);
  });

  it.each(["reorder", "delete", "type"])("bloque %s avant toute écriture ou réassociation", async (operation) => {
    const before = structuredClone(store.rows); const form = await formForPublished(); const subs = JSON.parse(String(form.get("submodulesJson")));
    const questions = subs[0].exerciseGroups[0].questions;
    if (operation === "reorder") questions.reverse(); if (operation === "delete") questions.pop();
    if (operation === "type") { questions[0].type = "single"; questions[0].options = ["Oui", "Non"]; }
    form.set("submodulesJson", JSON.stringify(subs)); expect((await saveAdminModuleDraft(form)).status).toBe("error");
    expect(store.state.current_draft_release_id).toBeNull(); expect(store.writes).toEqual([]); expect(store.rows).toEqual(before);
  });
  it("permet de retirer une question uniquement dans le brouillon sans toucher aux réponses publiées", async () => {
    const form = await formForPublished(); const subs = JSON.parse(String(form.get("submodulesJson")));
    subs[0].exerciseGroups[0].questions.push({ clientId: "temporary", type: "open", question: "Question temporaire", options: [] });
    form.set("submodulesJson", JSON.stringify(subs)); const saved = await saveAdminModuleDraft(form);
    expect(saved.status).toBe("success");
    subs[0].exerciseGroups[0].questions.pop(); form.set("submodulesJson", JSON.stringify(subs)); form.set("expectedModuleUpdatedAt", saved.updatedAt!);
    expect((await saveAdminModuleDraft(form)).status).toBe("success");
    await expect(publishFinalVersionForAllUsers()).rejects.toThrow("status=published");
    const workspace = await getWorkspaceData(7);
    expect(workspace.modules[0].exercises).toHaveLength(2);
    expect(workspace.modules[0].answers[3]).toEqual(["Réponse A"]);
  });
  it("permet un nouveau sous-module final sans déplacer les questions existantes", async () => {
    const form = await formForPublished(); const subs = JSON.parse(String(form.get("submodulesJson")));
    subs.push({ clientId: "new-submodule", title: "Nouveau sous-module", contentHtml: "<p>Nouveau texte</p>", exerciseGroups: [
      { groupId: "new-group", questions: [{ clientId: "new-sub-question", type: "open", question: "Nouvelle question", options: [] }] },
    ] });
    form.set("submodulesJson", JSON.stringify(subs)); expect((await saveAdminModuleDraft(form)).status).toBe("success");
    expect((await getWorkspaceData(7)).modules[0].submodules).toHaveLength(1);
    await expect(publishFinalVersionForAllUsers()).rejects.toThrow("status=published");
    const workspace = await getWorkspaceData(7);
    expect(workspace.modules[0].submodules).toHaveLength(2);
    expect(workspace.modules[0].answers[3]).toEqual(["Réponse A"]);
  });
  it("rejette une sauvegarde depuis un onglet périmé", async () => {
    const stale = await formForPublished("C"); expect((await saveAdminModuleDraft(await formForPublished())).status).toBe("success");
    expect((await saveAdminModuleDraft(stale)).message).toContain("a changé"); expect((await getAdminWorkingModules(42))[0].title).toBe("Module B");
  });
  it("refuse un snapshot périmé et une publication sans brouillon", async () => {
    await expect(saveAdminReleaseModules(store.snapshots.v1.modules, "stale")).rejects.toThrow("a changé");
    await expect(publishFinalVersionForAllUsers()).rejects.toThrow("Aucun brouillon");
  });
  it("remonte l'échec de publication et conserve la version officielle", async () => {
    await saveAdminModuleDraft(await formForPublished()); store.publishError = "Publication impossible";
    await expect(publishFinalVersionForAllUsers()).rejects.toThrow("Publication impossible"); expect(store.state.published_release_id).toBe("v1");
    expect((await getWorkspaceData(7)).modules[0].title).toBe("Module A");
  });
  it.each(["missing", "malformed", "schema", "identity", "unknown_type"])("ne lit jamais les tables historiques si le snapshot est %s", async (failure) => {
    if (failure === "missing") delete store.snapshots.v1; if (failure === "malformed") store.snapshots.v1.modules = [{}]; if (failure === "schema") store.snapshots.v1.schema_version = 99;
    if (failure === "identity") store.snapshots.v1.modules = [{ title: "Sans identité", position: 1, submodules: [] }];
    if (failure === "unknown_type") {
      const moduleItem = store.snapshots.v1.modules[0] as { submodules: Array<{ exercises: Array<{ type: string }> }> };
      moduleItem.submodules[0].exercises[0].type = "unknown";
    }
    await expect(getWorkspaceData(7)).rejects.toThrow(); expect(store.reads).not.toContain("brand_modules");
  });
  it("désactive explicitement la publication historique destructive", async () => {
    await expect(publishAdminModuleDraft(42)).rejects.toThrow("historique désactivée"); expect(store.writes).toEqual([]);
  });
  it("préserve les IDs legacyId initiaux et leur progression sans migration", async () => {
    const modules = store.snapshots.v1.modules as Array<Record<string, unknown>>;
    const moveId = (entity: Record<string, unknown>) => { entity.legacyId = entity.id; delete entity.id; };
    moveId(modules[0]);
    const submodules = modules[0].submodules as Array<Record<string, unknown>>;
    moveId(submodules[0]);
    for (const exercise of submodules[0].exercises as Array<Record<string, unknown>>) moveId(exercise);
    const workspace = await getWorkspaceData(7);
    expect(workspace.modules[0].id).toBe(1);
    expect(workspace.modules[0].answers[3]).toEqual(["Réponse A"]);
    expect(workspace.modules[0].progress.isCompleted).toBe(true);
    expect((await saveAdminModuleDraft(await formForPublished())).status).toBe("success");
  });
  it("conserve les réponses historiques par position sans les recopier ni les déplacer", async () => {
    store.rows.project_exercise_answers = [];
    store.rows.user_answers = [{ module_key: "module_position_1", question_key: "module_position_1_submodule_position_1_exercise_position_1", answer_value: ["Réponse stable"], client_updated_at: "2026-09-23T12:00:00Z", client_revision: 1 }];
    const before = structuredClone(store.rows);
    expect((await getWorkspaceData(7)).modules[0].answers[3]).toEqual(["Réponse stable"]);
    await saveAdminModuleDraft(await formForPublished());
    await expect(publishFinalVersionForAllUsers()).rejects.toThrow("status=published");
    expect((await getWorkspaceData(7)).modules[0].answers[3]).toEqual(["Réponse stable"]);
    expect(store.rows).toEqual(before);
  });
});
