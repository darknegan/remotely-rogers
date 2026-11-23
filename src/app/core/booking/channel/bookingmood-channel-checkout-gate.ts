import { environment } from '../../../../environments/environment';

/**
 * Build-time gate for `POST …/cart/checkout`. Must stay false in every environment file until live booking is approved.
 */
export const BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED =
  environment.bookingmoodChannelBookingEnabled === true;

export function assertChannelCheckoutEnabled(): void {
  if (!BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED) {
    throw new ChannelCheckoutDisabledError();
  }
}

export class ChannelCheckoutDisabledError extends Error {
  readonly code = 'booking_disabled';
  readonly status = 403;

  constructor() {
    super('Channel checkout is disabled in this build.');
    this.name = 'ChannelCheckoutDisabledError';
  }
}