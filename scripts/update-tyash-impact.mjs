// node --env-file=.env.production.local scripts/update-tyash-impact.mjs
// Add --apply --publish --source-release=<UUID> after reviewing the dry run.
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { IMPACT_CONTENT, reviseImpactContent, assertOnlyImpactChanges, findImpactModule } from "./lib/tyash-impact-content.mjs";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const publish = args.has("--publish");
assert.ok(!publish || apply, "--publish requires --apply");
const expected = [...args].find(value => value.startsWith("--source-release="))?.split("=")[1];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname, "cplzwnlstcpqqzqeawgs.supabase.co", "TYASH project required");
assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY);
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
async function result(query) { const { data, error } = await query; if (error) throw new Error(error.message); return data; }
const state = () => result(db.from("application_release_state").select("*").eq("id", 1).single());
const snapshot = id => result(db.from("content_release_snapshots").select("*").eq("release_id", id).single());
const release = id => result(db.from("content_releases").select("id,status,version_number,pathway_root_id").eq("id", id).single());

// Hashes only: no client answers are written to the plan, logs or reports.
async function answerDigest() {
  const digests = {};
  for (const table of ["user_answers", "user_module_progress", "project_exercise_answers", "project_module_states", "tyash_questionnaire_prefills"]) {
    const hash = createHash("sha256");
    let count = 0;
    for (let offset = 0; ; offset += 500) {
      const query = db.from(table).select("*");
      const ordered = table === "tyash_questionnaire_prefills"
        ? query.order("project_id").order("question_key") : query.order("id");
      const rows = await result(ordered.range(offset, offset + 499));
      for (const row of rows) hash.update(JSON.stringify(row));
      count += rows.length;
      if (rows.length < 500) break;
    }
    digests[table] = { count, sha256: hash.digest("hex") };
  }
  return digests;
}

mkdirSync(".runtime/tyash-impact", { recursive: true });
const beforeState = await state();
assert.equal(beforeState.current_draft_release_id, null, "An Admin draft exists: preserve it and review the concurrent work");
if (apply) assert.equal(beforeState.published_release_id, expected, "Explicit source release mismatch");
const before = await snapshot(beforeState.published_release_id);
const beforeRelease = await release(before.release_id);
assert.equal(beforeRelease.status, "published");
const modules = reviseImpactContent(before.modules, randomUUID());
const plan = { source: beforeRelease, definitions: IMPACT_CONTENT,
  unchangedFollowingSubmodules: findImpactModule(before.modules).submodules.filter(s => s.id !== IMPACT_CONTENT.submodule.id).map(s => ({ id: s.id, key: s.stableKey, title: s.title })),
  beforeSnapshot: before, proposedModules: modules };
writeFileSync(".runtime/tyash-impact/plan.json", JSON.stringify(plan, null, 2));
console.log(JSON.stringify({ phase: "reviewed", sourceRelease: before.release_id, module: IMPACT_CONTENT.module, submodule: IMPACT_CONTENT.submodule, questions: IMPACT_CONTENT.questions, followingSubmodulesUnchanged: true }));
if (!apply) process.exit(0);

const cookies = new Map();
const auth = createServerClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  cookies: { getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
    setAll: values => values.forEach(({ name, value }) => cookies.set(name, value)) },
});
const actor = await result(db.from("client_access_codes").select("auth_user_id").eq("auth_user_id", beforeState.updated_by).eq("is_admin", true).eq("is_active", true).single());
const identity = await result(db.auth.admin.getUserById(actor.auth_user_id));
// Create a short-lived session for the existing authorized administrator. This
// generates no email and changes no password, role or application account.
const link = await result(db.auth.admin.generateLink({ type: "magiclink", email: identity.user.email }));
await result(auth.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "magiclink" }));
let draftId;
try {
  assert.deepEqual(await state(), beforeState, "Release changed since review");
  assert.deepEqual(await snapshot(before.release_id), before, "Source snapshot changed since review");
  const answerBefore = await answerDigest();
  draftId = await result(auth.rpc("clone_content_release", { source_release_id: before.release_id, draft_name: "L’impact recherché — module 3", replace_current_draft: false }));
  const draft = await snapshot(draftId);
  assert.deepEqual(draft.modules, before.modules);
  await result(auth.rpc("update_current_draft_snapshot_if_unchanged", {
    target_release_id: draftId, expected_updated_at: draft.updated_at, snapshot_schema_version: before.schema_version,
    snapshot_modules: modules, snapshot_brand_guide_settings: before.brand_guide_settings,
    snapshot_pdf_settings: before.pdf_settings, snapshot_interface_settings: before.interface_settings,
  }));
  const saved = await snapshot(draftId);
  assertOnlyImpactChanges(before.modules, saved.modules);
  for (const field of ["schema_version", "brand_guide_settings", "pdf_settings", "interface_settings"]) assert.deepEqual(saved[field], before[field]);
  const notes = "Module 3 : impact recherché, intitulé de l’étape et deux questions. Introduction alignée sur l’impact. Identifiants, réponses, autres sous-modules et design conservés.";
  if (publish) {
    const current = await state();
    assert.equal(current.published_release_id, before.release_id);
    assert.equal(current.current_draft_release_id, draftId);
    await result(auth.rpc("mark_content_release_ready", { target_release_id: draftId, release_notes: notes }));
    await result(auth.rpc("publish_content_release", { draft_release_id: draftId, release_notes: notes }));
    const afterState = await state();
    assert.equal(afterState.published_release_id, draftId);
    assert.equal(afterState.current_draft_release_id, null);
  }
  const finalSnapshot = await snapshot(draftId);
  assertOnlyImpactChanges(before.modules, finalSnapshot.modules);
  assert.deepEqual(await snapshot(before.release_id), before, "Historical snapshot must remain intact");
  const finalRelease = await release(draftId);
  assert.equal(finalRelease.pathway_root_id, beforeRelease.pathway_root_id);
  const answerAfter = await answerDigest();
  const answersUnchanged = JSON.stringify(answerBefore) === JSON.stringify(answerAfter);
  const report = { release: finalRelease, sourceRelease: beforeRelease, answersUnchanged,
    answerBefore, answerAfter, onlyImpactCopyChanged: true, followingSubmodulesUnchanged: true, settingsUnchanged: true };
  writeFileSync(".runtime/tyash-impact/after.json", JSON.stringify({ report, snapshot: finalSnapshot }, null, 2));
  console.log(JSON.stringify({ phase: publish ? "published" : "draft_saved", ...report }));
  assert.ok(answersUnchanged, "Answer data changed concurrently: inspect the digest report; never overwrite client work");

  if (publish) {
    const headers = { Cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join("; ") };
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
    assert.equal(new URL(origin).hostname, "brand-studio-x-ty-ash.vercel.app");
    for (const route of ["/mon-espace", "/mon-espace/module/position-3?mode=exercises&submodule=0&exercise=0"]) {
      const response = await fetch(origin + route, { headers, redirect: "manual" });
      assert.equal(response.status, 200, `Page unavailable: ${route}`);
      const html = await response.text();
      assert.ok(html.includes("IMPACT"), `Published impact label missing: ${route}`);
      console.log(JSON.stringify({ phase: "page_verified", route, status: response.status }));
    }
    const response = await fetch(origin + "/mon-espace/module/position-3/summary-pdf", { headers, redirect: "manual" });
    assert.equal(response.status, 200, "Published PDF unavailable");
    assert.ok(response.headers.get("content-type")?.includes("application/pdf"));
    writeFileSync(".runtime/tyash-impact/published-module.pdf", new Uint8Array(await response.arrayBuffer()));
    console.log(JSON.stringify({ phase: "published_pdf_downloaded", status: response.status }));
  }
} finally { await auth.auth.signOut({ scope: "local" }); }
