// Interim: booking-api.remotelyrogers.com custom domain not Active yet.
// Revert apiBaseUrl to https://booking-api.remotelyrogers.com once Cloudflare marks it Active.
export const environment = {
  production: true,
  apiBaseUrl: 'https://remotely-rogers-booking.drakedavisdev.workers.dev',
  siteBaseUrl: 'https://remotelyrogers.com',
  bookingmoodWidgetUrl: 'https://www.bookingmood.com/embed/4285e82a-1454-4405-b34b-25a8cac7f4ce',
  groupBookingEmbedUrl: 'https://remotely-rogers-booking.drakedavisdev.workers.dev/group-booking',
  useMockAvailability: false,
};
