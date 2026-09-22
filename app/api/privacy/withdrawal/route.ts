import { isLegalReleaseEnabled } from "@/lib/legal-release";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWithdrawalReceipt } from "@/lib/mailer";

export async function POST(request: Request) {
  const respond = (message: string, status = 200) => Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
  if (!isLegalReleaseEnabled()) return respond("Service non activé.", 404);
  try {
    if (request.headers.get("origin") !== new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").origin) return respond("Origine invalide.", 403);
    const body = await request.json();
    if (body.confirmed !== true) return respond("Confirmez explicitement votre rétractation.", 400);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const receiptEmail = typeof body.receiptEmail === "string" ? body.receiptEmail.trim().toLowerCase() : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    if (!name || name.length > 200 || !/^cs_[a-zA-Z0-9_]{5,250}$/.test(sessionId) || [email, receiptEmail].some((value) => value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) return respond("Vérifiez vos coordonnées et la référence de commande.", 400);
    const db = createSupabaseServerClient();
    const { data: order, error } = await db.from("commercial_orders_v1").select("session_id").eq("session_id", sessionId).eq("email", email).not("paid_at", "is", null).maybeSingle();
    if (error) throw error;
    const generic = "Si ces informations correspondent à une commande payée, votre déclaration est enregistrée et un accusé est envoyé. Sinon, vérifiez la référence ou contactez contact@marined-communication.fr.";
    if (!order) return respond(generic);
    const declaration = "Je vous notifie ma rétractation du contrat Brand Studio correspondant à cette commande.";
    const { error: insertError } = await db.from("commercial_withdrawals_v1").upsert({ session_id: sessionId, customer_name: name, receipt_email: receiptEmail, declaration }, { onConflict: "session_id", ignoreDuplicates: true });
    if (insertError) throw insertError;
    const { data: withdrawal, error: readError } = await db.from("commercial_withdrawals_v1").select("*").eq("session_id", sessionId).single();
    if (readError || !withdrawal) throw readError ?? new Error("Missing declaration");
    if (!withdrawal.receipt_sent_at) {
      await sendWithdrawalReceipt({ email: withdrawal.receipt_email, text: `${withdrawal.declaration}\nNom : ${withdrawal.customer_name}\nCommande : ${sessionId}\nDate et heure de réception : ${withdrawal.received_at}\nVotre déclaration est enregistrée. Contact : contact@marined-communication.fr` });
      const { error: updateError } = await db.from("commercial_withdrawals_v1").update({ receipt_sent_at: new Date().toISOString() }).eq("session_id", sessionId);
      if (updateError) throw updateError;
    }
    return respond(generic);
  } catch {
    return respond("Votre déclaration a pu être enregistrée, mais l’accusé n’a pas pu être confirmé. Réessayez avec la même référence ou contactez contact@marined-communication.fr.", 503);
  }
}
