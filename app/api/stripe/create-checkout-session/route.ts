import { getCurrentAccount } from "@/lib/session";
import { getSubscriptionAccessStatus } from "@/lib/subscriptions";
import { createSupabaseAuthServerClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { ANNUAL_OFFER } from "@/lib/annual-offer";
import { annualLiveMode, getAnnualStripe } from "@/lib/annual-stripe";
import { updateAnnualCheckoutState, type AnnualPayment } from "@/lib/annual-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return Response.json({ error: "Origine invalide." }, { status: 403 });
  try {
    const auth = await createSupabaseAuthServerClient();
    const { data: { user }, error: authError } = await auth.auth.getUser();
    const account = await getCurrentAccount();
    if (authError || !user || !account || account.auth_user_id !== user.id) {
      return Response.json({ error: "Connectez-vous avant de régler votre accès." }, { status: 401 });
    }
    const access = await getSubscriptionAccessStatus(account.id);
    if (access.accessGranted || !account.annual_access_required) {
      return Response.json({ error: "Votre compte ne nécessite pas de nouvel achat. Contactez le support si nécessaire." }, { status: 409 });
    }
    const stripe = getAnnualStripe();
    const liveMode = annualLiveMode();
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) throw new Error("Missing price");
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active || price.type !== "one_time" || price.recurring || price.currency !== ANNUAL_OFFER.currency
      || price.unit_amount !== ANNUAL_OFFER.amount || price.tax_behavior === "exclusive" || price.livemode !== liveMode) {
      throw new Error("Invalid annual price");
    }
    const db = createSupabaseServerClient();
    const reserve = () => db.rpc("reserve_annual_checkout", {
      target_account_id: account.id, target_auth_user_id: user.id, target_price_id: priceId, target_live_mode: liveMode,
    });
    let { data, error } = await reserve();
    if (error || !data) return Response.json({ error: "Un paiement est déjà en cours ou votre accès nécessite une vérification. Consultez votre confirmation avant de recommencer." }, { status: 409 });
    let order = data as AnnualPayment;
    if (order.session_id) {
      const existing = await stripe.checkout.sessions.retrieve(order.session_id);
      if (existing.status === "open" && existing.url) return Response.json({ url: existing.url });
      if (existing.status !== "expired") return Response.json({ error: "Votre paiement est en cours de confirmation. Ne repassez pas commande." }, { status: 409 });
      await updateAnnualCheckoutState(existing, "expired");
      ({ data, error } = await reserve());
      if (error || !data) throw new Error("Checkout reservation failed");
      order = data as AnnualPayment;
    }
    const metadata = { offer_version: ANNUAL_OFFER.version, order_id: order.id, auth_user_id: user.id, user_id: String(account.id) };
    const session = await stripe.checkout.sessions.create({
      mode: "payment", locale: "fr", customer_email: account.email, customer_creation: "always",
      client_reference_id: user.id, line_items: [{ price: order.price_id, quantity: 1 }],
      expires_at: Math.floor(Date.parse(order.checkout_expires_at) / 1000),
      success_url: `${origin}/commander/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/commander?payment=cancelled`,
      metadata, payment_intent_data: { metadata },
      custom_text: { submit: { message: "55 € TTC · paiement unique · accès 365 jours dès confirmation du paiement · aucun renouvellement automatique." } },
    }, { idempotencyKey: `annual-${order.id}-${order.checkout_attempt}` });
    if (!session.url) throw new Error("Missing checkout URL");
    const { error: saveError } = await db.from("annual_payments").update({ session_id: session.id, customer_id: typeof session.customer === "string" ? session.customer : null, updated_at: new Date().toISOString() })
      .eq("id", order.id).eq("checkout_attempt", order.checkout_attempt).is("session_id", null);
    if (saveError) throw new Error("Checkout persistence failed");
    return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("[annual-checkout] Session preparation failed");
    return Response.json({ error: "Le paiement est momentanément indisponible. Si vous avez déjà payé, contactez le support avant de recommencer." }, { status: 503 });
  }
}
