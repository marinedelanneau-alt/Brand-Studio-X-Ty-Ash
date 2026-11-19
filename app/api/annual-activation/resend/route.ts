import { after } from "next/server";
import { normalizePurchaseEmail } from "@/lib/annual-guest-security";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deliverAnnualWelcome } from "@/lib/annual-activation";
import { annualLiveMode } from "@/lib/annual-stripe";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Origine invalide." }, { status: 403 });
  let email: string | null = null;
  try { email = normalizePurchaseEmail((await request.json()).email); } catch { /* Same public response for every address. */ }
  // Keep account existence and provider timing outside the public response.
  after(async () => {
    if (!email) return;
    try {
      const { data, error } = await createSupabaseServerClient().from("annual_payments").select("id")
        .eq("purchase_email", email).eq("live_mode", annualLiveMode()).eq("status", "paid").eq("fulfillment_state", "ready")
        .eq("activation_required", true).is("password_initialized_at", null).gt("expires_at", new Date().toISOString()).limit(1).maybeSingle();
      if (!error && data) await deliverAnnualWelcome(data.id, true);
    } catch { console.error("[annual-activation] Resend unavailable"); }
  });
  return Response.json({ message: "Si un accès payé peut être activé avec cette adresse, un e-mail vous sera envoyé." }, { headers: { "Cache-Control": "no-store" } });
}
