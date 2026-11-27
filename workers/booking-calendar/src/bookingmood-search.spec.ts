import { describe, expect, it } from 'vitest';

import { normalizeSearchResults, stayTotalDollarsFromSearch } from './bookingmood-search';

describe('normalizeSearchResults', () => {
  it('accepts camelCase productId and price in cents', () => {
    const rows = normalizeSearchResults([
      {
        productId: '936c1ff7-2900-410b-9ced-cc2cf6ec3b65',
        match: true,
        occupancyMatches: true,
        optionsMatch: true,
        availability: 'available',
        price: { min: 26_400, max: 26_400 },
      },
    ]);

    expect(rows[0]?.productId).toBe('936c1ff7-2900-410b-9ced-cc2cf6ec3b65');
    expect(rows[0]?.price).toEqual({ min: 26_400, max: 26_400 });
  });

  it('maps snake_case product_id from PostgREST payloads', () => {
    const rows = normalizeSearchResults([
      {
        product_id: '11111111-1111-4111-8111-111111111111',
        match: true,
        price: { min: 13_200, max: 13_200 },
      },
    ]);

    expect(rows[0]?.productId).toBe('11111111-1111-4111-8111-111111111111');
  });
});

describe('stayTotalDollarsFromSearch', () => {
  it('converts total cents to dollars and nightly rate', () => {
    const priced = stayTotalDollarsFromSearch(
      {
        productId: 'x',
        match: true,
        availability: 'available',
        occupancyMatches: true,
        optionsMatch: true,
        price: { min: 26_400, max: 26_400 },
      },
      2,
    );
    expect(priced?.totalPrice).toBe(264);
    expect(priced?.nightlyRate).toBe(132);
  });

  it('returns null when price is missing', () => {
    expect(
      stayTotalDollarsFromSearch(
        {
          productId: 'x',
          match: true,
          availability: 'available',
          occupancyMatches: false,
          optionsMatch: true,
          price: null,
        },
        2,
      ),
    ).toBeNull();
  });
});