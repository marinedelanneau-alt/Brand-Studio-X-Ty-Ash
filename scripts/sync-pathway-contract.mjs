import { readFileSync, writeFileSync } from "node:fs";
const schema = JSON.parse(readFileSync(new URL("../lib/pathway-snapshot.schema.json", import.meta.url), "utf8"));
const path = new URL("../supabase/migrations/20261016120000_independent_pathway_versions.sql", import.meta.url);
const source = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const start = "-- BEGIN SHARED PATHWAY CONTRACT";
const end = "-- END SHARED PATHWAY CONTRACT";
const block = `${start} (generated; see scripts/sync-pathway-contract.mjs)
create or replace function public.independent_pathway_contract()
returns jsonb language sql immutable set search_path = public as $contract$
  select $schema$${JSON.stringify(schema)}$schema$::jsonb;
$contract$;
revoke all on function public.independent_pathway_contract() from public,anon,authenticated;
${end}`;
const result = source.slice(0, source.indexOf(start)) + block + source.slice(source.indexOf(end) + end.length);
if (process.argv.includes("--check")) {
  if (source !== result) throw new Error("SQL pathway contract differs from canonical schema");
} else writeFileSync(path, result);
