import { DayRate } from '../../../src/app/core/models/booking.models';

const LODGIFY_BASE = 'https://api.lodgify.com';

export interface LodgifyQuote {
  totalPrice: number;
  currency: string;
}

export interface LodgifyRatesCalendar {
  dayRates: Record<string, DayRate>;
  cleaningFee: number;
  currency: string;
}

export class LodgifyClient {
  constructor(private readonly apiKey: string) {}

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${LODGIFY_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-ApiKey': this.apiKey,
        ...(init.headers ?? {}),
      },
    });
  }

  async getAvailability(propertyId: number, from: string, to: string): Promise<unknown> {
    const params = new URLSearchParams({ start: from, end: to });
    const response = await this.request(`/v2/availability/${propertyId}?${params}`);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Availability for property ${propertyId} failed (${response.status}): ${body.slice(0, 200)}`,
      );
    }

    return response.json();
  }

  async getRatesCalendar(
    propertyId: number,
    roomTypeId: number,
    from: string,
    to: string,
  ): Promise<LodgifyRatesCalendar | null> {
    const params = new URLSearchParams({
      HouseId: String(propertyId),
      RoomTypeId: String(roomTypeId),
      StartDate: from,
      EndDate: to,
    });

    const response = await this.request(`/v2/rates/calendar?${params}`);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('lodgify_rates_http_error', {
        propertyId,
        status: response.status,
        body: body.slice(0, 200),
      });
      return null;
    }

    return parseRatesCalendarDays(await response.json());
  }

  async createTentativeBooking(payload: Record<string, unknown>): Promise<number> {
    return this.createBooking(payload, 'tentative');
  }

  async createBookedBooking(payload: Record<string, unknown>): Promise<number> {
    return this.createBooking(payload, 'book');
  }

  private async createBooking(
    payload: Record<string, unknown>,
    statusPath: 'tentative' | 'book',
  ): Promise<number> {
    const response = await this.request('/v1/reservation/booking', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(extractErrorMessage(text, response.status));
    }

    const bookingId = parseBookingId(text);
    if (bookingId == null) {
      throw new Error('Lodgify created a booking but did not return an id.');
    }

    try {
      await this.request(`/v1/reservation/booking/${bookingId}/${statusPath}`, {
        method: 'PUT',
      });
    } catch {
      // Status update is best-effort; the reservation still exists.
    }

    return bookingId;
  }
}

export function parseRatesCalendarDays(payload: unknown): LodgifyRatesCalendar | null {
  const record = asRecord(payload);
  if (!record || !Array.isArray(record['calendar_items'])) {
    return null;
  }

  const dayRates: Record<string, DayRate> = {};

  for (const item of record['calendar_items']) {
    const day = asRecord(item);
    const date = day ? asString(day['date']) : null;
    if (!date) {
      continue;
    }

    const prices = Array.isArray(day?.['prices']) ? day['prices'] : [];
    const firstPrice = asRecord(prices[0]);
    const nightly = firstPrice ? asNumber(firstPrice['price_per_day']) : null;
    if (nightly == null) {
      continue;
    }

    dayRates[date] = {
      price: nightly,
      minStay: firstPrice ? (asNumber(firstPrice['min_stay']) ?? 1) : 1,
    };
  }

  if (Object.keys(dayRates).length === 0) {
    return null;
  }

  let cleaningFee = 0;
  const settings = asRecord(record['rate_settings']);
  const feeList = settings && Array.isArray(settings['fees']) ? settings['fees'] : [];
  for (const fee of feeList) {
    const feeRecord = asRecord(fee);
    const price = feeRecord ? asRecord(feeRecord['price']) : null;
    const amount = price ? asNumber(price['amount']) : null;
    if (amount != null) {
      cleaningFee += amount;
    }
  }

  return {
    dayRates,
    cleaningFee,
    currency: (settings && asString(settings['currency_code'])) || 'USD',
  };
}

export function parseQuote(payload: unknown): LodgifyQuote | null {
  const record = asRecord(payload);
  if (!record) {
    return null;
  }

  const total =
    asNumber(record['total_including_vat']) ??
    asNumber(record['total_incl_vat']) ??
    asNumber(record['total_price']) ??
    asNumber(record['total']) ??
    asNumber(record['amount']) ??
    asNumber(record['price']);

  if (total == null) {
    return null;
  }

  return {
    totalPrice: total,
    currency: asString(record['currency_code']) ?? asString(record['currency']) ?? 'USD',
  };
}

export function parseBookingId(body: string): number | null {
  const trimmed = body.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === 'number' && Number.isFinite(parsed)) {
      return parsed;
    }

    const record = asRecord(parsed);
    const id = record ? asNumber(record['id']) : null;
    return id;
  } catch {
    return null;
  }
}

function extractErrorMessage(body: string, status: number): string {
  try {
    const record = asRecord(JSON.parse(body));
    const message = record ? asString(record['message']) ?? asString(record['error']) : null;
    if (message) {
      return message;
    }
  } catch {
    // Use the raw body when it is not JSON.
  }

  const trimmed = body.trim();
  return trimmed || `Lodgify booking failed (${status}).`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
