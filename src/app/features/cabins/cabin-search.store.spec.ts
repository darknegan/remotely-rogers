import { describe, expect, it } from 'vitest';

import { startOfDay } from '../../core/utils/date-utils';
import {
  buildSuggestedDateParams,
  filterCabins,
  isHolidayFullyBooked,
} from './cabin-search.store';
import { CABIN_LISTINGS, HOLIDAY_EMPTY_SUGGESTIONS } from './cabins.data';

describe('isHolidayFullyBooked', () => {
  it('flags Dec 24–27 as fully booked', () => {
    const arrival = startOfDay(new Date(2026, 11, 24));
    const departure = startOfDay(new Date(2026, 11, 27));

    expect(isHolidayFullyBooked(arrival, departure)).toBe(true);
  });

  it('allows stays that do not overlap the holiday block', () => {
    const arrival = startOfDay(new Date(2026, 9, 16));
    const departure = startOfDay(new Date(2026, 9, 18));

    expect(isHolidayFullyBooked(arrival, departure)).toBe(false);
  });
});

describe('filterCabins', () => {
  it('returns all cabins when no filters are active', () => {
    const results = filterCabins(CABIN_LISTINGS, {
      amenities: new Set(),
      bedrooms: 'any',
      arrival: null,
      departure: null,
      totalGuests: 2,
    });

    expect(results).toHaveLength(6);
  });

  it('filters by amenity selection', () => {
    const results = filterCabins(CABIN_LISTINGS, {
      amenities: new Set(['workspace']),
      bedrooms: 'any',
      arrival: null,
      departure: null,
      totalGuests: 2,
    });

    expect(results).toHaveLength(2);
    expect(results.every((cabin) => cabin.amenities.includes('workspace'))).toBe(true);
  });

  it('returns an empty list for the holiday demo block', () => {
    const arrival = startOfDay(new Date(2026, 11, 24));
    const departure = startOfDay(new Date(2026, 11, 27));

    const results = filterCabins(CABIN_LISTINGS, {
      amenities: new Set(),
      bedrooms: 'any',
      arrival,
      departure,
      totalGuests: 4,
    });

    expect(results).toHaveLength(0);
  });

  it('sorts deterministically by name when rates match', () => {
    const results = filterCabins(CABIN_LISTINGS, {
      amenities: new Set(),
      bedrooms: 'any',
      arrival: null,
      departure: null,
      totalGuests: 2,
    }).sort((a, b) => a.name.localeCompare(b.name));

    expect(results[0]?.name).toBe('Black Gum Getaway');
    expect(results.at(-1)?.name).toBe('White Oak Haven');
  });
});

describe('buildSuggestedDateParams', () => {
  it('builds ISO date keys for alternate holiday chips', () => {
    const suggestion = HOLIDAY_EMPTY_SUGGESTIONS[0];
    const params = buildSuggestedDateParams(suggestion, 2026);

    expect(params).toEqual({
      checkIn: '2026-12-27',
      checkOut: '2026-12-29',
    });
  });
});
