import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const baseline = JSON.parse(
  await readFile(new URL("../docs/production-baseline.json", import.meta.url), "utf8"),
);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables Supabase manquantes.");
}
if (new URL(supabaseUrl).hostname.split(".")[0] !== baseline.supabaseRef) {
  throw new Error("La base configurée ne correspond pas à la baseline.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const report = { content: {}, answerInventory: {}, production: {} };
let failed = false;

for (const [table, expected] of Object.entries(baseline.contentTables)) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(`${table}: ${error.message}`);
  const sorted = data.sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right)),
  );
  const sha256 = createHash("sha256")
    .update(JSON.stringify(sorted))
    .digest("hex");
  const identical = data.length === expected.rows && sha256 === expected.sha256;
  report.content[table] = { rows: data.length, sha256, identical };
  failed ||= !identical;
}

for (const table of Object.keys(baseline.answerInventoryAtCapture)) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  report.answerInventory[table] = {
    captured: baseline.answerInventoryAtCapture[table],
    current: count,
    note: "Inventaire informatif : les bêta-testeurs peuvent continuer à enregistrer des réponses.",
  };
}

const response = await fetch(baseline.productionUrl, { redirect: "follow" });
report.production = {
  url: baseline.productionUrl,
  status: response.status,
  reachable: response.ok,
  expectedDeploymentId: baseline.vercelDeploymentId,
  expectedGitCommit: baseline.gitCommit,
};
failed ||= !response.ok;

console.log(JSON.stringify(report, null, 2));
if (failed) process.exitCode = 1;
