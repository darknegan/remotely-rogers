import { describe, expect, it } from 'vitest';

import {
  RESERVED_STAY_RANGE_NOTICE,
  buildDayKinds,
  overlayWorkerDayStatuses,
  stayRangeIsBookable,
  stayRangeIsWorkerAvailable,
} from './booking-channel-calendar';

describe('booking-channel-calendar', () => {
  const events = [
    { type: 'booking' as const, start_date: '2026-12-24', end_date: '2026-12-26', status: 'confirmed' },
  ];
  const checkIn = new Date(2026, 11, 23);
  const checkOut = new Date(2026, 11, 26);
  const month = new Date(2026, 11, 1);
  const visibleEnd = new Date(2027, 0, 1);

  it('does not paint in-stay over reserved nights', () => {
    const kinds = buildDayKinds(events, [], { checkIn, checkOut }, month, visibleEnd);
    expect(kinds['2026-12-24']).toBe('reserved');
    expect(kinds['2026-12-25']).toBe('reserved');
    expect(kinds['2026-12-23']).toBe('selected-endpoint');
  });

  it('paints check-in and check-out days as endpoints with in-stay between', () => {
    const clearCheckIn = new Date(2026, 11, 23);
    const clearCheckOut = new Date(2026, 11, 26);
    const kinds = buildDayKinds([], [], { checkIn: clearCheckIn, checkOut: clearCheckOut }, month, visibleEnd);
    expect(kinds['2026-12-23']).toBe('selected-endpoint');
    expect(kinds['2026-12-24']).toBe('in-stay');
    expect(kinds['2026-12-25']).toBe('in-stay');
    expect(kinds['2026-12-26']).toBe('selected-endpoint');
  });

  it('flags booked Worker dayStatuses as reserved on the calendar', () => {
    const kinds = buildDayKinds([], [], null, month, visibleEnd);
    const overlaid = overlayWorkerDayStatuses(kinds, {
      '2026-12-24': 'booked',
      '2026-12-25': 'booked',
    });
    expect(overlaid['2026-12-24']).toBe('reserved');
    expect(overlaid['2026-12-25']).toBe('reserved');
  });

  it('rejects ranges that overlap booked Worker nights', () => {
    expect(
      stayRangeIsWorkerAvailable(checkIn, checkOut, {
        '2026-12-23': 'available',
        '2026-12-24': 'booked',
        '2026-12-25': 'booked',
      }),
    ).toBe(false);
  });

  it('rejects stays that cross reserved nights', () => {
    expect(stayRangeIsBookable(checkIn, checkOut, events, [])).toBe(false);
    expect(RESERVED_STAY_RANGE_NOTICE).toMatch(/reserved/i);
  });
});