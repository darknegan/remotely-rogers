import { describe, expect, it, vi, beforeEach } from 'vitest';

import { BOOKINGMOOD_PRODUCT_IDS } from '../../../src/app/core/booking/bookingmood-products';
import { buildAvailabilityResponse } from './availability';
import { quoteStaySubtotalsViaCartValidate } from './availability-pricing';
import { resetCapacityGroupCacheForTests } from './bookingmood-occupancy';
import { normalizeEnvUuid } from './bookingmood-capacity-env';
import searchFixture from './fixtures/bookingmood-search-dec-2026-raw.json';
import cartValidateFixture from './fixtures/bookingmood-cart-validate-dec-2026-raw.json';
import { BookingmoodClient } from './bookingmood-client';
import { normalizeSearchResults, stayTotalDollarsFromSearch } from './bookingmood-search';
import { readCartValidateSubtotalCents } from './bookingmood-cart-validate';

const CAPACITY = 'f8558449-6548-4559-8f5d-31448942969d';
const PRODUCT_IDS = Object.values(BOOKINGMOOD_PRODUCT_IDS);
const INTERVAL = { start: '2026-12-07', end: '2026-12-09' };

describe('captured Bookingmood worker fixtures (Dec 2026)', () => {
  it('records live search response shape metadata', () => {
    const shape = searchFixture.responseShape;
    expect(shape.responseIsArray).toBe(true);
    expect(shape.wrappedIn).toBeNull();
    expect(shape.rowCount).toBeGreaterThanOrEqual(1);
    expect(shape.hasTopLevelProductId).toBe(true);
    expect(shape.hasNestedProductId).toBe(true);
  });

  it('prices all mapped cabins from captured search via BookingmoodClient.search', async () => {
    const fetchImpl = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(searchFixture.responseBody), { status: 200 })),
    );
    const client = new BookingmoodClient('fixture-key', fetchImpl);

    const rows = await client.search({
      interval: INTERVAL,
      productIds: PRODUCT_IDS,
      occupancy: {},
    });

    const posted = JSON.parse(String((fetchImpl.mock.calls[0]?.[1] as RequestInit).body));
    expect(posted).toEqual(searchFixture.requestBody);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    for (const row of rows.filter((r) => PRODUCT_IDS.includes(r.productId))) {
      expect(stayTotalDollarsFromSearch(row, 2)?.totalPrice).toBe(264);
    }
  });

  it('reads cart-validate subtotal from captured validate fixture', () => {
    const rows = cartValidateFixture.responseBody as unknown[];
    expect(readCartValidateSubtotalCents(rows[0])).toBe(26400);
  });

  it('buildAvailabilityResponse prices cabin 1 from captured search body', async () => {
    const searchRows = normalizeSearchResults(searchFixture.responseBody);
    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT_IDS[0],
          intervals: [{ start: '2026-12-07', end: '2026-12-10', status: 'available' }],
        },
      ]),
      search: vi.fn().mockResolvedValue(searchRows),
      listCapacityGroups: vi.fn(),
      cartValidate: vi.fn(),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: INTERVAL.start, departure: INTERVAL.end, adults: 2 },
      client,
      {
        ASSETS: {} as Fetcher,
        BOOKINGMOOD_API_KEY: 'test',
        BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT_IDS[0] }),
        BOOKINGMOOD_CAPACITY_GROUP_ID: CAPACITY,
      },
      'https://example.com',
    );

    expect(result.cabins.find((c) => c.cabinId === 1)?.totalPrice).toBe(264);
  });
});

describe('silent $0 pricing logs', () => {
  beforeEach(() => {
    resetCapacityGroupCacheForTests();
    vi.restoreAllMocks();
  });

  it('logs bookingmood_search_unmatched when search rows do not match products', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT_IDS[0],
          intervals: [{ start: '2026-12-07', end: '2026-12-10', status: 'available' }],
        },
      ]),
      search: vi.fn().mockResolvedValue(
        normalizeSearchResults([
          { productId: '', price: { min: 26400, max: 26400 }, match: true, availability: 'available' },
        ]),
      ),
      listCapacityGroups: vi.fn(),
      cartValidate: vi.fn(),
    } as unknown as BookingmoodClient;

    await buildAvailabilityResponse(
      { arrival: INTERVAL.start, departure: INTERVAL.end, adults: 2 },
      client,
      {
        ASSETS: {} as Fetcher,
        BOOKINGMOOD_API_KEY: 'test',
        BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT_IDS[0] }),
        BOOKINGMOOD_CAPACITY_GROUP_ID: CAPACITY,
      },
      'https://example.com',
    );

    expect(info).toHaveBeenCalledWith(
      'bookingmood_search_unmatched',
      expect.objectContaining({
        searchRowCount: 1,
        searchRowsWithoutProductId: 1,
        unmatchedStayAvailableCabinCount: 1,
      }),
    );
  });

  it('logs bookingmood_quote_skipped_no_occupancy when occupancy is empty', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    await quoteStaySubtotalsViaCartValidate(
      { cartValidate: vi.fn() } as unknown as BookingmoodClient,
      { ASSETS: {} as Fetcher, BOOKINGMOOD_CAPACITY_GROUP_ID: 'not-a-uuid' },
      INTERVAL.start,
      INTERVAL.end,
      {},
      [{ cabinId: 1, productId: PRODUCT_IDS[0]! }],
    );

    expect(info).toHaveBeenCalledWith(
      'bookingmood_quote_skipped_no_occupancy',
      expect.objectContaining({
        capacityGroupIdConfigured: true,
        capacityGroupIdLooksLikeUuid: false,
        lineCount: 1,
      }),
    );
  });

  it('logs bookingmood_quote_no_subtotal when validate rows omit price', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    await quoteStaySubtotalsViaCartValidate(
      {
        cartValidate: vi.fn().mockResolvedValue([{ id: 'quote-1', valid: true }]),
      } as unknown as BookingmoodClient,
      {
        ASSETS: {} as Fetcher,
        BOOKINGMOOD_CAPACITY_GROUP_ID: CAPACITY,
      },
      INTERVAL.start,
      INTERVAL.end,
      { [CAPACITY]: 2 },
      [{ cabinId: 1, productId: PRODUCT_IDS[0]! }],
    );

    expect(info).toHaveBeenCalledWith(
      'bookingmood_quote_no_subtotal',
      expect.objectContaining({
        productId: PRODUCT_IDS[0],
        responseKeys: expect.arrayContaining(['id', 'valid']),
      }),
    );
  });
});

describe('normalizeEnvUuid', () => {
  it('trims whitespace and surrounding quotes from capacity group env', () => {
    expect(normalizeEnvUuid(`  "${CAPACITY}"  `)).toBe(CAPACITY);
    expect(normalizeEnvUuid(`  ${CAPACITY}  `)).toBe(CAPACITY);
  });
});