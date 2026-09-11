import { describe, expect, it } from 'vitest';

import {
  eachInclusiveDate,
  mapPeriodsToDays,
  normalizeAvailabilityPeriods,
  statusForPeriod,
} from '../../../../workers/booking-calendar/src/availability-map';
import { parseDateKey } from './date-utils';

function nights(from: string, toExclusive: string): Date[] {
  return eachInclusiveDate(from, toExclusive)
    .slice(0, -1)
    .map((key) => parseDateKey(key));
}

describe('statusForPeriod', () => {
  it('marks open periods available', () => {
    expect(statusForPeriod({ start: '2026-08-01', end: '2026-08-10', available: 1 })).toBe(
      'available',
    );
  });

  it('marks unavailable periods with bookings as booked', () => {
    expect(
      statusForPeriod({
        start: '2026-08-12',
        end: '2026-08-14',
        available: 0,
        bookings: [{ id: 1 }],
      }),
    ).toBe('booked');
  });

  it('marks closed days blocked', () => {
    expect(
      statusForPeriod({
        start: '2026-08-20',
        end: '2026-08-20',
        available: 0,
        closed_period: true,
        bookings: [],
      }),
    ).toBe('blocked');
  });
});

describe('mapPeriodsToDays', () => {
  it('treats period end dates as inclusive', () => {
    const days = mapPeriodsToDays(
      [{ start: '2026-08-01', end: '2026-08-03', available: 1 }],
      nights('2026-08-01', '2026-08-05'),
    );

    expect(days).toEqual({
      '2026-08-01': 'available',
      '2026-08-02': 'available',
      '2026-08-03': 'available',
      '2026-08-04': 'blocked',
    });
  });

  it('maps booked spans and leaves uncovered nights blocked', () => {
    const days = mapPeriodsToDays(
      [
        { start: '2026-09-01', end: '2026-09-03', available: 1 },
        {
          start: '2026-09-04',
          end: '2026-09-05',
          available: 0,
          bookings: [{ id: 99 }],
        },
      ],
      nights('2026-09-01', '2026-09-07'),
    );

    expect(days['2026-09-01']).toBe('available');
    expect(days['2026-09-04']).toBe('booked');
    expect(days['2026-09-05']).toBe('booked');
    expect(days['2026-09-06']).toBe('blocked');
  });

  it('reads nested Lodgify period payloads', () => {
    const periods = normalizeAvailabilityPeriods([
      {
        property_id: 756289,
        room_type_id: 823412,
        periods: [{ start: '2026-08-01T00:00:00', end: '2026-08-02T00:00:00', available: 1 }],
      },
    ]);

    expect(periods).toHaveLength(1);
    expect(periods[0].start).toBe('2026-08-01T00:00:00');
  });
});
