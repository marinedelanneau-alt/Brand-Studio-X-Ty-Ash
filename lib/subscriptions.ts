import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SubscriptionStatus =
  | "none"
  | "pending"
  | "paid"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired";

export type SubscriptionAccessStatus = {
  status: SubscriptionStatus;
  accessGranted: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
};

export async function getSubscriptionAccessStatus(
  userId: number,
): Promise<SubscriptionAccessStatus> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "status, access_granted, stripe_customer_id, stripe_subscription_id, current_period_end",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return {
      status: "none",
      accessGranted: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    };
  }

  return {
    status: (data.status ?? "none") as SubscriptionStatus,
    accessGranted: data.access_granted === true,
    stripeCustomerId: data.stripe_customer_id ?? null,
    stripeSubscriptionId: data.stripe_subscription_id ?? null,
    currentPeriodEnd: data.current_period_end ?? null,
  };
}

export async function hasActiveAccess(userId: number) {
  const supabase = createSupabaseServerClient();
  const { data: account, error: accountError } = await supabase
    .from("client_access_codes")
    .select("is_admin,is_active")
    .eq("id", userId)
    .maybeSingle<{ is_admin: boolean; is_active: boolean }>();

  if (accountError) {
    throw new Error(accountError.message);
  }

  if (account?.is_admin && account.is_active !== false) {
    return true;
  }

  const status = await getSubscriptionAccessStatus(userId);
  return status.accessGranted && ["active", "paid", "trialing"].includes(status.status);
}

export async function requireActiveAccess(userId: number) {
  return hasActiveAccess(userId);
}

export async function findStripeCustomerId(userId: number) {
  const status = await getSubscriptionAccessStatus(userId);
  return status.stripeCustomerId;
}

export async function upsertSubscription(input: {
  userId: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  priceId?: string | null;
  plan?: string | null;
  status: string;
  accessGranted: boolean;
  currentPeriodEnd?: string | null;
}) {
  const supabase = createSupabaseServerClient();

  const { data: existingSubscription, error: selectError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", input.userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: number }>();

  if (selectError) {
    throw new Error(selectError.message);
  }

  const payload = {
    user_id: input.userId,
    provider: "stripe",
    stripe_customer_id: input.stripeCustomerId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
    price_id: input.priceId ?? null,
    plan: input.plan ?? "brand_studio",
    status: input.status,
    access_granted: input.accessGranted,
    current_period_end: input.currentPeriodEnd ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = existingSubscription
    ? await supabase
        .from("subscriptions")
        .update(payload)
        .eq("id", existingSubscription.id)
    : await supabase.from("subscriptions").insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}
