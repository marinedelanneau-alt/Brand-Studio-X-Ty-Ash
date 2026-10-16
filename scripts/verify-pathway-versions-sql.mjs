// Run with: npm exec --yes --package=@electric-sql/pglite -- node scripts/verify-controlled-publication-sql.mjs
// PostgreSQL runs entirely in memory. No Supabase credentials or network database.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, delimiter } from "node:path";

const require = createRequire(import.meta.url);
const searchPaths = (process.env.PATH ?? "").split(delimiter).map(dirname);
const { PGlite } = require(require.resolve("@electric-sql/pglite", { paths: [process.cwd(), ...searchPaths] }));
const db = new PGlite();
const original = readFileSync(new URL("../supabase/migrations/20260728140000_controlled_content_releases.sql", import.meta.url), "utf8");
const cloneSql = readFileSync(new URL("../supabase/migrations/20260728171000_fix_clone_content_release.sql", import.meta.url), "utf8");
const guardSql = readFileSync(new URL("../supabase/migrations/20261008120000_guard_controlled_draft_saves.sql", import.meta.url), "utf8");
function extract(source, expression) {
  const match = source.match(expression);
  assert.ok(match, `Missing SQL: ${expression}`);
  return match[0];
}
function fn(name, source = original) {
  return extract(source, new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`));
}
async function scalar(sql, params = []) {
  return Object.values((await db.query(sql, params)).rows[0])[0];
}
const initialId = "11111111-1111-1111-1111-111111111111";
const initialModules = [{ stableKey: "module_1", legacyId: 1, title: "Module A", position: 1, submodules: [
  { stableKey: "submodule_2", legacyId: 2, title: "Sous-module A", position: 1, contentHtml: "Texte A", exercises: [
    { stableKey: "exercise_3", legacyId: 3, type: "open", position: 1, question: "Question A", options: [] },
    { stableKey: "exercise_4", legacyId: 4, type: "multiple", position: 2, question: "__table__:Tableau", options: ["__table_rows__:2", "__table_columns__:2"] },
  ] },
] }];
try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    insert into auth.users values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    create function auth.uid() returns uuid language sql as $$ select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid $$;
    create function public.is_admin(uuid) returns boolean language sql as $$ select true $$;
    create table public.admin_audit_logs(id uuid default gen_random_uuid(), admin_user_id uuid, action_type text,
      entity_type text, entity_id text, release_id uuid, metadata jsonb);
    create table public.fixture_user_answers(id integer primary key, answer text);
    create table public.fixture_progress(id integer primary key, completed boolean);
    create table public.fixture_projects(id integer primary key, name text);
    create table public.fixture_accounts(id integer primary key, name text);
    insert into public.fixture_user_answers values(1, 'Réponse existante');
    insert into public.fixture_progress values(1, true);
    insert into public.fixture_projects values(1, 'Projet existant');
    insert into public.fixture_accounts values(1, 'Compte existant');
  `);
  for (const name of ["content_releases", "content_release_snapshots", "application_release_state", "feature_configurations"]) {
    await db.exec(extract(original, new RegExp(`create table if not exists public\\.${name} \\([\\s\\S]*?\\n\\);`)));
  }
  await db.exec(extract(original, /create unique index if not exists content_releases_one_published_idx[\s\S]*?;/));
  for (const name of ["update_current_draft_snapshot", "mark_content_release_ready", "publish_content_release"]) await db.exec(fn(name));
  await db.exec(fn("clone_content_release", cloneSql));
  await db.exec(guardSql);
  for (const [prefix, expectedType] of [
    ["__group_open__:", "group_open"], ["__table_rows__:", "table"],
    ["__spectrum_config__:", "spectrum"], ["__typography_config__:", "typography"],
  ]) {
    assert.equal(await scalar("select public.content_release_exercise_type($1::jsonb)", [JSON.stringify({ type: "multiple", question: "Texte", options: [`${prefix}1`] })]), expectedType);
  }
  await db.query("insert into public.content_releases(id,name,status,published_at) values($1,'V1','published',now())", [initialId]);
  await db.query("insert into public.content_release_snapshots(release_id,modules) values($1,$2::jsonb)", [initialId, JSON.stringify(initialModules)]);
  await db.query("insert into public.application_release_state(id,published_release_id) values(1,$1)", [initialId]);
  const userInventory = async () => Promise.all(["fixture_user_answers", "fixture_progress", "fixture_projects", "fixture_accounts"].map(async (name) => (await db.query(`select * from public.${name}`)).rows));
  const before = await userInventory();

  await db.exec(`create table public.brand_modules(id bigint); create table public.brand_submodules(id bigint);
    create table public.module_exercises(id bigint); create table public.user_answers(module_key text,question_key text);`);
  const migration = readFileSync(new URL("../supabase/migrations/20261016120000_independent_pathway_versions.sql", import.meta.url), "utf8");
  const missingSchema = new PGlite();
  try {
    await assert.rejects(missingSchema.exec(migration),/Missing prerequisite table/);
    await missingSchema.exec("rollback");
    assert.equal(Object.values((await missingSchema.query("select to_regprocedure('public.inherit_pathway_root()')")).rows[0])[0],null);
  } finally { await missingSchema.close(); }
  await db.exec("alter table public.user_answers rename column module_key to missing_module_key");
  await assert.rejects(db.exec(migration),/Missing or incompatible column/);
  await db.exec("rollback");
  await db.exec("alter table public.user_answers rename column missing_module_key to module_key");
  // First pass repairs a missing publication trigger; second pass is idempotent.
  await db.exec("drop trigger controlled_release_publication_compatible on public.content_releases");
  await db.exec(migration);
  await db.exec(migration);
  assert.equal(await scalar("select count(*)::integer from pg_trigger where tgrelid='public.content_releases'::regclass and tgname='controlled_release_publication_compatible' and tgenabled='A'"),1);
  const legacyRevision = await scalar("select public.clone_content_release($1,'Legacy revision',false)", [initialId]);
  const unsafeLegacy = structuredClone(initialModules);
  unsafeLegacy[0].submodules[0].exercises.pop();
  const legacyToken = await scalar("select updated_at::text from public.content_release_snapshots where release_id=$1", [legacyRevision]);
  await db.query("select public.update_current_draft_snapshot_if_unchanged($1,$2,1,$3::jsonb)", [legacyRevision, legacyToken, JSON.stringify(unsafeLegacy)]);
  await db.query("select public.mark_content_release_ready($1,'unsafe legacy')", [legacyRevision]);
  await assert.rejects(db.query("select public.publish_content_release($1,'unsafe legacy')", [legacyRevision]), /incompatibles/);
  // Test fixture cleanup only, in the isolated in-memory database.
  await db.query("update public.application_release_state set current_draft_release_id=null where id=1");
  await db.query("update public.content_releases set status='archived' where id=$1", [legacyRevision]);
  const validationCases = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "scripts/emit-pathway-validation-fixtures.ts"], { encoding: "utf8", windowsHide: true }));
  const inventoryBeforeInvalid = await scalar("select count(*)::integer from public.content_releases");
  for (const fixture of validationCases) {
    if (fixture.valid) await db.query("select public.validate_independent_admin_modules($1::jsonb)", [JSON.stringify(fixture.modules)]);
    else {
      await assert.rejects(db.query("select public.create_independent_pathway_draft('Malformed',$1::jsonb,$2)", [JSON.stringify(fixture.modules),initialId]), undefined,fixture.name);
      assert.equal(await scalar("select count(*)::integer from public.content_releases"),inventoryBeforeInvalid);
      assert.equal(await scalar("select current_draft_release_id from public.application_release_state where id=1"),null);
      assert.equal(await scalar("select published_release_id from public.application_release_state where id=1"),initialId);
      assert.deepEqual(await userInventory(),before);
    }
  }
  console.log(`PASS: ${validationCases.length} shared TS/SQL validation fixtures; malformed RPC requests create no release.`);
  // Historical absence of numeric IDs must remain accepted, as in the old guard.
  const withoutNumeric = structuredClone(initialModules);
  delete withoutNumeric[0].legacyId;
  delete withoutNumeric[0].submodules[0].legacyId;
  for (const e of withoutNumeric[0].submodules[0].exercises) delete e.legacyId;
  await db.query("select public.assert_pathway_answer_slots($1::jsonb,$2::jsonb)", [JSON.stringify(withoutNumeric),JSON.stringify(initialModules)]);
  // A compatible classical revision still publishes through the real SQL RPC.
  const classic = await scalar("select public.clone_content_release($1,'Compatible classic',false)",[initialId]);
  await db.query("select public.mark_content_release_ready($1,'classic')",[classic]);
  await db.query("select public.publish_content_release($1,'classic')",[classic]);
  assert.deepEqual(await userInventory(),before);
  // Restore the original test pointer only in this isolated fixture, so the
  // independent-pathway tests keep asserting the same original release ID.
  await db.query("update public.content_releases set status='archived' where id=$1",[classic]);
  await db.query("update public.content_releases set status='published' where id=$1",[initialId]);
  await db.query("update public.application_release_state set published_release_id=$1 where id=1",[initialId]);
  const independent = [{id:-1, stableKey:"tyash_v1_new_module", title:"New", position:1, submodules:[{
    id:-2, module_id:-1, stableKey:"tyash_v1_new_submodule", title:"New", position:1, content_html:"", exercises:[
      {id:-3,module_id:-1,submodule_id:-2,stableKey:"tyash_v1_new_question",position:1,type:"open",question:"New?",options:[]}
    ]
  }]}];
  const draft = await scalar("select public.create_independent_pathway_draft('New pathway',$1::jsonb,$2)",[JSON.stringify(independent),initialId]);
  assert.equal(await scalar("select published_release_id from public.application_release_state where id=1"),initialId);
  assert.equal(await scalar("select current_draft_release_id from public.application_release_state where id=1"),draft);
  assert.deepEqual(await scalar("select modules from public.content_release_snapshots where release_id=$1",[initialId]),initialModules);
  assert.deepEqual(await userInventory(),before);
  const edited=structuredClone(independent); edited[0].title="Edited by admin";
  const token=await scalar("select updated_at::text from public.content_release_snapshots where release_id=$1",[draft]);
  await db.query("select public.update_current_draft_snapshot_if_unchanged($1,$2,1,$3::jsonb)",[draft,token,JSON.stringify(edited)]);
  assert.deepEqual(await scalar("select modules from public.content_release_snapshots where release_id=$1",[draft]),edited);
  const collision=structuredClone(edited);collision[0].id=1;
  await assert.rejects(db.query("update public.content_release_snapshots set modules=$1::jsonb where release_id=$2",[JSON.stringify(collision),draft]),/identit|admin structure/i);
  const keyCollision=structuredClone(edited);keyCollision[0].stableKey="module_1";
  await assert.rejects(db.query("update public.content_release_snapshots set modules=$1::jsonb where release_id=$2",[JSON.stringify(keyCollision),draft]),/identit|admin structure/i);
  await db.query("select public.mark_content_release_ready($1,'simulation')",[draft]);
  await db.query("select public.publish_content_release($1,'simulation')",[draft]);
  assert.equal(await scalar("select published_release_id from public.application_release_state where id=1"),draft);
  assert.equal(await scalar("select status from public.content_releases where id=$1",[initialId]),"archived");
  assert.deepEqual(await userInventory(),before);
  assert.deepEqual(await scalar("select modules from public.content_release_snapshots where release_id=$1",[initialId]),initialModules);
  const revision=await scalar("select public.clone_content_release($1,'Revision',false)",[draft]);
  assert.equal(await scalar("select pathway_root_id from public.content_releases where id=$1",[revision]),draft);
  const unsafe=structuredClone(edited);unsafe[0].submodules[0].exercises[0].type="single";
  await assert.rejects(db.query("update public.content_release_snapshots set modules=$1::jsonb where release_id=$2",[JSON.stringify(unsafe),revision]),/incompatibles/);
  await assert.rejects(db.query("update public.content_release_snapshots set modules=$1::jsonb where release_id=$2",[JSON.stringify(unsafe),draft]),/immutable/);
  const token2=await scalar("select updated_at::text from public.content_release_snapshots where release_id=$1",[revision]);
  await db.query("select public.update_current_draft_snapshot_if_unchanged($1,$2,1,$3::jsonb)",[revision,token2,JSON.stringify(edited)]);
  await db.query("select public.mark_content_release_ready($1,'revision')",[revision]);
  await db.query("select public.publish_content_release($1,'revision')",[revision]);
  assert.deepEqual(await userInventory(),before);
  console.log("PASS: independent draft, identities, admin save, unchanged official pointer/history/answers, simulated publication and clone inheritance; same-pathway unsafe changes rejected.");
} finally { await db.close(); }
