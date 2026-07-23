import { describe, expect, it } from "vitest";
import { createStripeReturnUrl } from "../lib/stripe-return-url";

describe("Stripe return URLs", () => {
  it("uses the public request origin for checkout redirects", () => {
    const requestUrl =
      "https://brand-studio-new.vercel.app/api/stripe/create-checkout-session";

    expect(createStripeReturnUrl(requestUrl, "/?payment=success")).toBe(
      "https://brand-studio-new.vercel.app/?payment=success",
    );
    expect(
      createStripeReturnUrl(requestUrl, "/pricing?payment=cancelled"),
    ).toBe(
      "https://brand-studio-new.vercel.app/pricing?payment=cancelled",
    );
  });

  it("supports local checkout without a configured site URL", () => {
    expect(
      createStripeReturnUrl(
        "http://localhost:3000/api/stripe/create-checkout-session",
        "/dashboard",
      ),
    ).toBe("http://localhost:3000/dashboard");
  });

  it("rejects non-web request URLs", () => {
    expect(() =>
      createStripeReturnUrl("file:///tmp/checkout", "/dashboard"),
    ).toThrow("HTTP or HTTPS");
  });
});
