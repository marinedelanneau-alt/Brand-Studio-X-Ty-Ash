"use server";

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { fingerprint } from "@/lib/annual-guest-security";

export async function initializeAnnualPassword(_state: { error: string }, form: FormData): Promise<{ error: string }> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password.length < 8 || password.length > 128 || password !== form.get("confirmation")) return { error: "Saisissez deux mots de passe identiques de 8 à 128 caractères." };
  if (!/^[a-f0-9]{40,128}$/i.test(token)) return { error: "Ce lien est invalide ou expiré. Demandez un nouveau lien." };
  try {
    const db = createSupabaseServerClient();
    // Consume the server-held grant atomically. A browser session alone cannot
    // authorize initialization, and concurrent submissions cannot reuse a link.
    const { data: grant, error } = await db.from("annual_activation_grants").update({ consumed_at: new Date().toISOString() })
      .eq("token_hash", fingerprint(token)).is("consumed_at", null).gt("expires_at", new Date().toISOString())
      .select("id,order_id,auth_user_id").maybeSingle<{ id: string; order_id: string; auth_user_id: string }>();
    if (error || !grant) return { error: "Ce lien est invalide ou expiré. Demandez un nouveau lien." };
    const { data: order, error: orderError } = await db.from("annual_payments").select("status,expires_at,password_initialized_at,auth_user_id")
      .eq("id", grant.order_id).single();
    if (orderError || order.status !== "paid" || Date.parse(order.expires_at) <= Date.now() || order.password_initialized_at || order.auth_user_id !== grant.auth_user_id) {
      return { error: "Cet accès nécessite une vérification. Connectez-vous ou contactez le support." };
    }
    const identity = await db.auth.admin.getUserById(grant.auth_user_id);
    if (identity.error || !identity.data.user?.email) return { error: "Cet accès nécessite une vérification. Contactez le support." };
    const identities = await db.rpc("annual_auth_identity", { target_email: identity.data.user.email });
    if (identities.error || !(identities.data as { id: string; has_password: boolean }[])?.some(user => user.id === grant.auth_user_id && !user.has_password)) {
      return { error: "Votre mot de passe est déjà défini. Connectez-vous ou utilisez la réinitialisation du mot de passe." };
    }
    const auth = await createSupabaseAuthServerClient();
    const verification = await auth.auth.verifyOtp({ token_hash: token, type: "recovery" });
    if (verification.error || verification.data.user?.id !== grant.auth_user_id) return { error: "Ce lien est invalide ou expiré. Demandez un nouveau lien." };
    const updated = await auth.auth.updateUser({ password });
    if (updated.error) return { error: "Le mot de passe n’a pas pu être enregistré. Demandez un nouveau lien pour réessayer." };
    const saved = await db.from("annual_payments").update({ password_initialized_at: new Date().toISOString() }).eq("id", grant.order_id);
    if (saved.error) throw new Error("Password initialization receipt failed");
  } catch {
    return { error: "L’activation n’a pas abouti. Si votre mot de passe a été enregistré, connectez-vous ; sinon demandez un nouveau lien." };
  }
  redirect("/mon-espace");
}
