import { describe, expect, it } from 'vitest';

import {
  isStayAvailable,
  mapAvailabilityRowsToDays,
  mapIntervalStatus,
} from './bookingmood-interval-map';
import { eachNight, parseDateKey } from '../../../src/app/core/utils/date-utils';

describe('mapIntervalStatus', () => {
  it('maps Bookingmood statuses to calendar day statuses', () => {
    expect(mapIntervalStatus('available')).toBe('available');
    expect(mapIntervalStatus('booked')).toBe('booked');
    expect(mapIntervalStatus('closed')).toBe('closed');
    expect(mapIntervalStatus('pending')).toBe('pending');
    expect(mapIntervalStatus('unavailable')).toBe('blocked');
  });
});

describe('mapAvailabilityRowsToDays', () => {
  const productId = '11111111-1111-4111-8111-111111111111';
  const windowNights = eachNight(parseDateKey('2026-06-10'), parseDateKey('2026-06-14'));

  it('paints available and booked nights with exclusive departure', () => {
    const days = mapAvailabilityRowsToDays(
      [
        {
          product_id: productId,
          intervals: [
            { start: '2026-06-10T00:00', end: '2026-06-12T00:00', status: 'available' },
            { start: '2026-06-12T00:00', end: '2026-06-14T00:00', status: 'booked' },
          ],
        },
      ],
      productId,
      windowNights,
    );

    expect(days['2026-06-10']).toBe('available');
    expect(days['2026-06-11']).toBe('available');
    expect(days['2026-06-12']).toBe('booked');
    expect(isStayAvailable(days, '2026-06-10', '2026-06-12')).toBe(true);
    expect(isStayAvailable(days, '2026-06-11', '2026-06-13')).toBe(false);
  });

  it('returns unknown when product row missing', () => {
    const days = mapAvailabilityRowsToDays([], productId, windowNights);
    expect(Object.values(days).every((status) => status === 'unknown')).toBe(true);
  });
});
