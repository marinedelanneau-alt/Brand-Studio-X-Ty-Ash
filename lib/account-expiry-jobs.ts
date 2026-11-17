import "server-only";
import { createSupabaseServerClient } from "./supabase/server";
import { isLifetimeExempt } from "./account-lifetime";
import { sendAccountExpiryEmail } from "./mailer";

type Reminder = { account_id: number; email: string; client_name: string | null; expires_at: string; claim_token: string };

export async function runAccountExpiryJobs() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Account expiry requires the server service role");
  const db = createSupabaseServerClient();
  const result = { remindersSent: 0, accountsDeleted: 0, errors: [] as Array<{ accountId: number; operation: string }> };
  const deadline = Date.now() + 240_000;
  // Drain reminder batches, prioritizing the nearest deadlines.
  for (const stage of ["fortnight", "month"] as const) {
    const reminderDeadline = Math.min(Date.now() + 60_000, deadline - 60_000);
    while (Date.now() < reminderDeadline) {
      const { data, error } = await db.rpc("claim_account_expiry_reminders", { reminder_stage: stage, batch_limit: 50 });
      if (error) throw new Error(`Reminder claim failed: ${error.message}`);
      const reminders = (data ?? []) as Reminder[];
      // At most five provider calls in flight, with no in-process retries after
      // ambiguous timeouts. Unconfirmed claims become eligible next daily run.
      for (let index = 0; index < reminders.length && Date.now() < reminderDeadline; index += 5) {
        await Promise.all(reminders.slice(index, index + 5).map(async reminder => {
          try {
            const { data: account, error: readError } = await db.from("client_access_codes").select("email,role,is_admin,access_expires_at,access_deletion_started_at").eq("id", reminder.account_id).maybeSingle();
            if (readError) throw readError;
            if (!account || isLifetimeExempt(account) || account.access_deletion_started_at
              || account.access_expires_at !== reminder.expires_at || Date.parse(reminder.expires_at) <= Date.now()) return;
            const messageId = await sendAccountExpiryEmail({ email: account.email, clientName: reminder.client_name, expiresAt: reminder.expires_at, stage });
            const { data: saved, error: saveError } = await db.from("account_expiry_reminders")
              .update({ sent_at: new Date().toISOString(), message_id: messageId })
              .eq("account_id", reminder.account_id).eq("expires_at", reminder.expires_at).eq("stage", stage)
              .eq("claim_token", reminder.claim_token).is("sent_at", null).select("account_id").maybeSingle();
            if (saveError || !saved) throw new Error("Reminder receipt could not be saved");
            result.remindersSent++;
          } catch {
            result.errors.push({ accountId: reminder.account_id, operation: `reminder_${stage}` });
          }
        }));
      }
      if (reminders.length < 50) break;
    }
  }
  // Expiration blocks paid features; accounts, Auth identities and files remain.
  return result;
}
