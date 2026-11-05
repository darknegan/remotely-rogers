import { HttpError } from './bookingmood-client';

const ALLOWED_PAYMENT_HOSTS = ['bookingmood.com', 'www.bookingmood.com', 'pay.bookingmood.com'];

/** Accept empty payment URLs; otherwise require HTTPS on an allowlisted host. */
export function sanitizePaymentUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new HttpError(502, 'Bookingmood returned an invalid payment URL.');
  }

  if (url.protocol !== 'https:') {
    throw new HttpError(502, 'Bookingmood payment URL must use HTTPS.');
  }

  const host = url.hostname.toLowerCase();
  const allowed = ALLOWED_PAYMENT_HOSTS.some(
    (candidate) => host === candidate || host.endsWith(`.${candidate}`),
  );
  if (!allowed) {
    throw new HttpError(502, 'Bookingmood payment URL host is not allowlisted.');
  }

  return url.toString();
}
