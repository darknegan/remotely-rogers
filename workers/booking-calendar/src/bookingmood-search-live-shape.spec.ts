import { describe, expect, it, vi } from 'vitest';

import { buildAvailabilityResponse } from './availability';
import liveShape from './fixtures/bookingmood-search-dec-2026-live-shape.json';
import { BookingmoodClient } from './bookingmood-client';
import { normalizeSearchResults, stayTotalDollarsFromSearch } from './bookingmood-search';

const PRODUCT_ID = '936c1ff7-2900-410b-9ced-cc2cf6ec3b65';
const CAPACITY = 'f8558449-6548-4559-8f5d-31448942969d';

describe('live Bookingmood search response shapes', () => {
  it('reads product id from nested product when top-level id is absent', () => {
    const rows = normalizeSearchResults(liveShape.searchNestedProductOnly);
    expect(rows[0]?.productId).toBe(PRODUCT_ID);
    expect(stayTotalDollarsFromSearch(rows[0], 2)?.totalPrice).toBe(264);
  });

  it('unwraps search rows from a results envelope', () => {
    const rows = normalizeSearchResults(liveShape.searchWrappedEnvelope);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.productId).toBe(PRODUCT_ID);
    expect(stayTotalDollarsFromSearch(rows[0], 2)?.totalPrice).toBe(264);
  });

  it('maps nested-product search hits onto availability cabin pricing', async () => {
    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT_ID,
          intervals: [{ start: '2026-12-07', end: '2026-12-10', status: 'available' }],
        },
      ]),
      search: vi
        .fn()
        .mockResolvedValue(normalizeSearchResults(liveShape.searchNestedProductOnly)),
      listCapacityGroups: vi.fn(),
      cartValidate: vi.fn(),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-12-07', departure: '2026-12-09', adults: 2 },
      client,
      {
        ASSETS: {} as Fetcher,
        BOOKINGMOOD_API_KEY: 'test',
        BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT_ID }),
        BOOKINGMOOD_CAPACITY_GROUP_ID: CAPACITY,
      },
      'https://example.com',
    );

    const cabin = result.cabins.find((c) => c.cabinId === 1)!;
    expect(cabin.totalPrice).toBe(264);
    expect(cabin.nightlyRate).toBe(132);
    expect(client.cartValidate).not.toHaveBeenCalled();
  });

  it('normalizes nested search rows inside BookingmoodClient.search', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(liveShape.searchNestedProductOnly), { status: 200 }),
    );
    const client = new BookingmoodClient('test-key', fetchImpl);
    const rows = await client.search({
      interval: { start: '2026-12-07', end: '2026-12-09' },
      productIds: [PRODUCT_ID],
      occupancy: {},
    });

    expect(rows[0]?.productId).toBe(PRODUCT_ID);
    expect(rows[0]?.price).toEqual({ min: 26400, max: 26400 });
  });
});