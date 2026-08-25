import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dataLayer = readFileSync(new URL("../lib/admin-user-insights.ts", import.meta.url), "utf8");
const exportRoute = readFileSync(new URL("../app/admin/users/[id]/export/route.ts", import.meta.url), "utf8");
const guidePage = readFileSync(new URL("../app/admin/users/[id]/guide/page.tsx", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20260825130000_admin_read_only_user_insights.sql", import.meta.url), "utf8");
const training = readFileSync(new URL("../lib/training.ts", import.meta.url), "utf8");

describe("read-only admin user insights", () => {
  it("contains no answer write operation in the Admin data paths", () => {
    for (const source of [dataLayer, exportRoute, guidePage]) {
      expect(source).not.toMatch(/\.(?:insert|update|upsert|delete|rpc)\s*\(/);
    }
  });

  it("grants Admin SELECT policies only", () => {
    expect(migration).toMatch(/for select/gi);
    expect(migration).not.toMatch(/for\s+(?:all|insert|update|delete)/i);
    expect(migration).not.toMatch(/\b(?:insert|update|delete|truncate)\s+(?:into|from)?\s*public\./i);
  });

  it("does not delete empty legacy answers during a partial save", () => {
    const replaceFunction = training.match(/export async function replaceModuleAnswers[\s\S]*?export async function setProjectModuleCompletion/)?.[0] ?? "";
    expect(replaceFunction).not.toContain(".delete()");
    expect(replaceFunction).toContain("Missing or empty values are deliberately ignored");
  });
});
