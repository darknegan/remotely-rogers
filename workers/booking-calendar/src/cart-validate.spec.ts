import { describe, expect, it } from 'vitest';

import { assertCartItemsValid, assertCartValidateResponse } from './cart-validate';
import { HttpError } from './bookingmood-client';

describe('assertCartValidateResponse', () => {
  it('rejects empty validate arrays', () => {
    expect(() => assertCartValidateResponse(['cabin-1'], [])).toThrow(HttpError);
  });

  it('requires one result per submitted id', () => {
    expect(() =>
      assertCartValidateResponse(['cabin-1', 'cabin-2'], [
        {
          id: 'cabin-1',
          valid: true,
          availabilityMatch: true,
          occupancyMatch: true,
          price: { currency: 'USD', subtotal: 100, tax: 0, total: 100, deposit: 0 },
        },
      ]),
    ).toThrow(HttpError);
  });
});

describe('assertCartItemsValid', () => {
  it('rejects invalid rows even when filter would pass empty', () => {
    expect(() =>
      assertCartItemsValid([
        {
          id: 'cabin-1',
          valid: false,
          availabilityMatch: true,
          occupancyMatch: true,
          price: { currency: 'USD', subtotal: 100, tax: 0, total: 100, deposit: 0 },
        },
      ]),
    ).toThrow(HttpError);
  });
});
