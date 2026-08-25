import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText.split(/\r?\n/).flatMap((rawLine) => {
    const match = rawLine.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    return match
      ? [[match[1], match[2].trim().replace(/^['"]|['"]$/g, "")]]
      : [];
  }),
);

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Variables Supabase absentes.");
}

const client = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const tables = [
  "user_answers",
  "project_exercise_answers",
  "user_module_progress",
  "project_module_states",
];

const snapshot = { generated_at: new Date().toISOString(), tables: {} };
for (const table of tables) {
  console.log(`Snapshot: ${table}`);
  let result;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    result = await client
      .from(table)
      .select("*")
      .abortSignal(AbortSignal.timeout(15_000));
    if (!result.error) break;
    if (attempt === 3) throw new Error(`${table}: ${result.error.message}`);
  }
  snapshot.tables[table] = result.data ?? [];
}

const canonicalAnswers = JSON.stringify({
  project_exercise_answers: snapshot.tables.project_exercise_answers,
  user_answers: snapshot.tables.user_answers,
});
const answerHash = createHash("sha256").update(canonicalAnswers).digest("hex");
const directory = new URL("../.supabase-backups/", import.meta.url);
await mkdir(directory, { recursive: true });
const timestamp = new Date().toISOString().replaceAll(":", "-");
const target = new URL(`critical-user-data-${timestamp}.json`, directory);
await writeFile(target, JSON.stringify(snapshot), { mode: 0o600 });

console.log(JSON.stringify({
  backup: target.pathname,
  answerHash,
  legacyAnswerCount: snapshot.tables.project_exercise_answers.length,
  stableAnswerCount: snapshot.tables.user_answers.length,
}));
