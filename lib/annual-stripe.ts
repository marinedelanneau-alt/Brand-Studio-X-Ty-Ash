import "server-only";
import { getStripe } from "./stripe";

// Each Vercel environment must use its own Stripe keys AND Supabase project.
export function annualLiveMode() {
  const mode = process.env.STRIPE_MODE;
  if (mode !== "test" && mode !== "live") throw new Error("STRIPE_MODE must be test or live");
  const live = mode === "live";
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key.startsWith(live ? "sk_live_" : "sk_test_")) throw new Error("Stripe key/mode mismatch");
  if (process.env.VERCEL_ENV === "production" && !live) throw new Error("Test payments forbidden in Production");
  if (live && (process.env.VERCEL_ENV !== "production" || process.env.STRIPE_LIVE_PAYMENTS_APPROVED !== "yes")) {
    throw new Error("Live payments not approved for this environment");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Server service role required");
  const testProject = process.env.STRIPE_TEST_SUPABASE_PROJECT_REF;
  const liveProject = process.env.STRIPE_LIVE_SUPABASE_PROJECT_REF;
  const actualProject = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname.split(".")[0];
  if (!liveProject || (!live && !testProject) || testProject === liveProject
    || actualProject !== (live ? liveProject : testProject)) throw new Error("Supabase payment environment mismatch");
  return live;
}

export function getAnnualStripe() {
  annualLiveMode();
  return getStripe();
}
