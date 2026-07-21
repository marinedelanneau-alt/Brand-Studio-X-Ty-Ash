import { describe, expect, it } from "vitest";
import { getModuleHref, resolveWorkspaceModule } from "../lib/module-routing";
import type { WorkspaceModule } from "../lib/training-types";

const modules = [
  { id: 41, position: 1, title: "Fondations" },
  { id: 52, position: 2, title: "Positionnement" },
] as WorkspaceModule[];

describe("stable module routing", () => {
  it("generates a URL based on the stable position", () => {
    expect(getModuleHref(modules[1])).toBe("/mon-espace/module/position-2");
  });

  it("resolves stable position URLs after IDs have changed", () => {
    expect(resolveWorkspaceModule(modules, "position-2")?.id).toBe(52);
  });

  it("keeps current numeric ID URLs compatible", () => {
    expect(resolveWorkspaceModule(modules, "52")?.position).toBe(2);
  });

  it("recovers old numeric URLs by module position", () => {
    expect(resolveWorkspaceModule(modules, "2")?.id).toBe(52);
  });
});
