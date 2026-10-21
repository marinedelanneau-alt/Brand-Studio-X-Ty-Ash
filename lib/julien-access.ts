import "server-only";
import { getAuthenticatedInvitationAdmin } from "./session";
import { createSupabaseServerClient } from "./supabase/server";

const EMAIL = "jsene@ty-ash.com";
// Only called by the explicit invitation action. No account data is accepted
// from the browser. No SQL RPC, Stripe row, answer or release is involved.
export async function grantJulienAccess(authUserId: string) {
  await getAuthenticatedInvitationAdmin();
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://cplzwnlstcpqqzqeawgs.supabase.co" || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Projet et clé serveur Ty Ash requis.");
  }
  const db = createSupabaseServerClient();
  const { data: identity, error: identityError } = await db.auth.admin.getUserById(authUserId);
  if (identityError || identity.user?.email?.toLowerCase() !== EMAIL) throw new Error("Identité Julien non vérifiée.");
  const lookup = () => db.from("client_access_codes").select("id,auth_user_id,role,is_admin")
    .ilike("email", EMAIL).maybeSingle();
  let current = await lookup();
  if (current.error) throw new Error("Vérification du compte applicatif impossible.");
  if (!current.data) {
    const { error } = await db.from("client_access_codes").insert({
      email: EMAIL, auth_user_id: authUserId, client_name: "Julien SENE", company_name: "Ty Ash",
      role: "user", is_admin: false, is_active: true, code: null,
      can_view_clients: true, complimentary_access: true,
    });
    // An email/auth_user_id uniqueness conflict may be a concurrent invitation.
    if (error && error.code !== "23505") throw new Error("Création du profil applicatif impossible.");
    current = await lookup();
    if (current.error || !current.data) throw new Error("Rattachement du profil applicatif impossible.");
  }
  const account = current.data;
  if (!account || account.is_admin || account.role !== "user" || (account.auth_user_id && account.auth_user_id !== authUserId)) {
    throw new Error("Compte existant incompatible : aucune élévation automatique.");
  }
  // Compare identity/privileges again in the UPDATE to avoid overwriting a
  // concurrent role change. No user-provided account id can reach this update.
  let update = db.from("client_access_codes").update({
    auth_user_id: authUserId, is_active: true, code: null,
    can_view_clients: true, complimentary_access: true,
  }).eq("id", account.id).ilike("email", EMAIL).eq("role", "user").eq("is_admin", false);
  update = account.auth_user_id ? update.eq("auth_user_id", authUserId) : update.is("auth_user_id", null);
  const { data: granted, error: grantError } = await update.select("id").maybeSingle();
  if (grantError || !granted) throw new Error("Attribution de l’accès impossible.");
  // Preserve any existing profile fields. A retry cannot create a duplicate id.
  const { error: profileError } = await db.from("profiles").upsert({
    id: authUserId, email: EMAIL, full_name: "Julien SENE", brand_name: "Ty Ash",
  }, { onConflict: "id", ignoreDuplicates: true });
  if (profileError) throw new Error("Création du profil impossible. Aucun email envoyé.");
}
