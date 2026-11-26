import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAvailabilityResponse } from './availability';
import type { BookingmoodClient } from './bookingmood-client';

import { resetCapacityGroupCacheForTests } from './bookingmood-occupancy';

const PRODUCT = '11111111-1111-4111-8111-111111111111';
const CAPACITY = 'f8558449-6548-4559-8f5d-31448942969d';

describe('buildAvailabilityResponse', () => {
  beforeEach(() => {
    resetCapacityGroupCacheForTests();
  });

  it('marks cabins unavailable on provider errors (never falsely available)', async () => {
    const client = {
      getAvailability: vi.fn().mockRejectedValue(new Error('upstream down')),
      search: vi.fn(),
      listCapacityGroups: vi.fn(),
      cartValidate: vi.fn(),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-07-01', departure: '2026-07-03', adults: 2 },
      client,
      {
        ASSETS: {} as Fetcher,
        BOOKINGMOOD_API_KEY: 'test',
        BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT }),
      },
      'https://example.com',
    );

    expect(result.cabins.find((c) => c.cabinId === 1)?.available).toBe(false);
    expect(result.cabins.find((c) => c.cabinId === 1)?.availabilityState).toBe('error');
    expect(client.search).not.toHaveBeenCalled();
  });

  it('spreads search stay price across per-night dayRates', async () => {
    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT,
          intervals: [
            { start: '2026-07-01', end: '2026-07-03', status: 'available' },
          ],
        },
      ]),
      search: vi.fn().mockResolvedValue([
        {
          productId: PRODUCT,
          match: true,
          availability: 'available',
          occupancyMatches: true,
          optionsMatch: true,
          price: { min: 26_400, max: 26_400 },
        },
      ]),
      listCapacityGroups: vi.fn(),
      cartValidate: vi.fn(),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-07-01', departure: '2026-07-03', adults: 2 },
      client,
      {
        ASSETS: {} as Fetcher,
        BOOKINGMOOD_API_KEY: 'test',
        BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT }),
        BOOKINGMOOD_CAPACITY_GROUP_ID: CAPACITY,
      },
      'https://example.com',
    );

    const cabin = result.cabins.find((c) => c.cabinId === 1)!;
    expect(cabin.nightlyRate).toBe(132);
    expect(cabin.totalPrice).toBe(264);
    expect(cabin.dayRates['2026-07-01']?.price).toBe(132);
    expect(cabin.dayRates['2026-07-02']?.price).toBe(132);
    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({
        occupancy: {},
      }),
    );
    expect(client.cartValidate).not.toHaveBeenCalled();
  });

  it('falls back to cart-validate when search returns no price', async () => {
    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT,
          intervals: [{ start: '2026-12-07', end: '2026-12-10', status: 'available' }],
        },
      ]),
      search: vi.fn().mockResolvedValue([
        {
          productId: PRODUCT,
          match: true,
          availability: 'available',
          occupancyMatches: true,
          optionsMatch: true,
          price: null,
        },
      ]),
      listCapacityGroups: vi.fn().mockResolvedValue([{ id: CAPACITY }]),
      cartValidate: vi.fn().mockResolvedValue([
        {
          id: 'quote-1',
          valid: true,
          availabilityMatch: true,
          occupancyMatch: true,
          price: { currency: 'USD', subtotal: 26_400, tax: 0, total: 26_400, deposit: 0 },
        },
      ]),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-12-07', departure: '2026-12-09', adults: 2 },
      client,
      {
        ASSETS: {} as Fetcher,
        BOOKINGMOOD_API_KEY: 'test',
        BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT }),
      },
      'https://example.com',
    );

    const cabin = result.cabins.find((c) => c.cabinId === 1)!;
    expect(cabin.nightlyRate).toBe(132);
    expect(cabin.totalPrice).toBe(264);
    expect(client.cartValidate).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            occupancy: { [CAPACITY]: 2 },
          }),
        ]),
      }),
    );
  });

  it('uses cart occupancy on validate even when search sends an empty occupancy map', async () => {
    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT,
          intervals: [{ start: '2026-12-07', end: '2026-12-10', status: 'available' }],
        },
      ]),
      search: vi.fn().mockResolvedValue([]),
      listCapacityGroups: vi.fn().mockResolvedValue([{ id: CAPACITY }]),
      cartValidate: vi.fn().mockResolvedValue([
        {
          id: 'quote-1',
          valid: true,
          availabilityMatch: true,
          occupancyMatch: true,
          price: { currency: 'USD', subtotal: 26_400, tax: 0, total: 26_400, deposit: 0 },
        },
      ]),
    } as unknown as BookingmoodClient;

    await buildAvailabilityResponse(
      { arrival: '2026-12-07', departure: '2026-12-09', adults: 2 },
      client,
      {
        ASSETS: {} as Fetcher,
        BOOKINGMOOD_API_KEY: 'test',
        BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT }),
        BOOKINGMOOD_CAPACITY_GROUP_ID: CAPACITY,
      },
      'https://example.com',
    );

    expect(client.search).toHaveBeenCalledWith(expect.objectContaining({ occupancy: {} }));
    expect(client.cartValidate).toHaveBeenCalled();
  });
});
