import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { findStripeCustomerId, upsertSubscription } from "@/lib/subscriptions";
import { getStripe, getStripeCheckoutMode } from "@/lib/stripe";
import { createStripeReturnUrl } from "@/lib/stripe-return-url";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const account = await getCurrentAccount();

    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe checkout is not configured" },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    const mode = getStripeCheckoutMode();
    const successUrl = createStripeReturnUrl(request.url, "/?payment=success");
    const cancelUrl = createStripeReturnUrl(
      request.url,
      "/pricing?payment=cancelled",
    );
    let customerId = account ? await findStripeCustomerId(account.id) : null;

    if (account && !customerId) {
      const customer = await stripe.customers.create({
        email: account.email,
        name: account.client_name ?? account.company_name ?? undefined,
        metadata: {
          user_id: String(account.id),
          product: "brand_studio",
        },
      });
      customerId = customer.id;

      await upsertSubscription({
        userId: account.id,
        stripeCustomerId: customerId,
        priceId,
        status: "pending",
        accessGranted: false,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      customer: customerId ?? undefined,
      customer_creation: !account && mode === "payment" ? "always" : undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: account ? String(account.id) : "",
        product: "brand_studio",
      },
      payment_intent_data:
        mode === "payment"
          ? {
              metadata: {
                user_id: account ? String(account.id) : "",
                product: "brand_studio",
              },
            }
          : undefined,
      subscription_data:
        mode === "subscription"
          ? {
              metadata: {
                user_id: account ? String(account.id) : "",
                product: "brand_studio",
              },
            }
          : undefined,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe n'a pas retourné d'URL de paiement" },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
