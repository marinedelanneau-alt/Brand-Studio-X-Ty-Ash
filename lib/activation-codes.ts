import "server-only";

import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActivationCodeRecord = {
  id: number;
  code: string;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  price_id: string | null;
  status: string;
  consumed_at: string | null;
  expires_at: string | null;
};

export function generateActivationCode() {
  return `BRAND-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export async function createActivationCode(input: {
  email: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  priceId?: string | null;
}) {
  const supabase = createSupabaseServerClient();
  const code = generateActivationCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

  const { data, error } = await supabase
    .from("purchase_activation_codes")
    .insert({
      code,
      email: input.email.toLowerCase(),
      stripe_customer_id: input.stripeCustomerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
      price_id: input.priceId ?? null,
      status: "paid",
      expires_at: expiresAt,
    })
    .select("*")
    .single<ActivationCodeRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function findUsableActivationCode(input: {
  code: string;
  email: string;
}) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchase_activation_codes")
    .select("*")
    .eq("code", input.code)
    .eq("email", input.email.toLowerCase())
    .is("consumed_at", null)
    .maybeSingle<ActivationCodeRecord>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  return data;
}

export async function consumeActivationCode(id: number) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("purchase_activation_codes")
    .update({
      consumed_at: new Date().toISOString(),
      status: "consumed",
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
