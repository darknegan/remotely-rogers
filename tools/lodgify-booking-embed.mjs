/**
 * Lodgify cannot run Angular — the group booking calendar is embedded as an iframe
 * pointing at the deployed Angular app (/group-booking route).
 *
 * Override at export time: GROUP_BOOKING_EMBED_URL=https://your-host/group-booking
 */
export const GROUP_BOOKING_EMBED_URL =
  process.env.GROUP_BOOKING_EMBED_URL ??
  'https://remotely-rogers-booking.drakedavisdev.workers.dev/group-booking';

export function createBookingEmbed(doc, title = 'Group booking calendar') {
  const panel = doc.createElement('div');
  panel.className = 'rr-booking-embed-panel';

  const heading = doc.createElement('h3');
  heading.className = 'rr-booking-embed-panel__title';
  heading.textContent = title;
  panel.appendChild(heading);

  const iframe = doc.createElement('iframe');
  const embedUrl = GROUP_BOOKING_EMBED_URL.includes('?')
    ? `${GROUP_BOOKING_EMBED_URL}&embed=1`
    : `${GROUP_BOOKING_EMBED_URL}?embed=1`;
  iframe.src = embedUrl;
  iframe.title = 'Book multiple cabins at Remotely Rogers';
  iframe.className = 'rr-booking-embed';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allow', 'fullscreen');
  panel.appendChild(iframe);

  const note = doc.createElement('p');
  note.className = 'rr-booking-embed__note';
  const link = doc.createElement('a');
  link.href = GROUP_BOOKING_EMBED_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'Open the booking calendar';
  note.append('Prefer full screen? ');
  note.appendChild(link);
  panel.appendChild(note);

  return panel;
}
