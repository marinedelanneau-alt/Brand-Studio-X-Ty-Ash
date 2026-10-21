// Static audit only. Never executes SQL, loads env files or contacts Supabase.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sql = readFileSync(new URL("../supabase/migrations/20261017120000_client_viewer.sql", import.meta.url), "utf8");
const executable = sql.replace(/--[^\n]*/g, "").trim().replace(/\s+/g, " ");
assert.equal(executable, "BEGIN; ALTER TABLE public.client_access_codes ADD COLUMN IF NOT EXISTS can_view_clients boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS complimentary_access boolean NOT NULL DEFAULT false; COMMIT;");
console.log("PASS: complete SQL contains only transaction boundaries and two permission columns with DEFAULT false. No SQL executed.");
