import { describe, expect, it } from 'vitest';

import {
  buildGuestFormValues,
  isBookingWriteEnabled,
  parseProductMap,
  resolveCabinProducts,
} from './booking-config';

const MOCK_UUID = '11111111-1111-4111-8111-111111111111';
const CAPACITY = '22222222-2222-4222-8222-222222222222';

const durableEnv = {
  ASSETS: {} as Fetcher,
  BOOKING_STATE: {} as KVNamespace,
  BOOKING_COORDINATOR: {} as DurableObjectNamespace,
  BOOKINGMOOD_API_KEY: 'test-key',
  BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: MOCK_UUID }),
  BOOKINGMOOD_CAPACITY_GROUP_ID: CAPACITY,
  BOOKINGMOOD_FORM_SERVICES: JSON.stringify({
    firstName: MOCK_UUID,
    lastName: MOCK_UUID,
    email: MOCK_UUID,
  }),
  BOOKINGMOOD_BOOKING_ENABLED: 'true',
};

describe('parseProductMap', () => {
  it('accepts numeric keys and UUID values only', () => {
    expect(parseProductMap(JSON.stringify({ 1: MOCK_UUID, bad: 'not-a-uuid' }))).toEqual({
      1: MOCK_UUID,
    });
  });
});

describe('isBookingWriteEnabled', () => {
  it('is false without durable bindings', () => {
    expect(isBookingWriteEnabled({ ASSETS: {} as Fetcher })).toBe(false);
  });

  it('is false when explicit enable flag is missing', () => {
    const { BOOKINGMOOD_BOOKING_ENABLED: _removed, ...withoutFlag } = durableEnv;
    expect(isBookingWriteEnabled(withoutFlag)).toBe(false);
  });

  it('is true when required config and bindings present', () => {
    expect(isBookingWriteEnabled(durableEnv)).toBe(true);
  });

  it('is true with a combined Bookingmood name service', () => {
    expect(
      isBookingWriteEnabled({
        ...durableEnv,
        BOOKINGMOOD_FORM_SERVICES: JSON.stringify({
          name: MOCK_UUID,
          email: '44444444-4444-4444-8444-444444444444',
        }),
      }),
    ).toBe(true);
  });
});

describe('buildGuestFormValues', () => {
  it('sends a Bookingmood name service as first and last name', () => {
    const name = '55555555-5555-4555-8555-555555555555';
    const email = '66666666-6666-4666-8666-666666666666';
    expect(
      buildGuestFormValues(
        { name, email },
        { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
      ),
    ).toEqual({
      [name]: { first_name: 'Ada', last_name: 'Lovelace' },
      [email]: 'ada@example.com',
    });
  });
});

describe('resolveCabinProducts', () => {
  it('merges env map over null cabin config ids', () => {
    const cabins = resolveCabinProducts({
      ASSETS: {} as Fetcher,
      BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: MOCK_UUID }),
    });
    expect(cabins.find((c) => c.cabinId === 1)?.productId).toBe(MOCK_UUID);
    expect(cabins.find((c) => c.cabinId === 2)?.productId).toBeNull();
  });
});
