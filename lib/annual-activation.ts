import "server-only";
import { createSupabaseServerClient } from "./supabase/server";
import { randomUUID } from "node:crypto";
import { decryptAnnualEmail, encryptAnnualEmail } from "./annual-email-payload";
import { fingerprint } from "./annual-guest-security";
import { getPublicSiteUrlWithFallback } from "./public-site-url";
import { sendAnnualWelcomeEmail } from "./mailer";

export type GuestAnnualPayment = {
  id: string; purchase_email: string; auth_user_id: string | null; account_id: number | null;
  status: string; paid_at: string | null; expires_at: string | null; fulfillment_state: string;
  activation_required: boolean; email_message_id: string | null; password_initialized_at: string | null;
  email_sent_at: string | null; email_payload: string | null;
};

export async function deliverAnnualWelcome(orderId: string, resend = false) {
  const db = createSupabaseServerClient();
  const now = new Date().toISOString();
  // A persisted lease serializes webhook retries and public resends. A failed
  // delivery is resumable; Brevo's idempotency key also covers ambiguous timeouts.
  let claim = db.from("annual_payments").update({ email_claim_until: new Date(Date.now() + 120_000).toISOString() })
    .eq("id", orderId).eq("status", "paid").eq("fulfillment_state", "ready")
    .or(`email_claim_until.is.null,email_claim_until.lt.${now}`);
  claim = resend ? claim.or(`email_sent_at.is.null,email_sent_at.lt.${new Date(Date.now()-60_000).toISOString()}`) : claim.is("email_message_id", null);
  const { data: order, error } = await claim.select("*").maybeSingle<GuestAnnualPayment>();
  if (error) throw new Error("Activation delivery claim failed");
  if (!order) {
    const current = await db.from("annual_payments").select("email_message_id").eq("id", orderId).single();
    if (!resend && !current.data?.email_message_id) throw new Error("Activation delivery already in progress");
    return;
  }
  if (!order.auth_user_id || !order.purchase_email || !order.expires_at || Date.parse(order.expires_at) <= Date.now()) return;
  const identity = await db.rpc("annual_auth_identity", { target_email: order.purchase_email });
  if (identity.error) throw new Error("Activation identity lookup failed");
  const hasPassword = (identity.data as { id: string; has_password: boolean }[])?.some(user => user.id === order.auth_user_id && user.has_password);
  if (order.activation_required && hasPassword && !order.password_initialized_at) {
    const saved = await db.from("annual_payments").update({ password_initialized_at: now }).eq("id", order.id);
    if (saved.error) throw new Error("Initialization reconciliation failed");
  }
  let payload = order.email_payload ? decryptAnnualEmail(order.email_payload) : null;
  if (!payload || payload.expiresAt <= Date.now() || (resend && order.email_message_id)) {
    let activationUrl: string | undefined;
    if (order.activation_required && !order.password_initialized_at && !hasPassword) {
      const { data, error: linkError } = await db.auth.admin.generateLink({ type: "recovery", email: order.purchase_email });
      if (linkError || !data.properties?.hashed_token || data.user.id !== order.auth_user_id) throw new Error("Activation link generation failed");
      const token = data.properties.hashed_token;
      const { error: grantError } = await db.from("annual_activation_grants").upsert({
        order_id: order.id, auth_user_id: order.auth_user_id, token_hash: fingerprint(token),
        expires_at: new Date(Date.now()+3_600_000).toISOString(), consumed_at: null,
      }, { onConflict: "token_hash" });
      if (grantError) throw new Error("Activation grant persistence failed");
      const url = new URL("/activer", getPublicSiteUrlWithFallback());
      url.searchParams.set("token_hash", token);
      activationUrl = url.toString();
    }
    payload = { url: activationUrl, expiresAt: Date.now()+3_600_000, deliveryKey: randomUUID() };
    const persisted = await db.from("annual_payments").update({ email_payload: encryptAnnualEmail(payload) }).eq("id", order.id);
    if (persisted.error) throw new Error("Email outbox persistence failed");
  }
  // Existing passwords are never reset as a side effect of a payment.
  const messageId = await sendAnnualWelcomeEmail({ email: order.purchase_email, activationUrl: hasPassword ? undefined : payload.url,
    idempotencyKey: payload.deliveryKey });
  const { error: saveError } = await db.from("annual_payments").update({ email_message_id: messageId, email_sent_at: new Date().toISOString() }).eq("id", order.id);
  if (saveError) throw new Error("Activation delivery receipt persistence failed");
}

export async function fulfillGuestAnnualAccount(orderId: string) {
  const db = createSupabaseServerClient();
  const { data: order, error } = await db.from("annual_payments").select("*").eq("id", orderId).single<GuestAnnualPayment>();
  if (error || !order) throw new Error("Paid order lookup failed");
  if (order.status !== "paid") return;
  if (order.fulfillment_state !== "pending") {
    if (order.fulfillment_state === "ready") await deliverAnnualWelcome(order.id);
    return;
  }
  const lookup = async () => {
    const { data, error } = await db.rpc("annual_auth_identity", { target_email: order.purchase_email });
    if (error) throw new Error("Paid identity lookup failed");
    return (data as { id: string; has_password: boolean }[])[0] ?? null;
  };
  let identity = await lookup();
  if (!identity) {
    const created = await db.auth.admin.createUser({ email: order.purchase_email, email_confirm: false });
    // Concurrent duplicate events or a response timeout may have created it.
    identity = created.data.user ? { id: created.data.user.id, has_password: false } : await lookup();
    if (!identity) throw new Error("Paid account creation failed");
  }
  const bound = await db.rpc("bind_guest_annual_payment", { target_order_id: order.id, target_auth_user_id: identity.id });
  if (bound.error) throw new Error("Paid account association failed");
  if (bound.data !== "ready") {
    // Persisted review state is visible to the purchase owner, not the public.
    // Existing rights are untouched and no password reset email is sent.
    return;
  }
  await deliverAnnualWelcome(order.id);
}
