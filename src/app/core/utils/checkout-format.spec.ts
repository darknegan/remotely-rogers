import { describe, expect, it } from 'vitest';

import {
  formatCabinCsv,
  formatCheckoutResults,
  formatStayLabel,
  parseCabinCsv,
  parseCheckoutResults,
  quoteStayCents,
  shortCabinName,
} from '../../../../workers/booking-calendar/src/checkout-format';

describe('formatStayLabel', () => {
  it('uses a single month for stays in the same month', () => {
    expect(formatStayLabel('2026-09-01', '2026-09-04')).toBe('Sep 1–4');
  });
});

describe('shortCabinName', () => {
  it('uses the name before the first hyphen', () => {
    expect(shortCabinName('Black Gum Getaway-Cozy Forest A-frame Near Bentonville')).toBe(
      'Black Gum Getaway',
    );
  });
});

describe('cabin csv', () => {
  it('round-trips cabin lines', () => {
    const cabins = [
      { cabinId: 1, arrival: '2026-09-01', departure: '2026-09-04' },
      { cabinId: 2, arrival: '2026-09-01', departure: '2026-09-05' },
    ];

    expect(parseCabinCsv(formatCabinCsv(cabins))).toEqual(cabins);
  });
});

describe('checkout results', () => {
  it('round-trips success and failure lines', () => {
    const results = [
      { cabinId: 1, ok: true, bookingId: 'booking-1', reference: 'REF123' },
      { cabinId: 2, ok: false, error: 'Reservation was not created.' },
    ];

    expect(parseCheckoutResults(formatCheckoutResults(results))).toEqual(results);
  });
});

describe('quoteStayCents', () => {
  it('sums nightly rates plus cleaning fee', () => {
    expect(
      quoteStayCents(
        {
          '2026-09-01': { price: 132 },
          '2026-09-02': { price: 235 },
        },
        75,
        '2026-09-01',
        '2026-09-03',
      ),
    ).toBe(44200);
  });

  it('returns null when a night is missing a rate', () => {
    expect(quoteStayCents({ '2026-09-01': { price: 132 } }, 75, '2026-09-01', '2026-09-03')).toBeNull();
  });
});
