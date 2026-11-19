// Explicit operator action, scoped to the verified Julien identity on Ty Ash.
// Dry-run by default. Never sends an email or modifies another account.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const email = "jsene@ty-ash.com";
const envFile = process.argv.find(value => value.startsWith("--env-file="))?.slice("--env-file=".length) ?? ".env.local";
const envText = await readFile(envFile, "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).flatMap(line => {
  const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  return match ? [[match[1], match[2].trim().replace(/^['"]|['"]$/g, "")]] : [];
}));
if (env.NEXT_PUBLIC_SUPABASE_URL !== "https://cplzwnlstcpqqzqeawgs.supabase.co" || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Verified Ty Ash project and server credentials required");
}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: account, error } = await db.from("client_access_codes")
  .select("id,email,auth_user_id,role,is_admin,is_active,can_view_clients,complimentary_access")
  .ilike("email", email).single();
if (error || !account?.auth_user_id) throw new Error("Julien's linked account could not be verified");
const { data: identity, error: identityError } = await db.auth.admin.getUserById(account.auth_user_id);
if (identityError || identity.user?.email?.toLowerCase() !== email || !["user", "admin"].includes(account.role)) {
  throw new Error("Julien's Auth identity or current role could not be verified");
}
const before = { id: account.id, email, role: account.role, is_admin: account.is_admin, is_active: account.is_active,
  can_view_clients: account.can_view_clients, complimentary_access: account.complimentary_access };
if (!process.argv.includes("--apply")) {
  console.log(JSON.stringify({ mode: "dry-run", authVerified: true, before, requested: { role: "admin", is_admin: true, can_view_clients: true } }));
} else {
  await mkdir(".runtime", { recursive: true });
  await writeFile(".runtime/julien-admin-grant.json", JSON.stringify({ requestedAt: new Date().toISOString(), before }, null, 2));
  const { data: granted, error: grantError } = await db.from("client_access_codes")
    .update({ role: "admin", is_admin: true, is_active: true, can_view_clients: true, complimentary_access: true })
    .eq("id", account.id).ilike("email", email).eq("auth_user_id", account.auth_user_id)
    .eq("role", account.role).eq("is_admin", account.is_admin)
    .select("id,email,role,is_admin,is_active,can_view_clients,complimentary_access").single();
  if (grantError || !granted || granted.role !== "admin" || !granted.is_admin || !granted.can_view_clients) {
    throw new Error("Julien's Admin grant could not be confirmed");
  }
  console.log(JSON.stringify({ mode: "applied", account: granted }));
}
