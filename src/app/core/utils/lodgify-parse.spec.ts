import { describe, expect, it } from 'vitest';

import { parseBookingId, parseQuote, parseRatesCalendarDays } from '../../../../workers/booking-calendar/src/lodgify';

describe('parseBookingId', () => {
  it('reads a plain integer body', () => {
    expect(parseBookingId('184221')).toBe(184221);
  });

  it('reads a JSON object id', () => {
    expect(parseBookingId('{"id":184221,"status":"Tentative"}')).toBe(184221);
  });

  it('returns null for an empty object', () => {
    expect(parseBookingId('{}')).toBeNull();
  });
});

describe('parseQuote', () => {
  it('prefers total_including_vat', () => {
    expect(parseQuote({ total_including_vat: 396, currency_code: 'USD' })).toEqual({
      totalPrice: 396,
      currency: 'USD',
    });
  });
});

describe('parseRatesCalendarDays', () => {
  it('maps weekday and weekend prices with min stay and cleaning fee', () => {
    expect(
      parseRatesCalendarDays({
        calendar_items: [
          { date: '2026-09-01', prices: [{ price_per_day: 132, min_stay: 1 }] },
          { date: '2026-09-04', prices: [{ price_per_day: 235, min_stay: 2 }] },
        ],
        rate_settings: {
          currency_code: 'USD',
          fees: [{ price: { amount: 75 } }],
        },
      }),
    ).toEqual({
      dayRates: {
        '2026-09-01': { price: 132, minStay: 1 },
        '2026-09-04': { price: 235, minStay: 2 },
      },
      cleaningFee: 75,
      currency: 'USD',
    });
  });
});
