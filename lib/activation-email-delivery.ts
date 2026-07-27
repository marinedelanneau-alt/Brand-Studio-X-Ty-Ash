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

export async function deliverActivationEmail(activation: ActivationCodeRecord) {
  if (activation.status === "email_sent" || activation.consumed_at) return false;
  const claimed = await claimActivationEmail(activation.id);
  if (!claimed) return false;
  try {
    await sendWithImmediateRetry(() => {
      return sendAccountActivationEmail({
        email: claimed.email,
        clientName: claimed.email.split("@")[0],
        activationToken: claimed.code,
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
