import { describe, expect, it } from 'vitest';

import {
  formatCabinCsv,
  formatLodgifyResults,
  formatStayLabel,
  parseCabinCsv,
  parseLodgifyResults,
  quoteStayCents,
  shortCabinName,
} from '../../../../workers/booking-calendar/src/checkout-format';
import { hmacSha256Hex, verifyStripeSignature } from '../../../../workers/booking-calendar/src/stripe';

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

describe('lodgify results', () => {
  it('round-trips success and failure lines', () => {
    const results = [
      { cabinId: 1, ok: true, bookingId: 184221 },
      { cabinId: 2, ok: false, error: 'Reservation was not created.' },
    ];

    expect(parseLodgifyResults(formatLodgifyResults(results))).toEqual(results);
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

describe('verifyStripeSignature', () => {
  it('accepts a matching v1 signature', async () => {
    const secret = 'whsec_test';
    const payload = '{"id":"evt_1"}';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await hmacSha256Hex(secret, `${timestamp}.${payload}`);

    await expect(
      verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret),
    ).resolves.toBe(true);
  });

  it('rejects a bad signature', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    await expect(
      verifyStripeSignature('{}', `t=${timestamp},v1=deadbeef`, 'whsec_test'),
    ).resolves.toBe(false);
  });
});
