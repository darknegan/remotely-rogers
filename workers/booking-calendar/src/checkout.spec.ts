import { beforeAll, describe, expect, it, vi } from 'vitest';

import { createBookingCheckout } from './checkout';
import { BookingmoodClient } from './bookingmood-client';

const cacheStore = new Map<string, Response>();

beforeAll(() => {
  const cache = {
    match: (request: Request) => Promise.resolve(cacheStore.get(request.url)),
    put: (request: Request, response: Response) => {
      cacheStore.set(request.url, response);
      return Promise.resolve();
    },
  };

  (globalThis as typeof globalThis & { caches: CacheStorage }).caches = {
    default: cache as unknown as Cache,
  } as CacheStorage;
});

const PRODUCT = '11111111-1111-4111-8111-111111111111';
const CAPACITY = '22222222-2222-4222-8222-222222222222';
const SERVICE = '33333333-3333-4333-8333-333333333333';

const env = {
  ASSETS: {} as Fetcher,
  BOOKINGMOOD_API_KEY: 'test',
  BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT }),
  BOOKINGMOOD_CAPACITY_GROUP_ID: CAPACITY,
  BOOKINGMOOD_FORM_SERVICES: JSON.stringify({
    firstName: SERVICE,
    lastName: SERVICE,
    email: SERVICE,
  }),
  BOOKINGMOOD_BOOKING_ENABLED: 'true',
};

describe('createBookingCheckout', () => {
  it('rejects invalid cart after validate', async () => {
    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT,
          intervals: [
            { start: '2026-07-01T00:00', end: '2026-07-05T00:00', status: 'available' },
          ],
        },
      ]),
      cartValidate: vi.fn().mockResolvedValue([
        {
          id: 'cabin-1',
          valid: false,
          availabilityMatch: false,
          occupancyMatch: true,
        },
      ]),
      cartCheckout: vi.fn(),
    } as unknown as BookingmoodClient;

    await expect(
      createBookingCheckout(
        {
          guest: { firstName: 'A', lastName: 'B', email: 'a@example.com' },
          adults: 2,
          cabins: [{ cabinId: 1, arrival: '2026-07-01', departure: '2026-07-03' }],
        },
        client,
        env,
        'https://example.com',
      ),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('returns payment url from cart-checkout', async () => {
    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT,
          intervals: [
            { start: '2026-07-01T00:00', end: '2026-07-05T00:00', status: 'available' },
          ],
        },
      ]),
      cartValidate: vi.fn().mockResolvedValue([
        {
          id: 'cabin-1',
          valid: true,
          availabilityMatch: true,
          occupancyMatch: true,
          price: { currency: 'USD', subtotal: 10000, tax: 0, total: 10000, deposit: 0 },
        },
      ]),
      cartCheckout: vi.fn().mockResolvedValue({
        booking_id: 'booking-1',
        reference: 'REF123',
        payment_url: 'https://pay.example/abc',
      }),
    } as unknown as BookingmoodClient;

    const result = await createBookingCheckout(
      {
        guest: { firstName: 'A', lastName: 'B', email: 'a@example.com' },
        adults: 2,
        cabins: [{ cabinId: 1, arrival: '2026-07-01', departure: '2026-07-03' }],
      },
      client,
      env,
      'https://example.com',
    );

    expect(result.paymentUrl).toBe('https://pay.example/abc');
    expect(result.reference).toBe('REF123');
  });
});
