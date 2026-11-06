import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AIRBNB_CALENDAR_QUERY_HASH,
  DEFAULT_AIRBNB_PREVIEW_UPSTREAM,
  mapAirbnbDaysToStatuses,
  monthSpan,
} from './airbnb-preview';
import { buildAvailabilityResponse } from './availability';
import { BookingWorkerEnv, isBookingWriteEnabled, parseAirbnbListingMap } from './booking-config';
import type { BookingmoodClient } from './bookingmood-client';
import { eachNight, parseDateKey } from '../../../src/app/core/utils/date-utils';

const BLACK_GUM_LISTING = '1522512039110168394';
const PRODUCT = '11111111-1111-4111-8111-111111111111';

/** Trimmed from a live PdpAvailabilityCalendar response for Black Gum (Nov 2026). */
const FIXTURE = {
  data: {
    merlin: {
      pdpAvailabilityCalendar: {
        __typename: 'MerlinPdpAvailabilityCalendar',
        calendarMonths: [
          {
            __typename: 'MerlinCalendarMonth',
            month: 11,
            year: 2026,
            days: [
              day('2026-11-07', false, false, false, 2),
              day('2026-11-08', true, true, false, 1),
              day('2026-11-09', true, true, true, 1),
              day('2026-11-10', true, true, true, 1),
              day('2026-11-11', true, true, true, 1),
              day('2026-11-12', true, true, true, 1),
              day('2026-11-13', false, false, true, 2),
              day('2026-11-14', false, false, false, 2),
              day('2026-11-15', false, false, false, 1),
              day('2026-11-16', true, true, false, 1),
            ],
          },
        ],
      },
    },
  },
};

function day(
  calendarDate: string,
  available: boolean,
  availableForCheckin: boolean,
  availableForCheckout: boolean,
  minNights: number,
) {
  return {
    __typename: 'MerlinCalendarDay',
    calendarDate,
    available,
    availableForCheckin,
    availableForCheckout,
    minNights,
    maxNights: 365,
    bookable: null,
    price: { __typename: 'MerlinCalendarDayPrice', localPriceFormatted: null },
  };
}

function previewEnv(overrides: Partial<BookingWorkerEnv> = {}): BookingWorkerEnv {
  return {
    ASSETS: {} as Fetcher,
    AIRBNB_PREVIEW_ENABLED: 'true',
    AIRBNB_LISTING_MAP: JSON.stringify({ 1: BLACK_GUM_LISTING }),
    AIRBNB_WEB_API_KEY: 'test-web-key',
    ...overrides,
  };
}

function bookingmoodClient(): BookingmoodClient {
  return {
    getAvailability: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
  } as unknown as BookingmoodClient;
}

function stubFetch(response: Response | (() => Response)) {
  const fetchMock = vi.fn(async () =>
    typeof response === 'function' ? response() : response.clone(),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseAirbnbListingMap', () => {
  it('keeps numeric listing ids only', () => {
    expect(
      parseAirbnbListingMap(
        JSON.stringify({ 1: BLACK_GUM_LISTING, 2: 'not-a-listing', 3: 42, x: '123', 4: '' }),
      ),
    ).toEqual({ 1: BLACK_GUM_LISTING, 3: '42' });
    expect(parseAirbnbListingMap('{bad json')).toEqual({});
    expect(parseAirbnbListingMap(undefined)).toEqual({});
  });
});

describe('mapAirbnbDaysToStatuses', () => {
  it('maps available/unavailable and leaves nights outside the response unknown', () => {
    const nights = eachNight(parseDateKey('2026-11-05'), parseDateKey('2026-11-10'));
    const days = FIXTURE.data.merlin.pdpAvailabilityCalendar.calendarMonths[0].days;

    expect(mapAirbnbDaysToStatuses(days, nights)).toEqual({
      '2026-11-05': 'unknown',
      '2026-11-06': 'unknown',
      '2026-11-07': 'blocked',
      '2026-11-08': 'available',
      '2026-11-09': 'available',
    });
  });
});

describe('monthSpan', () => {
  it('covers every month the window touches, capped at 12', () => {
    expect(monthSpan(eachNight(parseDateKey('2026-11-28'), parseDateKey('2027-01-03')))).toEqual({
      year: 2026,
      month: 11,
      count: 3,
    });
    expect(
      monthSpan(eachNight(parseDateKey('2026-01-01'), parseDateKey('2027-06-01'))).count,
    ).toBe(12);
  });
});

describe('buildAvailabilityResponse with the Airbnb preview', () => {
  it('sends the web key header and persisted query to the default upstream', async () => {
    const fetchMock = stubFetch(Response.json(FIXTURE));

    await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      bookingmoodClient(),
      previewEnv(),
      'https://example.com',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit & { cf?: unknown }];
    const parsed = new URL(url);
    expect(`${parsed.origin}${parsed.pathname}`).toBe(DEFAULT_AIRBNB_PREVIEW_UPSTREAM);
    expect(parsed.searchParams.get('operationName')).toBe('PdpAvailabilityCalendar');
    expect(parsed.searchParams.get('currency')).toBe('USD');
    expect(JSON.parse(parsed.searchParams.get('variables')!)).toEqual({
      request: { listingId: BLACK_GUM_LISTING, count: 1, year: 2026, month: 11 },
    });
    expect(JSON.parse(parsed.searchParams.get('extensions')!)).toEqual({
      persistedQuery: { version: 1, sha256Hash: AIRBNB_CALENDAR_QUERY_HASH },
    });
    expect((init.headers as Record<string, string>)['X-Airbnb-Api-Key']).toBe('test-web-key');
    expect(init.cf).toEqual({ cacheTtl: 300 });
  });

  it('uses AIRBNB_PREVIEW_UPSTREAM when set', async () => {
    const fetchMock = stubFetch(Response.json(FIXTURE));
    const direct = `https://www.airbnb.com/api/v3/PdpAvailabilityCalendar/${AIRBNB_CALENDAR_QUERY_HASH}`;

    await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      bookingmoodClient(),
      previewEnv({ AIRBNB_PREVIEW_UPSTREAM: direct }),
      'https://example.com',
    );

    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(new RegExp(`^${direct}\\?`));
  });

  it('paints days, computes stay availability, and marks unmapped cabins unconfigured', async () => {
    stubFetch(Response.json(FIXTURE));

    const open = await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      bookingmoodClient(),
      previewEnv(),
      'https://example.com',
    );
    const blackGum = open.cabins.find((c) => c.cabinId === 1)!;

    expect(blackGum.availabilityState).toBe('ok');
    expect(blackGum.available).toBe(true);
    expect(blackGum.totalPrice).toBe(0);
    expect(blackGum.days).toEqual({
      '2026-11-07': 'blocked',
      '2026-11-08': 'available',
      '2026-11-09': 'available',
      '2026-11-10': 'available',
      '2026-11-11': 'available',
      '2026-11-12': 'available',
      '2026-11-13': 'blocked',
    });
    expect(open.cabins.find((c) => c.cabinId === 2)?.availabilityState).toBe('unconfigured');

    const overlapping = await buildAvailabilityResponse(
      { arrival: '2026-11-11', departure: '2026-11-14', adults: 2 },
      bookingmoodClient(),
      previewEnv(),
      'https://example.com',
    );
    expect(overlapping.cabins.find((c) => c.cabinId === 1)?.available).toBe(false);
  });

  it('marks a cabin error on non-200 or malformed upstream responses', async () => {
    stubFetch(new Response('{"error":"invalid_key"}', { status: 400 }));
    const rejected = await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      bookingmoodClient(),
      previewEnv(),
      'https://example.com',
    );
    expect(rejected.cabins.find((c) => c.cabinId === 1)).toMatchObject({
      availabilityState: 'error',
      available: false,
    });

    stubFetch(() => new Response('<html>not json</html>', { status: 200 }));
    const malformed = await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      bookingmoodClient(),
      previewEnv(),
      'https://example.com',
    );
    const cabin = malformed.cabins.find((c) => c.cabinId === 1)!;
    expect(cabin.availabilityState).toBe('error');
    expect(Object.values(cabin.days).every((status) => status === 'unknown')).toBe(true);
  });

  it('marks a cabin error when the web key is missing', async () => {
    const fetchMock = stubFetch(Response.json(FIXTURE));
    const result = await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      bookingmoodClient(),
      previewEnv({ AIRBNB_WEB_API_KEY: '' }),
      'https://example.com',
    );

    expect(result.cabins.find((c) => c.cabinId === 1)?.availabilityState).toBe('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('takes precedence over a configured Bookingmood account and disables booking', async () => {
    stubFetch(Response.json(FIXTURE));
    const client = bookingmoodClient();
    const env = previewEnv({
      BOOKINGMOOD_API_KEY: 'test',
      BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT }),
      BOOKINGMOOD_BOOKING_ENABLED: 'true',
    });

    const result = await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      client,
      env,
      'https://example.com',
    );

    expect(result.bookingEnabled).toBe(false);
    expect(isBookingWriteEnabled(env)).toBe(false);
    expect(result.cabins.find((c) => c.cabinId === 1)?.days['2026-11-13']).toBe('blocked');
    expect(client.getAvailability).not.toHaveBeenCalled();
    expect(client.search).not.toHaveBeenCalled();
  });

  it('uses the Bookingmood path when the flag is off', async () => {
    const fetchMock = stubFetch(Response.json(FIXTURE));
    const client = bookingmoodClient();

    await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      client,
      previewEnv({
        AIRBNB_PREVIEW_ENABLED: 'false',
        BOOKINGMOOD_API_KEY: 'test',
        BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT }),
      }),
      'https://example.com',
    );

    expect(client.getAvailability).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
