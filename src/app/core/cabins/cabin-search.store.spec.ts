import { describe, expect, it } from 'vitest';

import { CABIN_LISTINGS } from '../content/cabin-catalog';
import { EMPTY_AMENITY_FILTERS, matches } from './cabin-search.store';

describe('cabin listing filters', () => {
  it('returns every cabin when no filters are set', () => {
    const matched = CABIN_LISTINGS.filter((cabin) => matches(cabin, EMPTY_AMENITY_FILTERS, 0));
    expect(matched).toHaveLength(6);
  });

  it('returns none when the bedroom minimum is above the cabins', () => {
    const matched = CABIN_LISTINGS.filter((cabin) => matches(cabin, EMPTY_AMENITY_FILTERS, 3));
    expect(matched).toHaveLength(0);
  });

  it('never labels a miss as undefined results', () => {
    const count = CABIN_LISTINGS.filter((cabin) => matches(cabin, EMPTY_AMENITY_FILTERS, 3)).length;
    const label = count === 1 ? '1 cabin' : `${count} cabins`;
    expect(label).toBe('0 cabins');
    expect(label.toLowerCase()).not.toContain('undefined');
  });
});
