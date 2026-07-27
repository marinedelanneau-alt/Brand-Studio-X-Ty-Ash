export const IMMEDIATE_RETRY_DELAYS_MS = [0, 1_000, 3_000, 8_000];

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function sendWithImmediateRetry(
  send: () => Promise<void>,
  delays = IMMEDIATE_RETRY_DELAYS_MS,
  pause: (milliseconds: number) => Promise<unknown> = wait,
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    const delay = delays[attempt];
    if (delay > 0) await pause(delay);
    try {
      await send();
      return { attempts: attempt + 1 };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Échec définitif de l’envoi d’activation");
}
