import { describe, expect, it, vi } from 'vitest';

import { BookingmoodChannelClient } from './bookingmood-channel-client';
import { DEV_BOOKINGMOOD_CHANNEL_ID } from './bookingmood-channel-allowlist';
import {
  BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED,
  assertChannelCheckoutEnabled,
  ChannelCheckoutDisabledError,
} from './bookingmood-channel-checkout-gate';

describe('bookingmood channel checkout gate', () => {
  it('is disabled in every environment build in this PR', () => {
    expect(BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED).toBe(false);
  });

  it('throws before checkout when disabled', () => {
    expect(() => assertChannelCheckoutEnabled()).toThrow(ChannelCheckoutDisabledError);
  });

  it('does not invoke pay/cancel when disabled', async () => {
    const fetch = vi.fn();
    const client = new BookingmoodChannelClient(fetch);
    expect(() => client.payBooking('bid', 'secret')).toThrow(ChannelCheckoutDisabledError);
    expect(() => client.cancelBooking('bid', 'secret')).toThrow(ChannelCheckoutDisabledError);
    expect(fetch).not.toHaveBeenCalled();
  });
});