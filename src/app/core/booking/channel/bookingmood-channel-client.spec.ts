import { describe, expect, it, vi } from 'vitest';

import {
  BookingmoodChannelClient,
  BookingmoodChannelError,
  mapChannelErrorResponse,
} from './bookingmood-channel-client';
import {
  assertBookingmoodChannelAllowed,
  DEV_BOOKINGMOOD_CHANNEL_ID,
  PRODUCTION_EMBED_CHANNEL_ID,
} from './bookingmood-channel-allowlist';
import {
  BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED,
  ChannelCheckoutDisabledError,
} from './bookingmood-channel-checkout-gate';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('bookingmood channel allowlist', () => {
  it('accepts only the dev custom widget channel', () => {
    expect(() => assertBookingmoodChannelAllowed(DEV_BOOKINGMOOD_CHANNEL_ID)).not.toThrow();
  });

  it('rejects the production embed channel and unknown ids', () => {
    expect(() => assertBookingmoodChannelAllowed(PRODUCTION_EMBED_CHANNEL_ID)).toThrow();
    expect(() => assertBookingmoodChannelAllowed('00000000-0000-0000-0000-000000000000')).toThrow();
  });
});

describe('mapChannelErrorResponse', () => {
  it('maps 403 channel_not_bookable', () => {
    const err = mapChannelErrorResponse(403, {
      code: 'channel_not_bookable',
      message: "This channel doesn't accept bookings",
    });
    expect(err).toBeInstanceOf(BookingmoodChannelError);
    expect(err.code).toBe('channel_not_bookable');
    expect(err.status).toBe(403);
  });

  it('maps 429 rate limit', () => {
    const err = mapChannelErrorResponse(429, { code: 'rate_limited' });
    expect(err.status).toBe(429);
  });
});

describe('BookingmoodChannelClient', () => {
  it('builds validate requests with cart items', async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          id: 'item-1',
          valid: false,
          availabilityMatch: true,
          occupancyMatch: true,
        },
      ]),
    );
    const client = new BookingmoodChannelClient(fetch);

    await client.validateCart(DEV_BOOKINGMOOD_CHANNEL_ID, [
      {
        id: 'item-1',
        product_id: '936c1ff7-2900-410b-9ced-cc2cf6ec3b65',
        interval: { start: '2026-12-11', end: '2026-12-14' },
        occupancy: { 'f8558449-6548-4559-8f5d-31448942969d': 2 },
        form_values: {},
      },
    ]);

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/channels/${DEV_BOOKINGMOOD_CHANNEL_ID}/cart/validate`);
    const body = JSON.parse(String(init.body));
    expect(body.items[0].interval.start).toBe('2026-12-11');
  });

  it('never calls checkout network when booking gate is off', async () => {
    expect(BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED).toBe(false);
    const fetch = vi.fn();
    const client = new BookingmoodChannelClient(fetch);

    expect(() =>
      client.cartCheckout(DEV_BOOKINGMOOD_CHANNEL_ID, [
        {
          id: 'item-1',
          product_id: '936c1ff7-2900-410b-9ced-cc2cf6ec3b65',
          interval: { start: '2026-12-11', end: '2026-12-14' },
          occupancy: { 'f8558449-6548-4559-8f5d-31448942969d': 2 },
          form_values: {},
        },
      ]),
    ).toThrow(ChannelCheckoutDisabledError);

    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses disallowed channel ids before fetch', async () => {
    const fetch = vi.fn();
    const client = new BookingmoodChannelClient(fetch);
    await expect(client.getChannel(PRODUCTION_EMBED_CHANNEL_ID)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});