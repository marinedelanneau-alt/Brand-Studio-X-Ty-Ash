export function createStripeReturnUrl(requestUrl: string, path: string) {
  const request = new URL(requestUrl);

  if (request.protocol !== "http:" && request.protocol !== "https:") {
    throw new Error("Checkout request URL must use HTTP or HTTPS");
  }

  return new URL(path, request.origin).toString();
}
