import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => "/admin" }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: ReactNode }) => createElement("a", { href }, children) }));
vi.mock("../app/ui/logout-button", () => ({ default: () => createElement("button", null, "Logout") }));
import AdminShell from "../app/ui/admin-shell";

describe("viewer navigation", () => {
  it("renders only the users section for a viewer", () => {
    const html = renderToStaticMarkup(createElement(AdminShell, { adminName: "Julien", adminEmail: "viewer@example.test", readOnly: true, showLegal: true, children: "Users" }));
    expect(html).toContain('href="/admin/clients"');
    for (const path of ["/admin/modules", "/admin/releases", "/admin/legal"]) expect(html).not.toContain(`href="${path}"`);
    expect(html).toContain("Session en lecture seule");
    expect(html).toContain('href="/mon-espace"');
  });
  it("preserves the full Admin navigation", () => {
    const html = renderToStaticMarkup(createElement(AdminShell, { adminName: "Marine", adminEmail: "admin@example.test", showLegal: true, children: "Users" }));
    for (const path of ["/admin/modules", "/admin/releases", "/admin/legal", "/mon-espace"]) expect(html).toContain(`href="${path}"`);
  });
});
