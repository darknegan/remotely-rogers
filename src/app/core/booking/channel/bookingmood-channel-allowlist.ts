/** Dev Custom widget channel (publishable, browser-safe). */
export const DEV_BOOKINGMOOD_CHANNEL_ID = 'b36240bc-5dae-404e-b55d-f51efb502d73';

/** Production timeline embed channel — must never be used by the public channel client in test builds. */
export const PRODUCTION_EMBED_CHANNEL_ID = '4285e82a-1454-4405-b34b-25a8cac7f4ce';

const ALLOWED = new Set<string>([DEV_BOOKINGMOOD_CHANNEL_ID]);

export function isBookingmoodChannelAllowed(channelId: string): boolean {
  const normalized = channelId.trim();
  if (!normalized || normalized === PRODUCTION_EMBED_CHANNEL_ID) {
    return false;
  }
  return ALLOWED.has(normalized);
}

export function assertBookingmoodChannelAllowed(channelId: string): void {
  if (!isBookingmoodChannelAllowed(channelId)) {
    throw new BookingmoodChannelAllowlistError(channelId);
  }
}

export class BookingmoodChannelAllowlistError extends Error {
  readonly code = 'channel_not_allowed';

  constructor(readonly channelId: string) {
    super(
      `Bookingmood channel ${channelId || '(empty)'} is not on the build allowlist. Only the dev custom channel may be used.`,
    );
    this.name = 'BookingmoodChannelAllowlistError';
  }
}