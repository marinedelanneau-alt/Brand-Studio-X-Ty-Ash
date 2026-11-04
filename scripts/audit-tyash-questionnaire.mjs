// Read-only audit. Never publishes, updates a release or writes client data.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envFile = process.argv[2] ?? ".env.production.local";
const env = Object.fromEntries(fs.readFileSync(envFile, "utf8").split(/\r?\n/).flatMap(line => {
  const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  return match ? [[match[1], match[2].trim().replace(/^['"]|['"]$/g, "")]] : [];
}));
if (new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname !== "cplzwnlstcpqqzqeawgs.supabase.co") throw new Error("La cible n’est pas le projet Supabase TYASH autorisé.");
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: state, error } = await db.from("application_release_state").select("*").eq("id", 1).single();
if (error) throw new Error("Impossible de lire le pointeur officiel TYASH.");
const { data: snapshot, error: snapshotError } = await db.from("content_release_snapshots").select("*").eq("release_id", state.published_release_id).single();
if (snapshotError) throw new Error("Impossible de lire le snapshot officiel TYASH.");
const seed = JSON.parse(fs.readFileSync("content/tyash-v1/pathway.json", "utf8"));
const entries = [];
for (const [mi, module] of snapshot.modules.entries()) {
  if (!module.stableKey?.startsWith("tyash_v1_") || module.submodules.length !== seed[mi]?.submodules.length) throw new Error("Structure inattendue : correspondance manuelle nécessaire.");
  for (const [si, submodule] of module.submodules.entries()) {
    const template = seed[mi].submodules[si];
    if (submodule.exercises.length !== template.exercises.length) throw new Error("Nombre de questions différent du modèle : audit manuel nécessaire.");
    for (const [ei, exercise] of submodule.exercises.entries()) entries.push({ templateId: template.exercises[ei].id, id: exercise.id, stableKey: exercise.stableKey, moduleId: module.id, submoduleId: submodule.id, moduleKey: module.stableKey, submoduleKey: submodule.stableKey, module: mi + 1, submodule: si + 1, type: exercise.type, question: exercise.question, referenceQuestion: template.exercises[ei].question });
  }
}
fs.mkdirSync(".runtime/questionnaire-refonte", { recursive: true });
fs.writeFileSync(".runtime/questionnaire-refonte/source.json", JSON.stringify(snapshot, null, 2), { mode: 0o600 });
fs.mkdirSync("content/tyash-refonte", { recursive: true });
fs.writeFileSync("content/tyash-refonte/question-map.json", JSON.stringify({ sourceReleaseId: snapshot.release_id, sourceUpdatedAt: snapshot.updated_at, entries }, null, 2) + "\n");
console.log(JSON.stringify({ questions: entries.length, publishedReleaseId: snapshot.release_id, currentDraftReleaseId: state.current_draft_release_id, readOnly: true }));
