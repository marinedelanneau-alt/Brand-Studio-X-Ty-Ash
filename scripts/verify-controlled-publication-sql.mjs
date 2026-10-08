// Run with: npm exec --yes --package=@electric-sql/pglite -- node scripts/verify-controlled-publication-sql.mjs
// PostgreSQL runs entirely in memory. No Supabase credentials or network database.
import assert from "node:assert/strict";
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

  const draftId = await scalar("select public.clone_content_release($1,'Brouillon B',false)", [initialId]);
  const token = await scalar("select updated_at::text from public.content_release_snapshots where release_id=$1", [draftId]);
  const changed = structuredClone(initialModules);
  changed[0].title = "Module B"; changed[0].submodules[0].contentHtml = "Texte B";
  changed[0].submodules[0].exercises[0].question = "Question B";
  changed[0].submodules[0].exercises[1].type = "table";
  changed[0].submodules[0].exercises[1].question = "Tableau";
  for (const entity of [changed[0], changed[0].submodules[0], ...changed[0].submodules[0].exercises]) entity.id = entity.legacyId;
  await db.query("select public.update_current_draft_snapshot_if_unchanged($1,$2,1,$3::jsonb)", [draftId, token, JSON.stringify(changed)]);
  assert.equal(await scalar("select published_release_id from public.application_release_state where id=1"), initialId);
  assert.deepEqual(await scalar("select modules from public.content_release_snapshots where release_id=$1", [initialId]), initialModules);
  await assert.rejects(db.query("select public.update_current_draft_snapshot_if_unchanged($1,$2,1,$3::jsonb)", [draftId, token, JSON.stringify(initialModules)]), /brouillon a changé/);
  await db.query("select public.mark_content_release_ready($1,'Test B')", [draftId]);
  await db.query("select public.publish_content_release($1,'Test B')", [draftId]);
  assert.equal(await scalar("select published_release_id from public.application_release_state where id=1"), draftId);
  assert.equal(await scalar("select current_draft_release_id from public.application_release_state where id=1"), null);
  assert.equal(await scalar("select status from public.content_releases where id=$1", [initialId]), "archived");
  assert.deepEqual(await scalar("select modules from public.content_release_snapshots where release_id=$1", [draftId]), changed);
  assert.equal(await scalar("select count(*)::integer from public.admin_audit_logs where action_type='release_published'"), 1);
  assert.deepEqual(await userInventory(), before);
  console.log("PASS: actual SQL draft A/B, stale save refusal, atomic publication, pointer, archive, audit and unchanged user fixtures.");

  for (const operation of ["reorder", "delete", "type", "id"]) {
    const badDraft = await scalar("select public.clone_content_release($1,'Unsafe draft',true)", [draftId]);
    const badToken = await scalar("select updated_at::text from public.content_release_snapshots where release_id=$1", [badDraft]);
    const bad = structuredClone(changed); const questions = bad[0].submodules[0].exercises;
    if (operation === "reorder") { questions[0].position = 2; questions[1].position = 1; }
    if (operation === "delete") questions.pop();
    if (operation === "type") questions[0].type = "single";
    if (operation === "id") questions[0].id = 999;
    await db.query("select public.update_current_draft_snapshot_if_unchanged($1,$2,1,$3::jsonb)", [badDraft, badToken, JSON.stringify(bad)]);
    await db.query("select public.mark_content_release_ready($1,'Unsafe test')", [badDraft]);
    await assert.rejects(db.query("select public.publish_content_release($1,'Unsafe test')", [badDraft]), /publication bloquée/);
    assert.equal(await scalar("select published_release_id from public.application_release_state where id=1"), draftId);
    assert.equal(await scalar("select status from public.content_releases where id=$1", [draftId]), "published");
    assert.deepEqual(await userInventory(), before);
    console.log(`PASS: ${operation} rejected by database guard; previous publication and user fixtures intact.`);
  }
  const addedDraft = await scalar("select public.clone_content_release($1,'Safe addition',true)", [draftId]);
  const addedToken = await scalar("select updated_at::text from public.content_release_snapshots where release_id=$1", [addedDraft]);
  const added = structuredClone(changed);
  added[0].submodules[0].exercises.push({ stableKey: "exercise_new", id: -1, position: 3, type: "open", question: "Nouvelle question", options: [] });
  await db.query("select public.update_current_draft_snapshot_if_unchanged($1,$2,1,$3::jsonb)", [addedDraft, addedToken, JSON.stringify(added)]);
  await db.query("select public.mark_content_release_ready($1,'Safe addition')", [addedDraft]);
  await db.query("select public.publish_content_release($1,'Safe addition')", [addedDraft]);
  assert.equal(await scalar("select published_release_id from public.application_release_state where id=1"), addedDraft);
  assert.deepEqual(await userInventory(), before);
  console.log("PASS: trailing question addition with legacyId/id continuity, existing answer slots and user fixtures preserved.");
} finally {
  await db.close();
}
