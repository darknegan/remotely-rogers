/** Angular build profile bundled into `wrangler.booking-test.jsonc` assets (isolated test Worker only). */
export const environment = {
  production: true,
  apiBaseUrl: '',
  siteBaseUrl: 'https://remotelyrogers.com',
  bookingmoodWidgetUrl: 'https://www.bookingmood.com/embed/4285e82a-1454-4405-b34b-25a8cac7f4ce',
  groupBookingEmbedUrl: 'https://remotely-rogers-booking.drakedavisdev.workers.dev/group-booking',
  useMockAvailability: false,
  useCustomBookingComponents: true,
  bookingmoodChannelId: 'b36240bc-5dae-404e-b55d-f51efb502d73',
  bookingmoodChannelBookingEnabled: false,
};