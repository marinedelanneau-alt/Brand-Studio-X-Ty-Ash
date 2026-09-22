import { getStripe } from "@/lib/stripe";
import { getCurrentAccount } from "@/lib/session";
import { findAccountByEmail } from "@/lib/access-codes";
import { getPublishedLegalDocument } from "@/lib/legal";
import { isLegalDocumentReady } from "@/lib/legal-documents";
import { isCommercialReleaseEnabled } from "@/lib/legal-release";
import { BRAND_STUDIO_OFFER, immediateServiceConsent } from "@/lib/brand-studio-offer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isCommercialReleaseEnabled()) return Response.json({ error: "Offre non publiée." }, { status: 404 });
  // No legal classification is inferred. Immediate service mode preserves withdrawal rights.
  if (process.env.BRAND_STUDIO_WITHDRAWAL_MODE !== "service_immediate_validated" || !process.env.BRAND_STUDIO_VAT_STATUS || !process.env.STRIPE_BRAND_STUDIO_PRICE_ID) {
    return Response.json({ error: "Les modalités de vente doivent être finalisées avant ouverture." }, { status: 503 });
  }
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").origin;
    if (request.headers.get("origin") !== origin) return Response.json({ error: "Origine invalide." }, { status: 403 });
    const body = await request.json();
    if (body.acceptedTerms !== true || body.immediateAccess !== true) return Response.json({ error: "L’acceptation des CGV et la demande d’accès immédiat sont nécessaires." }, { status: 400 });
    const account = await getCurrentAccount();
    const email = account?.email ?? (typeof body.email === "string" ? body.email.trim().toLowerCase() : "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "E-mail invalide." }, { status: 400 });
    if (account || await findAccountByEmail(email)) return Response.json({ error: "Pour un compte existant, contactez le support avant tout nouvel achat. Votre accès actuel est conservé." }, { status: 409 });
    const documents = await Promise.all(["sales_terms", "terms_of_use", "privacy_policy", "legal_notice"].map(getPublishedLegalDocument));
    if (documents.some((document) => !document || !isLegalDocumentReady(document.content))) return Response.json({ error: "Les documents juridiques ne sont pas finalisés." }, { status: 503 });
    if (body.termsId !== documents[0]!.id) return Response.json({ error: "Les CGV ont changé. Rechargez la page avant de commander." }, { status: 409 });
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(process.env.STRIPE_BRAND_STUDIO_PRICE_ID);
    if (!price.active || price.type !== "one_time" || price.recurring || price.currency !== "eur" || price.unit_amount !== 28900) throw new Error("Invalid offer price");
    if (price.livemode && process.env.BRAND_STUDIO_LIVE_PAYMENTS_APPROVED !== "yes") return Response.json({ error: "Les paiements réels ne sont pas ouverts." }, { status: 503 });
    const session = await stripe.checkout.sessions.create({
      mode: "payment", customer_email: email, customer_creation: "always", payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      consent_collection: { terms_of_service: "required" },
      success_url: `${origin}/?payment=success`, cancel_url: `${origin}/offre-brand-studio`,
      metadata: { offer_version: BRAND_STUDIO_OFFER.version, user_id: "", sales_terms_id: documents[0]!.id },
      custom_text: { submit: { message: "289 € au total · paiement unique · accès 12 mois dès validation du paiement · aucun renouvellement automatique." } },
    });
    const { error } = await createSupabaseServerClient().from("commercial_orders_v1").insert({
      session_id: session.id, account_id: null, email,
      offer_version: BRAND_STUDIO_OFFER.version, amount: price.unit_amount, currency: price.currency, live_mode: price.livemode,
      consent: { acceptedTerms: true, immediateAccess: true, immediateText: immediateServiceConsent, withdrawalMode: process.env.BRAND_STUDIO_WITHDRAWAL_MODE, acceptedAt: new Date().toISOString() },
      legal_snapshot: documents,
    });
    if (error) { await stripe.checkout.sessions.expire(session.id); throw error; }
    return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Impossible de préparer la commande. Aucun accès n’a été modifié." }, { status: 503 });
  }
}
