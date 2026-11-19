import "server-only";
import type Stripe from "stripe";
import { createSupabaseServerClient } from "./supabase/server";
import { ANNUAL_OFFER } from "./annual-offer";
import { annualLiveMode, getAnnualStripe } from "./annual-stripe";
import { fulfillGuestAnnualAccount } from "./annual-activation";

export type AnnualPayment = {
  id: string; account_id: number | null; auth_user_id: string | null; live_mode: boolean;
  purchase_email?: string | null; owner_hash?: string | null;
  price_id: string; session_id: string | null; customer_id: string | null;
  payment_intent_id: string | null; status: string; paid_at: string | null;
  expires_at: string | null; checkout_attempt: number; checkout_expires_at: string;
};

export async function getAnnualPayment(accountId: number) {
  const { data, error } = await createSupabaseServerClient().from("annual_payments")
    .select("*").eq("account_id", accountId).maybeSingle<AnnualPayment>();
  if (error) throw new Error("Annual payment lookup failed");
  if (data && data.live_mode !== annualLiveMode()) throw new Error("Payment environment mismatch");
  return data;
}

function idOf(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export async function fulfillAnnualPayment(session: Stripe.Checkout.Session, event: { id: string; created: number; livemode: boolean }) {
  if (event.livemode !== annualLiveMode() || session.livemode !== event.livemode) throw new Error("Payment environment mismatch");
  if (session.payment_status !== "paid") return;
  const stripe = getAnnualStripe();
  const db = createSupabaseServerClient();
  const { data: order, error } = await db.from("annual_payments").select("*").eq("session_id", session.id).single<AnnualPayment>();
  if (error || !order) throw new Error("Checkout evidence missing");
  const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 2 });
  if (session.mode !== "payment" || session.amount_total !== ANNUAL_OFFER.amount
    || session.currency !== ANNUAL_OFFER.currency || order.live_mode !== session.livemode
    || session.metadata?.offer_version !== ANNUAL_OFFER.version
    || session.metadata?.order_id !== order.id
    || (order.purchase_email ? session.metadata?.checkout_flow !== "annual_guest_v1" || session.client_reference_id !== order.id || session.customer_email?.trim().toLowerCase() !== order.purchase_email
      : session.metadata?.auth_user_id !== order.auth_user_id || session.client_reference_id !== order.auth_user_id)
    || items.has_more || items.data.length !== 1 || items.data[0].price?.id !== order.price_id
    || items.data[0].quantity !== 1) throw new Error("Invalid annual checkout");
  const { error: applyError } = await db.rpc("apply_annual_payment", {
    target_session_id: session.id, target_payment_intent_id: idOf(session.payment_intent),
    target_customer_id: idOf(session.customer), target_event_id: event.id,
    target_paid_at: new Date(event.created * 1000).toISOString(), target_live_mode: session.livemode,
  });
  if (applyError) throw new Error("Annual payment activation failed");
  if (order.purchase_email) await fulfillGuestAnnualAccount(order.id);
}

export async function updateAnnualCheckoutState(session: Stripe.Checkout.Session, status: "processing" | "failed" | "expired") {
  if (session.livemode !== annualLiveMode()) throw new Error("Payment environment mismatch");
  const { error } = await createSupabaseServerClient().from("annual_payments")
    .update({ status, updated_at: new Date().toISOString() }).eq("session_id", session.id)
    .eq("live_mode", session.livemode).in("status", ["pending", "processing"]).is("paid_at", null);
  if (error) throw new Error("Checkout state update failed");
}

// Disputes suspend access until manual review, even if later won. Partial
// refunds keep access. Reversals never delete accounts or project data.
export async function revokeAnnualPayment(paymentIntentId: string, liveMode: boolean, status: "refunded" | "disputed") {
  if (liveMode !== annualLiveMode()) throw new Error("Payment environment mismatch");
  const intent = await getAnnualStripe().paymentIntents.retrieve(paymentIntentId);
  if (intent.metadata.offer_version !== ANNUAL_OFFER.version) return;
  const { error } = await createSupabaseServerClient().from("annual_payments")
    .update({ status, revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", intent.metadata.order_id).eq("live_mode", liveMode)
    .in("status", status === "refunded" ? ["pending", "processing", "paid", "disputed"] : ["pending", "processing", "paid"]);
  if (error) throw new Error("Payment revocation failed");
}
