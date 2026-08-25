import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const serverClient = readFileSync(new URL("../lib/supabase/server.ts", import.meta.url), "utf8");
const session = readFileSync(new URL("../lib/session.ts", import.meta.url), "utf8");

describe("Supabase outage handling", () => {
  it("caps server-side Supabase requests instead of leaving a blank page", () => {
    expect(serverClient).toContain("SUPABASE_REQUEST_TIMEOUT_MS = 8_000");
    expect(serverClient).toContain("AbortSignal.timeout");
  });

  it("does not silently convert an Auth outage into a logged-out session", () => {
    expect(session).toContain("throw authError");
    expect(session).not.toMatch(/catch\s*\{\s*userId = null/);
  });
});
