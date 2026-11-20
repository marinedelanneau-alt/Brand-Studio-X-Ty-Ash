import { getCurrentAccount } from "@/lib/session";
import { getSubscriptionAccessStatus } from "@/lib/subscriptions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ANNUAL_OFFER } from "@/lib/annual-offer";
import { annualLiveMode, getAnnualStripe } from "@/lib/annual-stripe";
import { updateAnnualCheckoutState, type AnnualPayment } from "@/lib/annual-payments";

import { cookies } from "next/headers";
import { PURCHASE_COOKIE, fingerprint, newPrivateToken, normalizePurchaseEmail, privateCookieOptions } from "@/lib/annual-guest-security";
import { getPublishedLegalDocument } from "@/lib/legal";
import { assertAnnualEmailEncryptionConfigured } from "@/lib/annual-email-payload";
import { assertAnnualWelcomeEmailConfigured } from "@/lib/mailer";
import { getConfiguredPublicSiteUrl } from "@/lib/public-site-url";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return Response.json({ error: "Origine invalide." }, { status: 403 });
  try {
    const body = await request.json();
    const email = normalizePurchaseEmail(body.email);
    if (!email) return Response.json({ error: "Saisissez une adresse e-mail valide." }, { status: 400 });
    const [terms, sales] = await Promise.all([getPublishedLegalDocument("terms_of_use"), getPublishedLegalDocument("sales_terms")]);
    if (!terms || !sales || body.acceptedTerms !== true || body.termsId !== terms.id || body.salesId !== sales.id) {
      return Response.json({ error: "Consultez et acceptez les CGU et les CGV en vigueur. Rechargez la page si nécessaire." }, { status: 400 });
    }
    const account = await getCurrentAccount();
    if (account) {
      const access = await getSubscriptionAccessStatus(account.id);
      if (access.accessGranted || account.access_started_at || !account.is_active) {
        return Response.json({ error: "Votre compte ne nécessite pas de nouvel achat. Connectez-vous ou contactez le support." }, { status: 409 });
      }
      if (account.email.toLowerCase() !== email) return Response.json({ error: "Utilisez l’adresse de votre compte ou déconnectez-vous." }, { status: 400 });
    }
    const jar = await cookies();
    const previous = jar.get(PURCHASE_COOKIE)?.value;
    const owner = previous && /^[a-f0-9]{64}$/.test(previous) ? previous : newPrivateToken();
    jar.set(PURCHASE_COOKIE, owner, { ...privateCookieOptions, maxAge: 60*60*24*7 });
    const stripe = getAnnualStripe();
    if (getConfiguredPublicSiteUrl()?.origin !== origin) throw new Error("Checkout and activation origin mismatch");
    assertAnnualEmailEncryptionConfigured();
    assertAnnualWelcomeEmailConfigured();
    const liveMode = annualLiveMode();
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) throw new Error("Missing price");
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active || price.type !== "one_time" || price.recurring || price.currency !== ANNUAL_OFFER.currency
      || price.unit_amount !== ANNUAL_OFFER.amount || price.tax_behavior === "exclusive" || price.livemode !== liveMode) {
      throw new Error("Invalid annual price");
    }
    const db = createSupabaseServerClient();
    const reserve = () => db.rpc("reserve_guest_annual_checkout", {
      target_email: email, target_owner_hash: fingerprint(owner), target_price_id: priceId, target_live_mode: liveMode,
      target_terms: { terms, sales, accepted_at: new Date().toISOString(), method: "explicit_checkbox" },
    });
    let { data, error } = await reserve();
    if (error || !data) return Response.json({ error: "Un paiement est déjà en cours ou votre accès nécessite une vérification. Consultez votre confirmation avant de recommencer." }, { status: 409 });
    let order = data as AnnualPayment;
    if (order.session_id) {
      let existing = await stripe.checkout.sessions.retrieve(order.session_id);
      if (existing.status === "open" && existing.allow_promotion_codes === true && existing.url) {
        return Response.json({ url: existing.url }, { headers: { "Cache-Control": "no-store" } });
      }
      if (existing.status === "open" && existing.allow_promotion_codes !== true && existing.payment_status === "unpaid") {
        // Expire at Stripe first: a completed or concurrently paid session must never be replaced.
        existing = await stripe.checkout.sessions.expire(existing.id);
        if (existing.status !== "expired" || existing.payment_status !== "unpaid") throw new Error("Checkout expiration was not confirmed");
      }
      if (existing.status !== "expired" || existing.payment_status !== "unpaid") return Response.json({ error: "Votre paiement est en cours de confirmation. Ne repassez pas commande." }, { status: 409 });
      await updateAnnualCheckoutState(existing, "expired");
      ({ data, error } = await reserve());
      if (error || !data) throw new Error("Checkout reservation failed");
      order = data as AnnualPayment;
    }
    const metadata = { offer_version: ANNUAL_OFFER.version, order_id: order.id, checkout_flow: "annual_guest_v1" };
    const session = await stripe.checkout.sessions.create({
      mode: "payment", locale: "fr", customer_email: email, customer_creation: "always", allow_promotion_codes: true,
      client_reference_id: order.id, line_items: [{ price: order.price_id, quantity: 1 }],
      expires_at: Math.floor(Date.parse(order.checkout_expires_at) / 1000),
      success_url: `${origin}/commander/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/register?payment=cancelled`,
      metadata, payment_intent_data: { metadata },
      custom_text: { submit: { message: "Paiement unique · accès 365 jours dès confirmation de la commande · aucun renouvellement automatique." } },
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
