// One-time editorial maintenance. Never imported by the application runtime.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { informalTyashEditorialCopy } from "../lib/client-copy";
import mapping from "../content/tyash-refonte/question-map.json";
import { assertReleaseAnswerCompatibility } from "../lib/release-content-validation";
import { validateIndependentAdminModules } from "../lib/pathway-snapshot-validation";
import { activeQuestionnaire, prefillQuestions } from "../lib/questionnaire-admin";
import type { WorkspaceModule } from "../lib/training-types";

async function main() {
const env = Object.fromEntries(fs.readFileSync(".env.production.local", "utf8").split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/); return match ? [[match[1], match[2].trim().replace(/^['"]|['"]$/g, "")]] : [];
}));
if (env.NEXT_PUBLIC_SUPABASE_URL !== "https://cplzwnlstcpqqzqeawgs.supabase.co") throw new Error("Wrong target");
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: state, error } = await db.from("application_release_state").select("*").eq("id", 1).single();
if (error || state.current_draft_release_id !== "b2def4de-b85b-495d-8c02-4b11ae3c0b8b") throw new Error("Unexpected draft");
const { data: snapshot, error: snapshotError } = await db.from("content_release_snapshots").select("*").eq("release_id", state.current_draft_release_id).single();
if (snapshotError) throw new Error("Snapshot unavailable");
fs.writeFileSync(".supabase-backups/tyash-before-admin-materialization-2026-11-04.json", JSON.stringify({ state, snapshot }, null, 2));
const modules = structuredClone(snapshot.modules) as WorkspaceModule[];
for (const m of modules) for (const s of m.submodules) {
  delete s.editorialIntroduction;
  for (const e of s.exercises) {
    const rule = e.tyashQuestionnaire;
    if (!rule) throw new Error("Missing audited metadata");
    e.answerModuleStableKey ??= m.stableKey;
    e.answerSubmoduleStableKey ??= s.stableKey;
    if (rule.status === "active") e.options = e.options.map(o => {
      if (o.startsWith("__")) return o;
      const label = informalTyashEditorialCopy(o);
      if (label !== o) rule.optionAliases = { ...rule.optionAliases, [o]: label };
      return label;
    });
    const reference = mapping.entries.find(q => q.stableKey === e.stableKey);
    if (reference?.templateId === 1082) e.options = e.options.filter(o => !["Voix off", "Interviews"].includes(o));
  }
}
for (const m of modules) for (const s of m.submodules) for (const e of [...s.exercises]) {
  const rule = e.tyashQuestionnaire!;
  if (!rule.displayModuleKey) continue;
  const targetModule = modules.find(m => m.stableKey === rule.displayModuleKey)!;
  const target = targetModule?.submodules.find(s => s.stableKey === rule.displaySubmoduleKey);
  if (!target) throw new Error("Unknown destination");
  s.exercises = s.exercises.filter(q => q.id !== e.id);
  target.exercises.push({ ...e, module_id: targetModule.id, submodule_id: target.id });
  delete rule.displayModuleKey;
  delete rule.displaySubmoduleKey;
}
for (const m of modules) {
  m.editorRevision = crypto.randomUUID();
  let position = 1;
  for (const [i, s] of m.submodules.entries()) {
    s.position = i + 1;
    s.archived = !s.exercises.some(e => e.tyashQuestionnaire?.status === "active");
    s.exercises.sort((a, b) => Number(a.tyashQuestionnaire?.status !== "active") - Number(b.tyashQuestionnaire?.status !== "active"));
    s.exercises.forEach(e => { e.position = position++; });
  }
  m.exercises = m.submodules.flatMap(s => s.exercises);
}
validateIndependentAdminModules(modules);
assertReleaseAnswerCompatibility(snapshot.modules, modules);
const visible = activeQuestionnaire(modules);
if (visible.flatMap(m => m.exercises).length !== 54 || prefillQuestions(modules).length !== 6) throw new Error("Unexpected editorial counts");
const json = (value: unknown, tag: string) => { const text = JSON.stringify(value); if (text.includes(`$${tag}$`)) throw new Error("Delimiter collision"); return `$${tag}$${text}$${tag}$::jsonb`; };
const sql = `begin;
set local lock_timeout='5s';
set local statement_timeout='45s';
do $maintenance$
declare before_snapshot public.content_release_snapshots%rowtype; protected_before text;
begin
  perform 1 from public.application_release_state where id=1 for update;
  if not exists (select 1 from public.application_release_state where id=1 and current_draft_release_id='${state.current_draft_release_id}' and published_release_id='${state.published_release_id}') then raise exception 'Release pointers changed'; end if;
  select * into before_snapshot from public.content_release_snapshots where release_id='${state.current_draft_release_id}' for update;
  if to_jsonb(before_snapshot) is distinct from ${json(snapshot, "expected")} then raise exception 'Concurrent Admin edit; refusing overwrite'; end if;
  select md5(jsonb_build_array((select jsonb_agg(to_jsonb(t) order by id) from public.user_answers t),(select jsonb_agg(to_jsonb(t) order by id) from public.client_access_codes t),(select jsonb_agg(to_jsonb(t) order by id) from public.brand_projects t),(select to_jsonb(t) from public.content_release_snapshots t where release_id='${state.published_release_id}'))::text) into protected_before;
  update public.content_release_snapshots set modules=${json(modules, "next")}, updated_at=now(), updated_by=null where release_id='${state.current_draft_release_id}';
  insert into public.admin_audit_logs(admin_user_id,action_type,entity_type,entity_id,release_id,metadata) values(null,'draft_updated','content_release','${state.current_draft_release_id}','${state.current_draft_release_id}',jsonb_build_object('mechanism','authorized_supabase_management_maintenance','database_actor',current_user,'published',false,'physical_question_moves',true,'admin_is_source_of_truth',true));
  if protected_before is distinct from (select md5(jsonb_build_array((select jsonb_agg(to_jsonb(t) order by id) from public.user_answers t),(select jsonb_agg(to_jsonb(t) order by id) from public.client_access_codes t),(select jsonb_agg(to_jsonb(t) order by id) from public.brand_projects t),(select to_jsonb(t) from public.content_release_snapshots t where release_id='${state.published_release_id}'))::text)) then raise exception 'Protected data changed'; end if;
end;
$maintenance$;
commit;
select jsonb_build_object('draft_updated',true,'published',false) as result;
`;
fs.writeFileSync(".runtime/questionnaire-refonte/materialize-admin.sql", sql);
fs.writeFileSync(".runtime/questionnaire-refonte/materialized.json", JSON.stringify({ modules }, null, 2));
console.log(JSON.stringify({ prepared: true, activeModules: visible.length, activeSubmodules: visible.map(m => m.submodules.length), activeQuestions: visible.map(m => m.exercises.length), prefills: prefillQuestions(modules).length, publishes: false }));

}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
