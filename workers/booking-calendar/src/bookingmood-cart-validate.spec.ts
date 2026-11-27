import { describe, expect, it } from 'vitest';

import {
  coerceCartValidateRows,
  readCartValidateSubtotalCents,
} from './bookingmood-cart-validate';

describe('readCartValidateSubtotalCents', () => {
  it('reads camelCase subtotal', () => {
    expect(
      readCartValidateSubtotalCents({
        id: 'quote-1',
        price: { subtotal: 26400, total: 26400 },
      }),
    ).toBe(26400);
  });

  it('reads snake_case subtotal', () => {
    expect(
      readCartValidateSubtotalCents({
        id: 'quote-1',
        price: { sub_total: 26400 },
      }),
    ).toBe(26400);
  });

  it('does not treat price.total as subtotal when subtotal is missing', () => {
    expect(
      readCartValidateSubtotalCents({
        id: 'quote-1',
        price: { total: 26400 },
      }),
    ).toBeNull();
  });

  it('sums rent lines when subtotal is omitted', () => {
    expect(
      readCartValidateSubtotalCents({
        id: 'quote-1',
        price: {
          lines: [
            { amount: 13200, quantity: 2, item_type: 'rent' },
          ],
        },
      }),
    ).toBe(26400);
  });
});

describe('coerceCartValidateRows', () => {
  it('unwraps a results envelope', () => {
    const rows = coerceCartValidateRows({
      results: [{ id: 'quote-1' }],
    });
    expect(rows).toHaveLength(1);
  });
});