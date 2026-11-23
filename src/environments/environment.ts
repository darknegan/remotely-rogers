export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8787',
  siteBaseUrl: 'https://remotelyrogers.com',
  bookingmoodWidgetUrl: 'https://www.bookingmood.com/embed/4285e82a-1454-4405-b34b-25a8cac7f4ce',
  useMockAvailability: false,
  /** When true, cabin detail and group checkout use custom Bookingmood channel components instead of the timeline iframe. */
  useCustomBookingComponents: false,
  /** Dev Custom widget channel (publishable). Allowlisted in test builds only. */
  bookingmoodChannelId: 'b36240bc-5dae-404e-b55d-f51efb502d73',
  /** Gate for POST …/cart/checkout — must stay false until live booking is approved. */
  bookingmoodChannelBookingEnabled: false,
};
