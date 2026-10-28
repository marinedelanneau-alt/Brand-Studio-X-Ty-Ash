import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/app/admin/modules/actions", () => ({ saveAdminModule: vi.fn(), saveAdminModuleDraft: vi.fn(), deleteAdminModule: vi.fn(), createAdminVoiceNoteUpload: vi.fn(), persistAdminVoiceNoteUrl: vi.fn() }));
import AdminModuleEditor from "../app/ui/admin-module-editor";
it("opens the admin editor when a snapshot submodule has no video", () => {
  // Release snapshots allow null for optional video URLs.
  const modules = [{
    id: 1, title: "Module sans vidéo", position: 1, is_published: true,
    video_url: null, audio_url: null, audio_transcript: null, content_html: "",
    exercises: [],
    submodules: [{
      id: 2, module_id: 1, title: "Introduction", position: 1,
      video_url: null, audio_url: null, audio_transcript: null,
      content_html: "<p>Introduction</p>", exercises: [],
    }],
  }] as unknown as ComponentProps<typeof AdminModuleEditor>["modules"];
  expect(renderToStaticMarkup(createElement(AdminModuleEditor, { modules })))
    .toContain("Module sans vidéo");
});
