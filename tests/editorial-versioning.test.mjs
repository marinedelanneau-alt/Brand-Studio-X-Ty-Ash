import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../supabase/migrations/20260720190000_editorial_versioning.sql", import.meta.url), "utf8");
const training = readFileSync(new URL("../lib/training.ts", import.meta.url), "utf8");
const conflictProtectionSql = readFileSync(
  new URL("../supabase/migrations/20260721160000_answer_conflict_protection.sql", import.meta.url),
  "utf8",
);

test("les réponses stables ne dépendent pas des versions", () => {
  const table = sql.match(/create table if not exists public\.user_answers \([\s\S]*?\n\);/)?.[0] ?? "";
  assert.match(table, /question_key text not null/);
  assert.doesNotMatch(table, /references public\.question_versions\(id\) on delete cascade/);
  assert.match(table, /unique \(user_id, project_id, question_key, field_key\)/);
});

test("une seule version publiée est autorisée", () => {
  assert.match(sql, /module_versions_one_published_idx[\s\S]*status = 'published'/);
});

test("la publication archive puis publie dans la même fonction SQL", () => {
  const fn = sql.match(/create or replace function public\.publish_module_version[\s\S]*?\$\$;/)?.[0] ?? "";
  assert.match(fn, /status = 'archived'/);
  assert.match(fn, /status = 'published'/);
  assert.match(fn, /admin role required/);
});

test("restaurer crée un nouveau brouillon", () => {
  const fn = sql.match(/create or replace function public\.create_module_draft[\s\S]*?\$\$;/)?.[0] ?? "";
  assert.match(fn, /based_on_version_id/);
  assert.match(fn, /'draft'/);
  assert.doesNotMatch(fn, /delete from public\.user_answers/);
});

test("aucune action éditoriale ne supprime les réponses", () => {
  assert.doesNotMatch(sql, /delete\s+from\s+public\.user_answers/i);
  assert.doesNotMatch(sql, /drop\s+table\s+(if exists\s+)?public\.project_exercise_answers/i);
});

test("les questions admin conservent leur identité lors d'un déplacement ou ajout", () => {
  assert.match(training, /requestedExerciseId = Number\(question\.clientId\)/);
  assert.match(training, /existingExercises\.find\(\(item\) => item\.id === requestedExerciseId\)/);
  assert.match(training, /clientId: String\(exercise\.id\)/);
});

test("une sauvegarde ancienne ne peut pas écraser une réponse plus récente", () => {
  assert.match(conflictProtectionSql, /client_updated_at timestamptz not null/);
  assert.match(conflictProtectionSql, /upsert_user_answers_if_newer/);
  assert.match(
    conflictProtectionSql,
    /user_answers\.client_updated_at <= excluded\.client_updated_at/,
  );
});
