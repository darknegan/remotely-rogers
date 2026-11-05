import { describe, expect, it } from 'vitest';

import { findNextOpenStay, formatNextOpenLabel } from './booking-next-open';
import { parseDateKey, toDateKey } from '../../core/utils/date-utils';

describe('findNextOpenStay', () => {
  it('finds the first min-night window after checkout', () => {
    const checkout = parseDateKey('2026-10-19');
    const days: Record<string, 'available' | 'booked' | 'blocked'> = {
      '2026-10-19': 'booked',
      '2026-10-20': 'available',
      '2026-10-21': 'available',
    };

    const window = findNextOpenStay(days, checkout, 2);
    expect(window).not.toBeNull();
    expect(toDateKey(window!.arrival)).toBe('2026-10-20');
    expect(toDateKey(window!.departure)).toBe('2026-10-22');
  });
});

describe('formatNextOpenLabel', () => {
  it('uses Open from for a single night', () => {
    const label = formatNextOpenLabel({
      arrival: parseDateKey('2026-10-20'),
      departure: parseDateKey('2026-10-21'),
    });
    expect(label).toBe('Open from Oct 20');
  });

  it('uses a range label for multi-night windows', () => {
    const label = formatNextOpenLabel({
      arrival: parseDateKey('2026-10-18'),
      departure: parseDateKey('2026-10-27'),
    });
    expect(label).toBe('Open Oct 18 – Oct 26');
  });
});
