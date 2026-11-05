// Interim: booking-api.remotelyrogers.com custom domain not Active yet.
// Revert apiBaseUrl to https://booking-api.remotelyrogers.com once Cloudflare marks it Active.
export const environment = {
  production: true,
  apiBaseUrl: 'https://remotely-rogers-booking.drakedavisdev.workers.dev',
  siteBaseUrl: 'https://remotelyrogers.com',
  groupBookingEmbedUrl: 'https://remotely-rogers-booking.drakedavisdev.workers.dev/group-booking',
  useMockAvailability: false,
};
