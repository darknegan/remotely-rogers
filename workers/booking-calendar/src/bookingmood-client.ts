export type BookingmoodIntervalStatus =
  | 'available'
  | 'booked'
  | 'closed'
  | 'pending'
  | 'unavailable';

export interface BookingmoodAvailabilityRow {
  product_id: string;
  intervals: Array<{
    start: string;
    end: string;
    status: BookingmoodIntervalStatus;
  }>;
}

export interface BookingmoodSearchResult {
  productId: string;
  match: boolean;
  availability: BookingmoodIntervalStatus | null;
  occupancyMatches: boolean;
  optionsMatch: boolean;
  price: { min: number; max: number } | null;
}

export interface BookingmoodCartValidateItem {
  id: string;
  valid: boolean;
  availabilityMatch: boolean;
  occupancyMatch: boolean;
  price?: {
    currency: string;
    subtotal: number;
    tax: number;
    total: number;
    deposit: number;
    lines?: unknown[];
  };
}

export interface BookingmoodBookingConfirmation {
  booking_id: string;
  reference: string;
  secret?: string;
  payment_url?: string | null;
  payment_expiry_timestamp?: string | null;
}

export type BookingmoodFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const BASE = 'https://api.bookingmood.com/v1';

export class BookingmoodClient {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: BookingmoodFetch = fetch,
  ) {}

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    return this.fetchImpl(`${BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...(init.headers ?? {}),
      },
    });
  }

  async getAvailability(params: {
    productIds: string[];
    performSync?: boolean;
    showBookedAs?: 'booked' | 'unavailable';
    showClosedAs?: 'closed' | 'unavailable';
    showPendingAs?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  }): Promise<BookingmoodAvailabilityRow[]> {
    const search = new URLSearchParams();
    search.set('perform_sync', String(params.performSync ?? false));
    search.set('show_booked_as', params.showBookedAs ?? 'booked');
    search.set('show_closed_as', params.showClosedAs ?? 'closed');
    search.set('show_pending_as', params.showPendingAs ?? 'TENTATIVE');
    for (const id of params.productIds) {
      search.append('product_ids', id);
    }

    const response = await this.request(`/availability?${search}`);
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Bookingmood availability failed (${response.status}): ${text.slice(0, 200)}`);
    }

    return JSON.parse(text) as BookingmoodAvailabilityRow[];
  }

  async search(body: {
    interval: { start: string; end: string };
    productIds: string[];
    occupancy: Record<string, number>;
    showBookedAs?: 'booked' | 'unavailable';
    showClosedAs?: 'closed' | 'unavailable';
    showPendingAs?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  }): Promise<BookingmoodSearchResult[]> {
    const response = await this.request('/search', {
      method: 'POST',
      body: JSON.stringify({
        interval: body.interval,
        product_ids: body.productIds,
        occupancy: body.occupancy,
        option_ids: [],
        show_booked_as: body.showBookedAs ?? 'booked',
        show_closed_as: body.showClosedAs ?? 'closed',
        show_pending_as: body.showPendingAs ?? 'TENTATIVE',
      }),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Bookingmood search failed (${response.status}): ${text.slice(0, 200)}`);
    }

    return JSON.parse(text) as BookingmoodSearchResult[];
  }

  async cartValidate(body: {
    items: Array<{
      id: string;
      product_id: string;
      interval: { start: string; end: string };
      occupancy: Record<string, number>;
      form_values: Record<string, string | number | boolean | null>;
    }>;
    couponCodes?: string[];
  }): Promise<BookingmoodCartValidateItem[]> {
    const response = await this.request('/cart-validate', {
      method: 'POST',
      body: JSON.stringify({
        coupon_codes: body.couponCodes ?? [],
        items: body.items,
      }),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Bookingmood cart-validate failed (${response.status}): ${text.slice(0, 200)}`);
    }

    return JSON.parse(text) as BookingmoodCartValidateItem[];
  }

  async cartCheckout(body: {
    items: Array<{
      id: string;
      product_id: string;
      interval: { start: string; end: string };
      occupancy: Record<string, number>;
      form_values: Record<string, string | number | boolean | null>;
    }>;
    couponCodes?: string[];
  }): Promise<BookingmoodBookingConfirmation> {
    const response = await this.request('/cart-checkout', {
      method: 'POST',
      body: JSON.stringify({
        coupon_codes: body.couponCodes ?? [],
        items: body.items,
      }),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Bookingmood cart-checkout failed (${response.status}): ${text.slice(0, 200)}`);
    }

    return JSON.parse(text) as BookingmoodBookingConfirmation;
  }

  async listProducts(select: string, productIds?: string[]): Promise<unknown[]> {
    const search = new URLSearchParams();
    search.set('select', select);
    if (productIds?.length) {
      for (const id of productIds) {
        search.append('id', `eq.${id}`);
      }
    }

    const response = await this.request(`/products?${search}`);
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Bookingmood products failed (${response.status}): ${text.slice(0, 200)}`);
    }

    return JSON.parse(text) as unknown[];
  }
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function requireBookingmoodClient(apiKey: string | undefined): BookingmoodClient {
  const trimmed = apiKey?.trim();
  if (!trimmed) {
    throw new HttpError(503, 'BOOKINGMOOD_API_KEY is not configured on the booking worker.');
  }

  return new BookingmoodClient(trimmed);
}
