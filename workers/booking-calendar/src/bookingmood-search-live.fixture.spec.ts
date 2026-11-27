import { describe, expect, it } from 'vitest';

import searchFixture from './fixtures/bookingmood-search-dec-2026.json';
import { normalizeSearchResults, stayTotalDollarsFromSearch } from './bookingmood-search';

/**
 * Captured read-only against live Bookingmood (Dec 7–9 2026, six-cabin org).
 * Non-empty search `occupancy` with the manual capacity group UUID returned `[]`;
 * empty `occupancy: {}` returned priced rows with `occupancyMatches: true`.
 */
describe('bookingmood search occupancy (live fixture)', () => {
  it('prices when occupancy filter is empty', () => {
    const rows = normalizeSearchResults(searchFixture.searchWithoutOccupancyFilter);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.occupancyMatches).toBe(true);
    expect(rows[0]?.match).toBe(true);
    const priced = stayTotalDollarsFromSearch(rows[0], 2);
    expect(priced?.totalPrice).toBe(264);
  });

  it('returns no rows when occupancy filter includes the capacity group count', () => {
    expect(searchFixture.searchWithCapacityGroupOccupancy).toEqual([]);
  });
});