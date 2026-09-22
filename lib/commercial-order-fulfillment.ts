import "server-only";
import type Stripe from "stripe";
import { BRAND_STUDIO_OFFER, accessExpiresAt } from "@/lib/brand-studio-offer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createActivationCode, findActivationCodeByCheckoutSession } from "@/lib/activation-codes";
import { deliverActivationEmail } from "@/lib/activation-email-delivery";

export async function fulfillCommercialOrder(session: Stripe.Checkout.Session, event: { id: string; created: number }) {
  // Disabling new sales must not abandon orders already paid and evidenced.
  if (session.payment_status !== "paid") return;
  if (session.mode !== "payment" || session.currency !== "eur" || session.amount_total !== BRAND_STUDIO_OFFER.amount || session.consent?.terms_of_service !== "accepted") throw new Error("Invalid paid order");
  const db = createSupabaseServerClient();
  const { data: order, error } = await db.from("commercial_orders_v1").select("*").eq("session_id", session.id).single();
  if (error || !order || order.live_mode !== session.livemode || order.offer_version !== BRAND_STUDIO_OFFER.version) throw new Error("Order evidence missing");
  if (order.account_id) throw new Error("Existing account order requires manual review; access unchanged");
  const paidAt = new Date(event.created * 1000).toISOString();
  // Conditional update: retries cannot reset the original access period.
  const { error: paidError } = await db.from("commercial_orders_v1").update({ paid_at: paidAt, expires_at: accessExpiresAt(paidAt), payment_event_id: event.id, payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id }).eq("session_id", session.id).is("paid_at", null);
  if (paidError) throw paidError;
  const { data: paidOrder, error: readError } = await db.from("commercial_orders_v1").select("expires_at").eq("session_id", session.id).single();
  if (readError) throw readError;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!paidOrder?.expires_at) throw new Error("Paid order expiry missing");
  let activation = await findActivationCodeByCheckoutSession(session.id);
  if (!activation) {
    // serialize creation by a unique session index on NEW v1 activation codes only
    try { activation = await createActivationCode({ email: order.email, stripeCustomerId: customerId, stripeCheckoutSessionId: session.id, priceId: process.env.STRIPE_BRAND_STUDIO_PRICE_ID, offerVersion: BRAND_STUDIO_OFFER.version }); }
    catch (error) { activation = await findActivationCodeByCheckoutSession(session.id); if (!activation) throw error; }
  }
  await deliverActivationEmail(activation);
}
