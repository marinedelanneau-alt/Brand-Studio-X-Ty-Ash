import "server-only";
import { createSupabaseServerClient } from "./supabase/server";
import { getAuthenticatedInvitationAdmin } from "./session";
import { grantJulienAccess } from "./julien-access";
import { assertJulienEmailConfigured, sendJulienInvitationEmail } from "./mailer";
import { BrevoDeliveryError, type BrevoDiagnostic } from "./brevo-diagnostics";
export const JULIEN_EMAIL = "jsene@ty-ash.com";
export const TY_ASH_ORIGIN = "https://brand-studio-x-ty-ash.vercel.app";
export type JulienInvitationState = {
  status: "idle" | "error" | "success";
  account: "unchecked" | "absent" | "created" | "existing";
  accessGranted: boolean; emailSent: boolean; message: string;
  brevoError?: BrevoDiagnostic;
};
// Coalesce concurrent clicks within the same server instance. Auth uniqueness
// and targeted account insertion keep identity/access idempotent across instances.
let inFlight: Promise<JulienInvitationState> | undefined;
let recentSuccess: { until: number; result: JulienInvitationState } | undefined;
export async function prepareAndSendJulienInvitation(): Promise<JulienInvitationState> {
  await getAuthenticatedInvitationAdmin(); // Must also guard direct server callers.
  if (recentSuccess && recentSuccess.until > Date.now()) return recentSuccess.result;
  if (inFlight) return inFlight;
  inFlight = sendInvitation();
  try {
    const result = await inFlight;
    if (result.status === "success") recentSuccess = { until: Date.now() + 60_000, result };
    return result;
  } finally { inFlight = undefined; }
}
async function sendInvitation(): Promise<JulienInvitationState> {
  const state: JulienInvitationState = { status: "error", account: "unchecked", accessGranted: false, emailSent: false, message: "" };
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://cplzwnlstcpqqzqeawgs.supabase.co") throw new Error("Projet Ty Ash requis.");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Configuration Auth serveur manquante.");
    assertJulienEmailConfigured(); // Check before creating an account.
    const admin = createSupabaseServerClient();
    let existing = false;
    for (let page = 1; ; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw new Error("Vérification Auth impossible. Aucun email envoyé.");
      if (data.users.some(user => user.email?.toLowerCase() === JULIEN_EMAIL)) { existing = true; break; }
      if (data.users.length < 100) break;
    }
    state.account = existing ? "existing" : "absent";
    const redirectTo = `${TY_ASH_ORIGIN}/auth/reset/callback`;
    let type: "invite" | "recovery" = existing ? "recovery" : "invite";
    let result = await admin.auth.admin.generateLink({ type, email: JULIEN_EMAIL, options: { redirectTo } });
    // Supabase enforces identity uniqueness if a concurrent signup wins.
    if (result.error && !existing && ["email_exists", "user_already_exists"].includes(result.error.code ?? "")) {
      type = "recovery"; existing = true; state.account = "existing";
      result = await admin.auth.admin.generateLink({ type, email: JULIEN_EMAIL, options: { redirectTo } });
    }
    if (result.error || !result.data.user) throw new Error("Impossible de préparer le lien sécurisé.");
    state.account = existing ? "existing" : "created";
    const tokenHash = result.data.properties?.hashed_token;
    if (!tokenHash) throw new Error("Le lien sécurisé est incomplet. Aucun email envoyé.");
    if (result.data.user.email?.toLowerCase() !== JULIEN_EMAIL) throw new Error("Identité Auth inattendue. Aucun email envoyé.");
    await grantJulienAccess(result.data.user.id);
    state.accessGranted = true;
    const link = new URL(redirectTo);
    link.searchParams.set("token_hash", tokenHash); link.searchParams.set("type", type);
    await sendJulienInvitationEmail(link.toString());
    state.emailSent = true;
    return { ...state, status: "success", message: "Invitation envoyée à jsene@ty-ash.com" };
  } catch (error) {
    if (error instanceof BrevoDeliveryError) state.brevoError = error.diagnostic;
    // A provider timeout is ambiguous; never display success without its receipt.
    state.message = state.accessGranted
      ? "Compte disponible et accès accordé, mais envoi non confirmé. Vérifiez Brevo avant une nouvelle tentative."
      : "Invitation impossible. Aucun email envoyé.";
    return state;
  }
}
