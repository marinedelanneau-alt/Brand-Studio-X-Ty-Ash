import "server-only";

import {
  claimActivationEmail,
  findPendingActivationEmails,
  markActivationEmailSent,
  releaseActivationEmail,
  type ActivationCodeRecord,
} from "./activation-codes";
import { sendAccountActivationEmail } from "./mailer";
import { sendWithImmediateRetry } from "./activation-email-retry";
import { BRAND_STUDIO_OFFER } from "./brand-studio-offer";
import { commercialReceipt } from "./commercial-receipt";
import { createSupabaseServerClient } from "./supabase/server";

export async function deliverActivationEmail(activation: ActivationCodeRecord) {
  if (activation.status === "email_sent" || activation.consumed_at) return false;
  const claimed = await claimActivationEmail(activation.id);
  if (!claimed) return false;
  try {
    let orderConfirmation: string | undefined;
    if (claimed.offer_version === BRAND_STUDIO_OFFER.version) {
      const { data, error } = await createSupabaseServerClient().from("commercial_orders_v1").select("*").eq("session_id", claimed.stripe_checkout_session_id).single();
      if (error || !data?.paid_at || !data.expires_at) throw new Error("Paid order confirmation unavailable");
      orderConfirmation = commercialReceipt(data);
    }
    await sendWithImmediateRetry(() => {
      return sendAccountActivationEmail({
        email: claimed.email,
        clientName: claimed.email.split("@")[0],
        activationToken: claimed.code,
        ...(orderConfirmation ? { orderConfirmation } : {}),
      });
    });
    await markActivationEmailSent(claimed.id);
    return true;
  } catch (error) {
    await releaseActivationEmail(claimed.id);
    throw error;
  }
}

export async function retryPendingActivationEmails(limit = 20) {
  const pending = await findPendingActivationEmails(limit);
  let sent = 0;
  const failures: Array<{ id: number; message: string }> = [];
  for (const activation of pending) {
    try {
      if (await deliverActivationEmail(activation)) sent += 1;
    } catch (error) {
      failures.push({
        id: activation.id,
        message: error instanceof Error ? error.message : "Échec d’envoi inconnu",
      });
    }
  }
  return { pending: pending.length, sent, failures };
}
