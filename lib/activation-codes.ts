import "server-only";

import { randomBytes } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActivationCodeRecord = {
  offer_version?: string | null;
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
  created_at?: string;
  updated_at?: string;
};

export function generateActivationCode() {
  return randomBytes(32).toString("hex").toUpperCase();
}

export async function createActivationCode(input: {
  email: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  priceId?: string | null;
  offerVersion?: string;
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
      ...(input.offerVersion ? { offer_version: input.offerVersion } : {}),
    })
    .select("*")
    .single<ActivationCodeRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function findActivationCodeByCheckoutSession(
  stripeCheckoutSessionId: string,
) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchase_activation_codes")
    .select("*")
    .eq("stripe_checkout_session_id", stripeCheckoutSessionId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle<ActivationCodeRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function markActivationEmailSent(id: number) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("purchase_activation_codes")
    .update({ status: "email_sent" })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function claimActivationEmail(id: number) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchase_activation_codes")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "paid")
    .select("*")
    .maybeSingle<ActivationCodeRecord>();
  if (error) throw new Error(error.message);
  return data;
}

export async function releaseActivationEmail(id: number) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("purchase_activation_codes")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "sending");
  if (error) throw new Error(error.message);
}

export async function findPendingActivationEmails(limit = 20) {
  const supabase = createSupabaseServerClient();
  const staleSending = new Date(Date.now() - 1000 * 60 * 10).toISOString();
  await supabase
    .from("purchase_activation_codes")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("status", "sending")
    .lt("updated_at", staleSending);
  const { data, error } = await supabase
    .from("purchase_activation_codes")
    .select("*")
    .eq("status", "paid")
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit)
    .returns<ActivationCodeRecord[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
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

export async function findUsableActivationCodeByToken(token: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchase_activation_codes")
    .select("*")
    .eq("code", token)
    .is("consumed_at", null)
    .maybeSingle<ActivationCodeRecord>();

  if (error) {
    throw new Error(error.message);
  }

  if (
    !data ||
    (data.expires_at && new Date(data.expires_at).getTime() < Date.now())
  ) {
    return null;
  }

  return data;
}

export async function findActivationCodeByToken(token: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchase_activation_codes")
    .select("*")
    .eq("code", token)
    .maybeSingle<ActivationCodeRecord>();
  if (error) throw new Error(error.message);
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
