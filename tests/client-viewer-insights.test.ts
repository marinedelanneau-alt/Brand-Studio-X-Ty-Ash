import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("@/lib/session", () => ({ getAuthenticatedClientReader: async () => ({ role: "user", can_view_clients: true, is_admin: false }) }));
vi.mock("@/lib/content-releases", () => ({
  isControlledProductionContentEnabled: () => true,
  getApplicationReleaseState: async () => ({ published_release_id: "published" }),
  getContentReleaseSnapshot: async () => ({ modules: [{ id: 1, stableKey: "tyash_v1_module", title: "Module", position: 1,
    submodules: [{ id: 2, stableKey: "tyash_v1_sub", title: "Submodule", position: 1, content_html: "", exercises: [{
      id: 3, stableKey: "tyash_v1_question", position: 1, type: "open", question: "Question?", options: [],
    }] }],
  }] }),
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ from: (table: string) => {
  const data = table === "client_access_codes" ? [
    { id: 1, email: "client@example.test", client_name: "Client", created_at: "2026-01-01", role: "user", is_admin: false, code: "must never be exposed" },
    { id: 2, email: "viewer@example.test", role: "admin", is_admin: true },
  ] : table === "brand_projects" ? [{ id: 10, account_id: 1, name: "Company", updated_at: "2026-02-01" }]
    : table === "user_answers" ? [{ user_id: 1, project_id: 10, module_key: "tyash_v1_module", question_key: "tyash_v1_question", answer_value: ["Answer"], updated_at: "2026-03-01", client_updated_at: "2026-03-01" }] : [];
  const query = { select: () => query, eq: () => query, order: () => query, then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data, error: null }).then(resolve) };
  return query;
} }) }));
import { getAdminUsers } from "../lib/admin-user-insights";

describe("viewer reads existing insight DTOs", () => {
  it("returns clients, progress, answers and last activity without access codes or staff accounts", async () => {
    const users = await getAdminUsers();
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe("Client");
    expect(users[0].email).toBe("client@example.test");
    expect(users[0].progress).toBe(100);
    expect(users[0].moduleProgress[0].progress).toBe(100);
    expect(users[0].answers[0].values).toEqual(["Answer"]);
    expect(users[0].lastActivityAt).toBe("2026-03-01");
    expect(JSON.stringify(users)).not.toContain("must never be exposed");
  });
});
