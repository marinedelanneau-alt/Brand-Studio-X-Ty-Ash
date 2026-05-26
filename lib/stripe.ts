import "server-only";

import Stripe from "stripe";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(secretKey);
}

export function getStripeCheckoutMode(): "payment" | "subscription" {
  const mode = process.env.STRIPE_CHECKOUT_MODE ?? "payment";

  if (mode !== "payment" && mode !== "subscription") {
    throw new Error("STRIPE_CHECKOUT_MODE must be payment or subscription");
  }

  return mode;
}
