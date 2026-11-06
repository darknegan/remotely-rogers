export interface BookingmoodWidgetQuery {
  productId?: string | null;
  start?: string | null;
  end?: string | null;
  guests?: number | null;
}

/** Inline Bookingmood timeline widget. One product preselects a cabin; omit it for the shopping cart. */
export function bookingmoodWidgetSrc(baseUrl: string, query: BookingmoodWidgetQuery = {}): string {
  const url = new URL(baseUrl);
  if (query.productId) {
    url.searchParams.set('product_id', query.productId);
  }
  if (query.start) {
    url.searchParams.set('start', query.start);
  }
  if (query.end) {
    url.searchParams.set('end', query.end);
  }
  if (query.guests && query.guests > 0) {
    url.searchParams.set('guests', String(query.guests));
  }
  url.searchParams.set('locale', 'en-US');
  url.searchParams.set('currency', 'USD');
  return url.toString();
}
