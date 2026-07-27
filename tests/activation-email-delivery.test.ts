import { describe, expect, it, vi } from "vitest";
import { sendWithImmediateRetry } from "../lib/activation-email-retry";

describe("activation email delivery", () => {
  it("retries immediately until Brevo accepts the message", async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValue(undefined);
    const pause = vi.fn().mockResolvedValue(undefined);

    await expect(sendWithImmediateRetry(send, [0, 1_000, 3_000], pause)).resolves.toEqual({ attempts: 3 });
    expect(send).toHaveBeenCalledTimes(3);
    expect(pause).toHaveBeenNthCalledWith(1, 1_000);
    expect(pause).toHaveBeenNthCalledWith(2, 3_000);
  });

  it("keeps the failure visible after every immediate retry fails", async () => {
    const send = vi.fn().mockRejectedValue(new Error("Brevo unavailable"));
    await expect(sendWithImmediateRetry(send, [0, 1], async () => undefined))
      .rejects.toThrow("Brevo unavailable");
    expect(send).toHaveBeenCalledTimes(2);
  });
});
