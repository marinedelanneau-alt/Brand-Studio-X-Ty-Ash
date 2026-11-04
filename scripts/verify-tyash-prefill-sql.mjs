// Entirely in-memory PostgreSQL. No remote database or credentials.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, delimiter } from "node:path";
const require = createRequire(import.meta.url);
const paths = [process.cwd(), ...(process.env.PATH ?? "").split(delimiter).map(dirname)];
const { PGlite } = require(require.resolve("@electric-sql/pglite", { paths }));
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create table public.brand_projects(id bigint primary key, account_id bigint);
    create table public.client_access_codes(id bigint primary key, role text);
    create table public.user_answers(project_id bigint, question_key text, answer_value jsonb);
    insert into brand_projects values(1,10),(2,20);
    insert into client_access_codes values(10,'admin'),(20,'user');
    insert into user_answers values(1,'tyash_v1_q','["Client correction"]');`);
  const migration = readFileSync(new URL("../supabase/migrations/20261104150000_tyash_questionnaire_prefills.sql", import.meta.url), "utf8");
  await db.exec(migration);
  await db.exec(migration);
  await db.exec(`set role service_role; insert into tyash_questionnaire_prefills(project_id,module_key,question_key,values,updated_by) values(1,'tyash_v1_m','tyash_v1_q','["Admin baseline"]',10); reset role;`);
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query("select * from tyash_questionnaire_prefills"), /permission denied/);
    await assert.rejects(db.query("update tyash_questionnaire_prefills set values='[]'"), /permission denied/);
    await db.exec("reset role");
  }
  assert.deepEqual((await db.query("select answer_value from user_answers")).rows[0].answer_value, ["Client correction"]);
  assert.equal((await db.query("select count(*)::int as n from client_access_codes where role='admin'")).rows[0].n, 1);
  assert.equal((await db.query("select relrowsecurity from pg_class where relname='tyash_questionnaire_prefills'")).rows[0].relrowsecurity, true);
  console.log("PASS: additive/idempotent migration, RLS enabled, anon/authenticated denied, service allowed, answers and roles unchanged.");
} finally { await db.close(); }
