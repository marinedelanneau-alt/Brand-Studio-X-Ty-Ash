import { expect, it, vi } from "vitest";
const stripe = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: stripe.create }));
import { POST } from "../app/api/stripe/create-brand-studio-order/route";
it("closes the historical 289 EUR endpoint without creating a charge", async () => {
  expect((await POST()).status).toBe(410);
  expect(stripe.create).not.toHaveBeenCalled();
});
