import {
  assertBookingmoodChannelAllowed,
  BookingmoodChannelAllowlistError,
} from './bookingmood-channel-allowlist';
import {
  assertChannelCheckoutEnabled,
  ChannelCheckoutDisabledError,
} from './bookingmood-channel-checkout-gate';
import {
  BookingmoodBookingRecord,
  BookingmoodCartItemRequest,
  BookingmoodCartValidateItem,
  BookingmoodChannelErrorBody,
  BookingmoodChannelPayload,
  BookingmoodCheckoutResult,
  BookingmoodProductAvailability,
} from './bookingmood-channel.types';

export const BOOKINGMOOD_PUBLIC_API_BASE = 'https://www.bookingmood.com/api/public/v1';

export type BookingmoodPublicFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class BookingmoodChannelError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'BookingmoodChannelError';
  }
}

export function mapChannelErrorResponse(status: number, body: unknown): BookingmoodChannelError {
  const record = (body ?? {}) as BookingmoodChannelErrorBody;
  const code = typeof record.code === 'string' ? record.code : `http_${status}`;
  const message =
    typeof record.message === 'string' ? record.message : `Bookingmood channel request failed (${status}).`;
  return new BookingmoodChannelError(status, code, message);
}

function defaultFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return globalThis.fetch(input, init);
}

/**
 * Single module for the pre-release Bookingmood **public channel** API (browser / publishable key only).
 */
export class BookingmoodChannelClient {
  constructor(private readonly fetchImpl: BookingmoodPublicFetch = defaultFetch) {}

  private async requestJson<T>(
    channelId: string,
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    assertBookingmoodChannelAllowed(channelId);

    const response = await this.fetchImpl(`${BOOKINGMOOD_PUBLIC_API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = text;
      }
    }

    if (response.status === 429) {
      throw mapChannelErrorResponse(429, body ?? { code: 'rate_limited', message: 'Too many requests.' });
    }

    if (!response.ok) {
      throw mapChannelErrorResponse(response.status, body);
    }

    return body as T;
  }

  getChannel(channelId: string): Promise<BookingmoodChannelPayload> {
    return this.requestJson<BookingmoodChannelPayload>(channelId, `/channels/${channelId}`, {
      method: 'GET',
    });
  }

  getAvailability(channelId: string, productIds: string[]): Promise<BookingmoodProductAvailability[]> {
    const params = new URLSearchParams();
    for (const id of productIds) {
      params.append('product_ids', id);
    }
    return this.requestJson<BookingmoodProductAvailability[]>(
      channelId,
      `/channels/${channelId}/availability?${params.toString()}`,
      { method: 'GET' },
    );
  }

  validateCart(
    channelId: string,
    items: BookingmoodCartItemRequest[],
  ): Promise<BookingmoodCartValidateItem[]> {
    return this.requestJson<BookingmoodCartValidateItem[]>(
      channelId,
      `/channels/${channelId}/cart/validate`,
      {
        method: 'POST',
        body: JSON.stringify({ items }),
      },
    );
  }

  /**
   * Creates a real booking. Gated by {@link BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED}; throws before any network I/O when off.
   */
  cartCheckout(
    channelId: string,
    items: BookingmoodCartItemRequest[],
  ): Promise<BookingmoodCheckoutResult> {
    assertChannelCheckoutEnabled();
    return this.requestJson<BookingmoodCheckoutResult>(channelId, `/channels/${channelId}/cart/checkout`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  getBooking(bookingId: string, secret: string): Promise<BookingmoodBookingRecord> {
    return this.fetchImpl(`${BOOKINGMOOD_PUBLIC_API_BASE}/bookings/${bookingId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${secret}`,
      },
    }).then(async (response) => {
      const text = await response.text();
      const body = text ? (JSON.parse(text) as unknown) : null;
      if (!response.ok) {
        throw mapChannelErrorResponse(response.status, body);
      }
      return body as BookingmoodBookingRecord;
    });
  }

  payBooking(bookingId: string, secret: string): Promise<{ payment_url?: string | null }> {
    assertChannelCheckoutEnabled();
    return this.fetchImpl(`${BOOKINGMOOD_PUBLIC_API_BASE}/bookings/${bookingId}/pay`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${secret}`,
      },
    }).then(async (response) => {
      const text = await response.text();
      const body = text ? (JSON.parse(text) as unknown) : null;
      if (!response.ok) {
        throw mapChannelErrorResponse(response.status, body);
      }
      return body as { payment_url?: string | null };
    });
  }

  cancelBooking(bookingId: string, secret: string): Promise<void> {
    assertChannelCheckoutEnabled();
    return this.fetchImpl(`${BOOKINGMOOD_PUBLIC_API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${secret}`,
      },
    }).then(async (response) => {
      if (response.status === 429) {
        throw mapChannelErrorResponse(429, { code: 'rate_limited' });
      }
      if (!response.ok) {
        const text = await response.text();
        let body: unknown = null;
        try {
          body = text ? JSON.parse(text) : null;
        } catch {
          body = text;
        }
        throw mapChannelErrorResponse(response.status, body);
      }
    });
  }
}

export {
  assertBookingmoodChannelAllowed,
  BookingmoodChannelAllowlistError,
  assertChannelCheckoutEnabled,
  ChannelCheckoutDisabledError,
};