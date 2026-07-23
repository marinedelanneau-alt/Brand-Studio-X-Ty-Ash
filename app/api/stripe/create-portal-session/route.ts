import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { getSubscriptionAccessStatus } from "@/lib/subscriptions";
import { getStripe } from "@/lib/stripe";
import { createStripeReturnUrl } from "@/lib/stripe-return-url";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const account = await getCurrentAccount();

    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getSubscriptionAccessStatus(account.id);

    if (!subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found for this account" },
        { status: 404 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: createStripeReturnUrl(request.url, "/dashboard"),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create portal session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
