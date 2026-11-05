import { describe, expect, it, vi } from 'vitest';

import { isBookingWriteEnabled } from './booking-config';
import { createBookingCheckout } from './checkout';
import { buildAvailabilityResponse } from './availability';
import {
  isStayAvailable,
  mapAvailabilityRowsToDays,
} from './bookingmood-interval-map';
import { handleBookingmoodWebhook } from './bookingmood-webhook';
import type { BookingmoodClient } from './bookingmood-client';
import { eachNight, parseDateKey } from '../../../src/app/core/utils/date-utils';

const PRODUCT = '11111111-1111-4111-8111-111111111111';
const CAPACITY = '22222222-2222-4222-8222-222222222222';
const SERVICE = '33333333-3333-4333-8333-333333333333';

const baseWriteEnv = {
  ASSETS: {} as Fetcher,
  BOOKING_STATE: {} as KVNamespace,
  BOOKING_COORDINATOR: {} as DurableObjectNamespace,
  BOOKINGMOOD_API_KEY: 'test',
  BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT }),
  BOOKINGMOOD_CAPACITY_GROUP_ID: CAPACITY,
  BOOKINGMOOD_FORM_SERVICES: JSON.stringify({
    firstName: SERVICE,
    lastName: SERVICE,
    email: SERVICE,
  }),
};

describe('BOOKINGMOOD_BOOKING_ENABLED write gate', () => {
  it.each([
    ['absent', undefined],
    ['empty', ''],
    ['false string', 'false'],
    ['malformed', 'yes'],
    ['numeric', '1'],
  ] as const)('isBookingWriteEnabled is false when flag is %s', (_label, flag) => {
    expect(
      isBookingWriteEnabled({
        ...baseWriteEnv,
        BOOKINGMOOD_BOOKING_ENABLED: flag,
      }),
    ).toBe(false);
  });

  it('isBookingWriteEnabled is true only when flag is explicitly true and prereqs hold', () => {
    expect(
      isBookingWriteEnabled({
        ...baseWriteEnv,
        BOOKINGMOOD_BOOKING_ENABLED: 'true',
      }),
    ).toBe(true);
    expect(
      isBookingWriteEnabled({
        ...baseWriteEnv,
        BOOKINGMOOD_BOOKING_ENABLED: '  TRUE  ',
      }),
    ).toBe(true);
  });

  it('POST checkout rejects before cart calls when flag is false', async () => {
    const cartValidate = vi.fn();
    const cartCheckout = vi.fn();
    const client = { cartValidate, cartCheckout } as unknown as BookingmoodClient;

    await expect(
      createBookingCheckout(
        {
          guest: { firstName: 'A', lastName: 'B', email: 'a@example.com' },
          adults: 2,
          cabins: [{ cabinId: 1, arrival: '2026-07-01', departure: '2026-07-03' }],
        },
        client,
        { ...baseWriteEnv, BOOKINGMOOD_BOOKING_ENABLED: 'false' },
        'https://example.com',
      ),
    ).rejects.toMatchObject({ status: 503 });

    expect(cartValidate).not.toHaveBeenCalled();
    expect(cartCheckout).not.toHaveBeenCalled();
  });

  it('POST checkout rejects before cart calls when flag is absent (group cart)', async () => {
    const cartValidate = vi.fn();
    const cartCheckout = vi.fn();
    const getAvailability = vi.fn();
    const client = { getAvailability, cartValidate, cartCheckout } as unknown as BookingmoodClient;

    await expect(
      createBookingCheckout(
        {
          guest: { firstName: 'A', lastName: 'B', email: 'a@example.com' },
          adults: 2,
          cabins: [
            { cabinId: 1, arrival: '2026-07-01', departure: '2026-07-03' },
            { cabinId: 2, arrival: '2026-07-05', departure: '2026-07-07' },
          ],
        },
        client,
        baseWriteEnv,
        'https://example.com',
      ),
    ).rejects.toMatchObject({ status: 503 });

    expect(cartValidate).not.toHaveBeenCalled();
    expect(cartCheckout).not.toHaveBeenCalled();
    expect(getAvailability).not.toHaveBeenCalled();
  });

  it('availability bookingEnabled is false when write gate is off despite key and map', async () => {
    const client = {
      getAvailability: vi.fn().mockResolvedValue([]),
      search: vi.fn().mockResolvedValue([]),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-07-01', departure: '2026-07-03', adults: 2 },
      client,
      baseWriteEnv,
      'https://example.com',
    );

    expect(result.bookingEnabled).toBe(false);
  });

  it('missing product availability stays unknown and isStayAvailable is false', () => {
    const nights = eachNight(parseDateKey('2026-06-10'), parseDateKey('2026-06-14'));
    const days = mapAvailabilityRowsToDays([], PRODUCT, nights);
    expect(Object.values(days).every((s) => s === 'unknown')).toBe(true);
    expect(isStayAvailable(days, '2026-06-10', '2026-06-14')).toBe(false);
  });

  it('webhook inactive without signing secret (503)', async () => {
    const req = new Request('https://example.com/api/bookingmood/webhook', {
      method: 'POST',
      body: '{}',
    });
    await expect(
      handleBookingmoodWebhook(req, undefined, {
        BOOKING_STATE: {} as KVNamespace,
        BOOKING_COORDINATOR: {} as DurableObjectNamespace,
      }),
    ).rejects.toMatchObject({ status: 503 });
  });

  it('webhook inactive without BOOKING_STATE (503)', async () => {
    const req = new Request('https://example.com/api/bookingmood/webhook', {
      method: 'POST',
      headers: {
        'webhook-id': 'msg_1',
        'webhook-timestamp': String(Math.floor(Date.now() / 1000)),
        'webhook-signature': 'v1,unused',
      },
      body: '{}',
    });
    await expect(handleBookingmoodWebhook(req, 'test-signing-secret', {})).rejects.toMatchObject({
      status: 503,
    });
  });
});
