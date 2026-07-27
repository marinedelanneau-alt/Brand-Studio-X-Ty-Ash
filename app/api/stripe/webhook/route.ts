import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createActivationCode,
  findActivationCodeByCheckoutSession,
} from "@/lib/activation-codes";
import { deliverActivationEmail } from "@/lib/activation-email-delivery";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { upsertSubscription } from "@/lib/subscriptions";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const maxDuration = 60;

function objectId(value: string | { id: string } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function dateFromUnix(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const record = subscription as Stripe.Subscription & {
    current_period_end?: number | null;
  };

  return dateFromUnix(record.current_period_end);
}

async function findUserIdByStripeIds(input: {
  customerId?: string | null;
  subscriptionId?: string | null;
}) {
  const supabase = createSupabaseServerClient();
  let query = supabase.from("subscriptions").select("user_id").limit(1);

  if (input.subscriptionId) {
    query = query.eq("stripe_subscription_id", input.subscriptionId);
  } else if (input.customerId) {
    query = query.eq("stripe_customer_id", input.customerId);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle<{ user_id: number }>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.user_id ?? null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!["paid", "no_payment_required"].includes(session.payment_status)) {
    return;
  }
  const userId = Number(session.metadata?.user_id);
  const subscriptionId = objectId(
    session.subscription as string | { id: string } | null | undefined,
  );
  const customerId = objectId(
    session.customer as string | { id: string } | null | undefined,
  );
  const isSubscription = session.mode === "subscription";
  const status = isSubscription ? "active" : "paid";

  if (!Number.isFinite(userId) || userId <= 0) {
    const email = session.customer_details?.email ?? session.customer_email;

    if (!email) {
      throw new Error("Missing checkout customer email");
    }

    const existingActivation =
      await findActivationCodeByCheckoutSession(session.id);
    const activation =
      existingActivation ??
      (await createActivationCode({
        email,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeCheckoutSessionId: session.id,
        priceId: process.env.STRIPE_PRICE_ID ?? null,
      }));

    await deliverActivationEmail(activation);

    return;
  }

  await upsertSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripeCheckoutSessionId: session.id,
    priceId: process.env.STRIPE_PRICE_ID ?? null,
    status,
    accessGranted: true,
  });
}

async function handleSubscriptionChanged(subscription: Stripe.Subscription) {
  const metadataUserId = Number(subscription.metadata?.user_id);
  const subscriptionId = subscription.id;
  const customerId = objectId(
    subscription.customer as string | { id: string } | null | undefined,
  );
  const userId = Number.isFinite(metadataUserId)
    ? metadataUserId
    : await findUserIdByStripeIds({ customerId, subscriptionId });

  if (!userId) {
    return;
  }

  const accessGranted = ["active", "trialing"].includes(subscription.status);
  const priceId = subscription.items.data[0]?.price.id ?? process.env.STRIPE_PRICE_ID ?? null;

  await upsertSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    priceId,
    status: subscription.status,
    accessGranted,
    currentPeriodEnd: subscriptionPeriodEnd(subscription),
  });
}

async function handleInvoicePayment(invoice: Stripe.Invoice, succeeded: boolean) {
  const invoiceRecord = invoice as Stripe.Invoice & {
    subscription?: string | { id: string } | null;
  };
  const subscriptionId = objectId(invoiceRecord.subscription);
  const customerId = objectId(
    invoice.customer as string | { id: string } | null | undefined,
  );
  const userId = await findUserIdByStripeIds({ customerId, subscriptionId });

  if (!userId) {
    return;
  }

  await upsertSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    priceId: process.env.STRIPE_PRICE_ID ?? null,
    status: succeeded ? "active" : "past_due",
    accessGranted: succeeded,
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChanged(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePayment(event.data.object, true);
        break;
      case "invoice.payment_failed":
        await handleInvoicePayment(event.data.object, false);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process webhook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
