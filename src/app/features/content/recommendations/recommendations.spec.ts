import { describe, expect, it } from 'vitest';

import {
  DAY_PLAN,
  LOCAL_TIPS,
  MAP_LEGEND,
  RECOMMENDATION_PICKS,
  TRIP_VIBES,
} from './recommendations.data';

describe('RECOMMENDATION_PICKS', () => {
  it('lists six curated picks for F-05', () => {
    expect(RECOMMENDATION_PICKS).toHaveLength(6);
    expect(RECOMMENDATION_PICKS.some((pick) => pick.large)).toBe(true);
  });

  it('numbers picks for the map legend', () => {
    const numbers = RECOMMENDATION_PICKS.map((pick) => pick.number);
    expect(numbers).toEqual(['02', '01', '03', '04', '05', '06']);
  });
});

describe('LOCAL_TIPS', () => {
  it('includes six guest tips', () => {
    expect(LOCAL_TIPS).toHaveLength(6);
  });
});

describe('DAY_PLAN', () => {
  it('defines three day-plan beats', () => {
    expect(DAY_PLAN).toHaveLength(3);
  });
});

describe('TRIP_VIBES', () => {
  it('defines three itinerary vibes', () => {
    expect(TRIP_VIBES).toHaveLength(3);
  });
});

describe('MAP_LEGEND', () => {
  it('matches pick count for the area map', () => {
    expect(MAP_LEGEND).toHaveLength(RECOMMENDATION_PICKS.length);
  });
});
