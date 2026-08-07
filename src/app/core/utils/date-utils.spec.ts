import { describe, expect, it } from 'vitest';

import { nightCount, startOfDay, validateDateRange } from './date-utils';

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
