import { describe, expect, it } from 'vitest';

import {
  buildFormValuesForCart,
  formatFormValueForDisplay,
} from './booking-channel-form-values';
import { BookingmoodFormService } from './bookingmood-channel.types';

const services: BookingmoodFormService[] = [
  { id: 'name-id', type: 'name', label: { default: 'Name' } },
  { id: 'email-id', type: 'email', label: { default: 'Email' } },
  { id: 'addr-id', type: 'address', label: { default: 'Address' } },
];

describe('buildFormValuesForCart', () => {
  it('maps address to { street, city, zip, country } by service id', () => {
    const mapped = buildFormValuesForCart(services, {
      'name-id': 'Jordan Ellis',
      'email-id': 'jordan.ellis@example.com',
      'addr-id': {
        street: '214 Maple Street',
        city: 'Fayetteville',
        zip: '72701',
        country: 'United States',
      },
    });
    expect(mapped['addr-id']).toEqual({
      street: '214 Maple Street',
      city: 'Fayetteville',
      zip: '72701',
      country: 'United States',
    });
    expect(mapped['name-id']).toBe('Jordan Ellis');
  });
});

describe('formatFormValueForDisplay', () => {
  it('joins address parts for review', () => {
    const text = formatFormValueForDisplay(services[2]!, {
      street: '214 Maple Street',
      city: 'Fayetteville',
      zip: '72701',
      country: 'United States',
    });
    expect(text).toContain('Fayetteville');
    expect(text).toContain('72701');
  });
});