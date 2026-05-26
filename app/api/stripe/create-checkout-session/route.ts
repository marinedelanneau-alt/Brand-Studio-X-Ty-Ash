import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { findStripeCustomerId, upsertSubscription } from "@/lib/subscriptions";
import { getStripe, getStripeCheckoutMode } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  try {
    const account = await getCurrentAccount();

    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!priceId || !siteUrl) {
      return NextResponse.json(
        { error: "Stripe checkout is not configured" },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    const mode = getStripeCheckoutMode();
    let customerId = await findStripeCustomerId(account.id);

    if (!customerId) {
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
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?payment=success`,
      cancel_url: `${siteUrl}/pricing?payment=cancelled`,
      metadata: {
        user_id: String(account.id),
        product: "brand_studio",
      },
      payment_intent_data:
        mode === "payment"
          ? {
              metadata: {
                user_id: String(account.id),
                product: "brand_studio",
              },
            }
          : undefined,
      subscription_data:
        mode === "subscription"
          ? {
              metadata: {
                user_id: String(account.id),
                product: "brand_studio",
              },
            }
          : undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
