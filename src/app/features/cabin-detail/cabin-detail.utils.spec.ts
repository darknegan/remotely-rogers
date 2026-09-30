import { describe, expect, it } from 'vitest';

import { CABIN_DETAIL_SLUGS, cabinDetailForSlug } from './cabin-detail.data';
import { buildLodgifyBookingUrl, computeBookingEstimate } from './cabin-detail.utils';

describe('cabinDetailForSlug', () => {
  it('returns detail content for each configured cabin slug', () => {
    for (const slug of CABIN_DETAIL_SLUGS) {
      const detail = cabinDetailForSlug(slug);
      expect(detail).not.toBeNull();
      expect(detail?.slug).toBe(slug);
      expect(detail?.bedrooms).toBe(2);
      expect(detail?.beds).toBe(3);
      expect(detail?.bathrooms).toBe(1);
      expect(detail?.fromPrice).toBe(132);
      expect(detail?.gallery.length).toBeGreaterThan(0);
      expect(detail?.amenityGroups.length).toBeGreaterThan(0);
    }
  });

  it('returns null for unknown slugs', () => {
    expect(cabinDetailForSlug('not-a-real-cabin')).toBeNull();
  });
});

describe('computeBookingEstimate', () => {
  it('multiplies nights by nightly rate', () => {
    expect(computeBookingEstimate(3, 132)).toEqual({
      nights: 3,
      nightlyRate: 132,
      subtotal: 396,
      averagePerNight: 132,
      dueToday: 198,
      dueBeforeArrival: 198,
    });
  });

  it('returns null when nights or rate are invalid', () => {
    expect(computeBookingEstimate(0, 132)).toBeNull();
    expect(computeBookingEstimate(2, 0)).toBeNull();
  });
});

describe('buildLodgifyBookingUrl', () => {
  it('builds a Lodgify property URL with from/to and guest params', () => {
    const url = buildLodgifyBookingUrl(
      'black-gum-getaway-cozy-forest-a-frame-near-bentonville',
      new Date(2026, 9, 16),
      new Date(2026, 9, 19),
      { adults: 2, children: 0, infants: 0, pets: 1 },
    );

    expect(url).toBe(
      'https://remotelyrogers.com/en/black-gum-getaway-cozy-forest-a-frame-near-bentonville/?from=2026-10-16&to=2026-10-19&adults=2&children=0&infants=0&pets=1',
    );
  });
});
