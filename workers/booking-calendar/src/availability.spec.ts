import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildAvailabilityResponse, isCabinRangeAvailable } from './availability';
import type { BookingWorkerEnv } from './booking-config';
import type { BookingmoodClient } from './bookingmood-client';

const PRODUCT = '11111111-1111-4111-8111-111111111111';

function env(overrides: Record<string, unknown> = {}): BookingWorkerEnv {
  return {
    ASSETS: {} as Fetcher,
    BOOKINGMOOD_API_KEY: 'test',
    BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT }),
    ...overrides,
  } as BookingWorkerEnv;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildAvailabilityResponse', () => {
  it('marks cabins unavailable on provider errors (never falsely available)', async () => {
    const client = {
      getAvailability: vi.fn().mockRejectedValue(new Error('upstream down')),
      search: vi.fn(),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-07-01', departure: '2026-07-03', adults: 2 },
      client,
      env(),
      'https://example.com',
    );

    expect(result.cabins.find((c) => c.cabinId === 1)?.available).toBe(false);
    expect(result.cabins.find((c) => c.cabinId === 1)?.availabilityState).toBe('error');
    expect(client.search).not.toHaveBeenCalled();
  });

  it('syncs imported iCal feeds and does not call Airbnb', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('Airbnb must not be called');
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT,
          intervals: [
            { start: '2026-11-01T00:00', end: '2026-11-13T00:00', status: 'available' },
            { start: '2026-11-13T00:00', end: '2026-11-16T00:00', status: 'booked' },
            { start: '2026-11-16T00:00', end: '2026-12-01T00:00', status: 'available' },
          ],
        },
      ]),
      search: vi.fn().mockResolvedValue([
        { productId: PRODUCT, price: { min: 20000, max: 20000 } },
      ]),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      client,
      env({
        AIRBNB_PREVIEW_ENABLED: 'true',
        AIRBNB_LISTING_MAP: JSON.stringify({ 1: '1522512039110168394' }),
        AIRBNB_WEB_API_KEY: 'stale-key',
      }),
      'https://example.com',
    );

    expect(client.getAvailability).toHaveBeenCalledWith({
      productIds: [PRODUCT],
      performSync: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();

    const blackGum = result.cabins.find((cabin) => cabin.cabinId === 1)!;
    expect(blackGum.availabilityState).toBe('ok');
    expect(blackGum.days['2026-11-09']).toBe('available');
    expect(blackGum.days['2026-11-13']).toBe('booked');
    expect(blackGum.available).toBe(true);
    expect(blackGum.totalPrice).toBe(200);
    expect(blackGum.nightlyRate).toBeCloseTo(200 / 3);

    const dogwood = result.cabins.find((cabin) => cabin.cabinId === 2)!;
    expect(dogwood.available).toBe(false);
    expect(dogwood.availabilityState).toBe('unconfigured');
  });

  it('keeps checkout enabled when stale Airbnb preview env is still present', async () => {
    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT,
          intervals: [
            { start: '2026-11-09T00:00', end: '2026-11-12T00:00', status: 'available' },
          ],
        },
      ]),
      search: vi.fn().mockResolvedValue([]),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      client,
      env({
        BOOKING_STATE: {} as KVNamespace,
        BOOKING_COORDINATOR: {} as DurableObjectNamespace,
        BOOKINGMOOD_CAPACITY_GROUP_ID: '22222222-2222-4222-8222-222222222222',
        BOOKINGMOOD_FORM_SERVICES: JSON.stringify({
          name: PRODUCT,
          email: '33333333-3333-4333-8333-333333333333',
        }),
        BOOKINGMOOD_BOOKING_ENABLED: 'true',
        AIRBNB_PREVIEW_ENABLED: 'true',
      }),
      'https://example.com',
    );

    expect(result.bookingEnabled).toBe(true);
  });
});

describe('isCabinRangeAvailable', () => {
  it('refreshes the iCal feed and rejects a stay that covers a booked night', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('Airbnb must not be called');
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT,
          intervals: [
            { start: '2026-11-13T00:00', end: '2026-11-16T00:00', status: 'booked' },
          ],
        },
      ]),
    } as unknown as BookingmoodClient;

    const open = await isCabinRangeAvailable(
      client,
      env({
        AIRBNB_PREVIEW_ENABLED: 'true',
        AIRBNB_LISTING_MAP: JSON.stringify({ 1: '1522512039110168394' }),
        AIRBNB_WEB_API_KEY: 'stale-key',
      }),
      1,
      '2026-11-13',
      '2026-11-16',
    );

    expect(open).toBe(false);
    expect(client.getAvailability).toHaveBeenCalledWith({
      productIds: [PRODUCT],
      performSync: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});