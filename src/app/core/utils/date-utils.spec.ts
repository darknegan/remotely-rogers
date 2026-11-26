import { describe, expect, it } from 'vitest';

import {
  formatDateRangeLabel,
  nightCount,
  parseDateKey,
  startOfDay,
  validateDateRange,
} from './date-utils';

describe('nightCount', () => {
  it('treats check-out as exclusive (Dec 7 → Dec 9 is 2 nights)', () => {
    const arrival = parseDateKey('2026-12-07');
    const departure = parseDateKey('2026-12-09');
    expect(nightCount(arrival, departure)).toBe(2);
  });
});

describe('formatDateRangeLabel', () => {
  it('shows the check-out day (exclusive end) in the label', () => {
    const arrival = parseDateKey('2026-12-07');
    const departure = parseDateKey('2026-12-09');
    expect(formatDateRangeLabel(arrival, departure)).toBe('Dec 7 – Dec 9 (2 nights)');
  });

  it('legacy grid: labels exclusive departure after last occupied night (Dec 7–9 nights → Dec 10)', () => {
    const arrival = parseDateKey('2026-12-07');
    const departure = parseDateKey('2026-12-10');
    expect(nightCount(arrival, departure)).toBe(3);
    expect(formatDateRangeLabel(arrival, departure)).toBe('Dec 7 – Dec 10 (3 nights)');
  });
});

describe('validateDateRange', () => {
  it('requires both dates', () => {
    expect(validateDateRange(null, null, 2)).toBe('Select check-in and check-out dates.');
  });

  it('rejects check-in in the past', () => {
    const yesterday = startOfDay(new Date());
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = startOfDay(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(validateDateRange(yesterday, tomorrow, 2)).toBe('Check-in cannot be in the past.');
  });

  it('rejects stays shorter than minimum nights', () => {
    const arrival = startOfDay(new Date());
    arrival.setDate(arrival.getDate() + 7);
    const departure = startOfDay(new Date(arrival));
    departure.setDate(departure.getDate() + 1);

    expect(validateDateRange(arrival, departure, 2)).toBe('Minimum stay is 2 nights.');
  });

  it('accepts a valid range', () => {
    const arrival = startOfDay(new Date());
    arrival.setDate(arrival.getDate() + 10);
    const departure = startOfDay(new Date(arrival));
    departure.setDate(departure.getDate() + 3);

    expect(validateDateRange(arrival, departure, 2)).toBeNull();
    expect(nightCount(arrival, departure)).toBe(3);
  });
});
