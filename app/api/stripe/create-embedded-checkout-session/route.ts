import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getCurrentAccount } from "@/lib/session";
import { findStripeCustomerId, getSubscriptionAccessStatus } from "@/lib/subscriptions";
import { BRAND_STUDIO_OFFER } from "@/lib/brand-studio-offer";
import { getStripe } from "@/lib/stripe";
import { PLATFORM_AMOUNT, PLATFORM_CHECKOUT_FLOW, PLATFORM_PRICE_ID } from "@/lib/platform-checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) {
    return Response.json({ error: "Origine de la demande invalide." }, { status: 403 });
  }
  try {
    const account = await getCurrentAccount();
    const access = account ? await getSubscriptionAccessStatus(account.id) : null;
    if (access?.accessGranted || access?.plan === BRAND_STUDIO_OFFER.version) {
      return Response.json({ error: "Vous disposez déjà d’un accès. Connectez-vous à votre espace ou contactez le support." }, { status: 409 });
    }
    const body = await request.json();
    const email = account?.email.trim().toLowerCase() || (typeof body.email === "string" ? body.email.trim().toLowerCase() : "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Veuillez renseigner une adresse e-mail valide." }, { status: 400 });
    }
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(PLATFORM_PRICE_ID);
    if (!price.active || price.type !== "one_time" || price.currency !== "eur" || price.unit_amount !== PLATFORM_AMOUNT || price.tax_behavior === "exclusive") {
      throw new Error("Unexpected platform price");
    }
    const owner = randomUUID();
    const metadata = { user_id: account ? String(account.id) : "", product: "brand_studio", checkout_flow: PLATFORM_CHECKOUT_FLOW, price_id: PLATFORM_PRICE_ID };
    const customerId = account ? await findStripeCustomerId(account.id) : null;
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "payment",
      customer: customerId ?? undefined,
      customer_email: customerId ? undefined : email,
      customer_creation: customerId ? undefined : "always",
      line_items: [{ price: PLATFORM_PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      locale: "fr",
      return_url: `${origin}/commander/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      redirect_on_completion: "always",
      metadata: { ...metadata, return_owner: owner },
      payment_intent_data: { metadata },
    });
    if (!session.client_secret) throw new Error("Missing client secret");
    (await cookies()).set("platform_checkout_owner", owner, {
      httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "lax", path: "/commander", maxAge: 86400,
    });
    return Response.json({ clientSecret: session.client_secret }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Le paiement est momentanément indisponible. Veuillez réessayer dans quelques instants." }, { status: 503 });
  }
}
