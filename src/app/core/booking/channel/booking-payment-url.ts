const ALLOWED_PAYMENT_HOSTS = new Set(['bookingmood.com', 'www.bookingmood.com', 'pay.bookingmood.com']);

/** Stripe checkout is only ever a redirect to Bookingmood-hosted payment URLs. */
export function assertAllowedPaymentUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid payment URL.');
  }

  const host = parsed.hostname.toLowerCase();
  const allowed = [...ALLOWED_PAYMENT_HOSTS].some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
  if (!allowed) {
    throw new Error(`Payment URL host is not allowed: ${host}`);
  }

  return parsed.toString();
}