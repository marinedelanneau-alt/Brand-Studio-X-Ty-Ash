import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const envPath = process.argv[2] ? new URL(`../${process.argv[2].replaceAll("\\", "/")}`, import.meta.url) : new URL("../.env.local", import.meta.url);
const envText = await readFile(envPath, "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).flatMap((rawLine) => {
  const line = rawLine.trim();
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  return match ? [[match[1], match[2].trim().replace(/^['"]|['"]$/g, "")]] : [];
}));
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(`Variables Supabase absentes. Variables détectées : ${Object.keys(env).join(", ")}`);
}
const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const tables = [
  "client_access_codes", "brand_projects", "brand_modules", "brand_submodules",
  "module_exercises", "project_exercise_answers", "project_module_states",
  "brand_exports", "subscriptions", "purchase_activation_codes", "communication_actions",
];
const snapshot = { generated_at: new Date().toISOString(), tables: {} };
for (const table of tables) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from(table).select("*").range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  snapshot.tables[table] = rows;
}
const directory = new URL("../.supabase-backups/", import.meta.url);
await mkdir(directory, { recursive: true });
const target = new URL(`brand-studio-${new Date().toISOString().replaceAll(":", "-")}.json`, directory);
await writeFile(target, JSON.stringify(snapshot), { mode: 0o600 });
console.log(JSON.stringify({ backup: target.pathname, tables: Object.keys(snapshot.tables).length,
  rows: Object.values(snapshot.tables).reduce((total, rows) => total + rows.length, 0) }));
