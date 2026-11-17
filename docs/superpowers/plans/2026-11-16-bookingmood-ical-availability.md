# Bookingmood iCal Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the multi-cabin calendar and checkout use Bookingmood availability, which now includes each cabin's imported Airbnb iCal, and delete the temporary Airbnb calendar overlay.

**Architecture:** `POST /api/availability` and checkout's range check call Bookingmood `GET /availability` with `perform_sync=true`. Bookingmood refreshes the imported Airbnb feeds before it answers, and it syncs a feed at most once every 5 minutes. Imported events are stored as confirmed, so they come back as `booked` intervals. The Angular group calendar already paints those day statuses and does not change.

**Tech Stack:** Cloudflare Worker (`workers/booking-calendar`), Vitest, Bookingmood REST `GET /availability`.

## Global Constraints

- Do not call Airbnb's `PdpAvailabilityCalendar` query or `https://www.bookingmood.com/api/airbnb-availability/`.
- Do not commit API keys, iCal `t=` tokens, or `.dev.vars`.
- Keep `show_booked_as=booked`, `show_closed_as=closed`, and `show_pending_as=TENTATIVE`.
- Pass `performSync: true` from both `buildAvailabilityResponse` and `isCabinRangeAvailable`.
- A missing product id stays `availabilityState: 'unconfigured'` and `available: false`. A thrown Bookingmood availability call stays `availabilityState: 'error'` and `available: false`.
- Checkout writes stay behind `isBookingWriteEnabled`. The removed preview flag must not force `bookingEnabled` off.
- Do not filter the May 15, 2027–November 18, 2027 block. That is Airbnb's closed booking window and must show as `booked` on every cabin.
- Worker tests use mocks only. No live Bookingmood or Airbnb calls in Vitest.
- Do not edit the Angular group calendar, cabin pages, the review importer (`airbnbListingToCabinSlug`), or the Bookingmood timeline widget (`bookingmood-widget.ts`). The widget is checkout, not the calendar source this plan replaces.

## File structure

- Modify `workers/booking-calendar/src/availability.ts` — Bookingmood is the only availability source. Owns `buildAvailabilityResponse` and `isCabinRangeAvailable`.
- Modify `workers/booking-calendar/src/availability.spec.ts` — locks sync, booked iCal nights, and "no Airbnb fetch".
- Modify `workers/booking-calendar/src/booking-config.ts` — drop the Airbnb preview env fields and the write-gate exception.
- Delete `workers/booking-calendar/src/airbnb-preview.ts` — undocumented Airbnb client and the night-overlay helper.
- Delete `workers/booking-calendar/src/airbnb-preview.spec.ts` — tests for that client.
- Modify `wrangler.jsonc`, `wrangler.booking-test.jsonc`, `.env.example` — remove `AIRBNB_*` configuration.
- Modify `docs/bookingmood/README.md` — replace the temporary-preview section with the iCal contract.
- Do not modify `src/app/features/group-booking/**` or `src/app/core/services/booking-api.service.ts`. They already `POST /api/availability` and store `days`.

---

### Task 1: Read availability from Bookingmood only

**Files:**
- Modify: `workers/booking-calendar/src/availability.spec.ts`
- Modify: `workers/booking-calendar/src/availability.ts`
- Modify: `workers/booking-calendar/src/booking-config.ts`
- Delete: `workers/booking-calendar/src/airbnb-preview.ts`
- Delete: `workers/booking-calendar/src/airbnb-preview.spec.ts`

**Interfaces:**
- Consumes: `BookingmoodClient.getAvailability({ productIds: string[]; performSync?: boolean })` returning `BookingmoodAvailabilityRow[]` (`product_id`, `intervals[].status` of `available | booked | closed | pending | unavailable`). `BookingmoodClient.search` returning `BookingmoodSearchResult` (`productId`, `price: { min, max } | null`, cents). `mapAvailabilityRowsToDays` and `isStayAvailable` in `bookingmood-interval-map.ts`. `isBookingWriteEnabled(env: BookingWorkerEnv): boolean`.
- Produces: `buildAvailabilityResponse(request, client, env, origin)` returns `{ cabins: CabinAvailability[]; bookingEnabled: boolean }` using only Bookingmood rows. `isCabinRangeAvailable(client, env, cabinId, arrival, departure): Promise<boolean>` returns false when any night in `[arrival, departure)` is not `available`. Both call `getAvailability` with `performSync: true`. `BookingWorkerEnv` no longer has `AIRBNB_PREVIEW_ENABLED`, `AIRBNB_LISTING_MAP`, `AIRBNB_WEB_API_KEY`, or `AIRBNB_PREVIEW_UPSTREAM`. `parseAirbnbListingMap` and `isAirbnbPreviewEnabled` are deleted.

- [ ] **Step 1: Write the failing test**

Replace `workers/booking-calendar/src/availability.spec.ts` with:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildAvailabilityResponse, isCabinRangeAvailable } from './availability';
import type { BookingWorkerEnv } from './booking-config';
import type { BookingmoodClient } from './bookingmood-client';

const PRODUCT = '11111111-1111-4111-8111-111111111111';

function env(overrides: Record<string, unknown> = {}): BookingWorkerEnv {
  return {
    ASSETS: {} as Fetcher,
    BOOKINGMOOD_API_KEY: 'test',
    BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT }),
    ...overrides,
  } as BookingWorkerEnv;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildAvailabilityResponse', () => {
  it('marks cabins unavailable on provider errors (never falsely available)', async () => {
    const client = {
      getAvailability: vi.fn().mockRejectedValue(new Error('upstream down')),
      search: vi.fn(),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-07-01', departure: '2026-07-03', adults: 2 },
      client,
      env(),
      'https://example.com',
    );

    expect(result.cabins.find((c) => c.cabinId === 1)?.available).toBe(false);
    expect(result.cabins.find((c) => c.cabinId === 1)?.availabilityState).toBe('error');
    expect(client.search).not.toHaveBeenCalled();
  });

  it('syncs imported iCal feeds and does not call Airbnb', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('Airbnb must not be called');
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT,
          intervals: [
            { start: '2026-11-01T00:00', end: '2026-11-13T00:00', status: 'available' },
            { start: '2026-11-13T00:00', end: '2026-11-16T00:00', status: 'booked' },
            { start: '2026-11-16T00:00', end: '2026-12-01T00:00', status: 'available' },
          ],
        },
      ]),
      search: vi.fn().mockResolvedValue([
        { productId: PRODUCT, price: { min: 20000, max: 20000 } },
      ]),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      client,
      env({
        AIRBNB_PREVIEW_ENABLED: 'true',
        AIRBNB_LISTING_MAP: JSON.stringify({ 1: '1522512039110168394' }),
        AIRBNB_WEB_API_KEY: 'stale-key',
      }),
      'https://example.com',
    );

    expect(client.getAvailability).toHaveBeenCalledWith({
      productIds: [PRODUCT],
      performSync: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();

    const blackGum = result.cabins.find((cabin) => cabin.cabinId === 1)!;
    expect(blackGum.availabilityState).toBe('ok');
    expect(blackGum.days['2026-11-09']).toBe('available');
    expect(blackGum.days['2026-11-13']).toBe('booked');
    expect(blackGum.available).toBe(true);
    expect(blackGum.totalPrice).toBe(200);
    expect(blackGum.nightlyRate).toBeCloseTo(200 / 3);

    const dogwood = result.cabins.find((cabin) => cabin.cabinId === 2)!;
    expect(dogwood.available).toBe(false);
    expect(dogwood.availabilityState).toBe('unconfigured');
  });

  it('keeps checkout enabled when stale Airbnb preview env is still present', async () => {
    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT,
          intervals: [
            { start: '2026-11-09T00:00', end: '2026-11-12T00:00', status: 'available' },
          ],
        },
      ]),
      search: vi.fn().mockResolvedValue([]),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-11-09', departure: '2026-11-12', adults: 2 },
      client,
      env({
        BOOKING_STATE: {} as KVNamespace,
        BOOKING_COORDINATOR: {} as DurableObjectNamespace,
        BOOKINGMOOD_CAPACITY_GROUP_ID: '22222222-2222-4222-8222-222222222222',
        BOOKINGMOOD_FORM_SERVICES: JSON.stringify({
          name: PRODUCT,
          email: '33333333-3333-4333-8333-333333333333',
        }),
        BOOKINGMOOD_BOOKING_ENABLED: 'true',
        AIRBNB_PREVIEW_ENABLED: 'true',
      }),
      'https://example.com',
    );

    expect(result.bookingEnabled).toBe(true);
  });
});

describe('isCabinRangeAvailable', () => {
  it('refreshes the iCal feed and rejects a stay that covers a booked night', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('Airbnb must not be called');
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = {
      getAvailability: vi.fn().mockResolvedValue([
        {
          product_id: PRODUCT,
          intervals: [
            { start: '2026-11-13T00:00', end: '2026-11-16T00:00', status: 'booked' },
          ],
        },
      ]),
    } as unknown as BookingmoodClient;

    const open = await isCabinRangeAvailable(
      client,
      env({
        AIRBNB_PREVIEW_ENABLED: 'true',
        AIRBNB_LISTING_MAP: JSON.stringify({ 1: '1522512039110168394' }),
        AIRBNB_WEB_API_KEY: 'stale-key',
      }),
      1,
      '2026-11-13',
      '2026-11-16',
    );

    expect(open).toBe(false);
    expect(client.getAvailability).toHaveBeenCalledWith({
      productIds: [PRODUCT],
      performSync: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run workers/booking-calendar/src/availability.spec.ts`

Expected: FAIL. With `AIRBNB_PREVIEW_ENABLED: 'true'` the current code never calls `getAvailability`, so `toHaveBeenCalledWith` fails with 0 calls. `bookingEnabled` is false because `isAirbnbPreviewEnabled` forces writes off.

- [ ] **Step 3: Write the minimal implementation**

In `workers/booking-calendar/src/availability.ts`, replace the import block and `buildAvailabilityResponse` / `isCabinRangeAvailable` so Airbnb is not imported and both calls pass `performSync: true`.

Imports:

```ts
import { CABIN_CONFIG } from '../../../src/environments/cabin-config';
import {
  AvailabilityState,
  CabinAvailability,
} from '../../../src/app/core/models/booking.models';
import { addDays, eachNight, parseDateKey, toDateKey } from '../../../src/app/core/utils/date-utils';
import {
  allowlistedProductIds,
  BookingWorkerEnv,
  hasBookingmoodApiKey,
  isBookingWriteEnabled,
  occupancyForAdults,
  resolveCabinProducts,
} from './booking-config';
import { BookingmoodClient } from './bookingmood-client';
import {
  isStayAvailable,
  mapAvailabilityRowsToDays,
} from './bookingmood-interval-map';
import { mapPublicProducts } from './public-product-dto';
```

Replace `buildAvailabilityResponse` with:

```ts
export async function buildAvailabilityResponse(
  request: AvailabilityRequest,
  client: BookingmoodClient,
  env: BookingWorkerEnv,
  origin: string,
): Promise<{ cabins: CabinAvailability[]; bookingEnabled: boolean }> {
  const arrival = parseDateKey(request.arrival);
  const departure = parseDateKey(request.departure);
  const nights = eachNight(arrival, departure);
  const windowStart = addDays(arrival, -2);
  const windowEnd = addDays(departure, 2);
  const windowNights = eachNight(windowStart, windowEnd);

  const products = resolveCabinProducts(env);
  const allowlisted = allowlistedProductIds(env);

  if (!hasBookingmoodApiKey(env) || allowlisted.length === 0) {
    return {
      bookingEnabled: false,
      cabins: products.map((cabin) =>
        unavailableCabin(cabin.cabinId, windowNights, origin, cabin.slug, 'unconfigured'),
      ),
    };
  }

  let rows: Awaited<ReturnType<BookingmoodClient['getAvailability']>> = [];
  let availabilityError = false;

  try {
    rows = await client.getAvailability({ productIds: allowlisted, performSync: true });
  } catch (error) {
    availabilityError = true;
    console.error('bookingmood_availability_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  let searchResults: Awaited<ReturnType<BookingmoodClient['search']>> = [];
  if (nights.length > 0 && !availabilityError) {
    try {
      searchResults = await client.search({
        interval: { start: toDateKey(arrival), end: toDateKey(departure) },
        productIds: allowlisted,
        occupancy: occupancyForAdults(env, request.adults),
      });
    } catch (error) {
      console.error('bookingmood_search_failed', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const cabins = products.map((cabin) => {
    if (!cabin.productId) {
      return unavailableCabin(cabin.cabinId, windowNights, origin, cabin.slug, 'unconfigured');
    }

    if (availabilityError) {
      return unavailableCabin(cabin.cabinId, windowNights, origin, cabin.slug, 'error');
    }

    const days = mapAvailabilityRowsToDays(rows, cabin.productId, windowNights);
    const stayAvailable = isStayAvailable(days, request.arrival, request.departure);
    const search = searchResults.find((item) => item.productId === cabin.productId);
    const currency = 'USD';
    let totalPrice = 0;
    let nightlyRate = 0;

    if (search?.price && nights.length > 0) {
      totalPrice = (search.price.min + search.price.max) / 2 / 100;
      nightlyRate = totalPrice / nights.length;
    }

    return {
      cabinId: cabin.cabinId,
      nightlyRate,
      totalPrice,
      currency,
      available: stayAvailable,
      days,
      dayRates: {},
      cleaningFee: 0,
      availabilityState: 'ok' satisfies AvailabilityState,
      bookingUrl: `${origin}/cabins/${cabin.slug}`,
    } satisfies CabinAvailability;
  });

  return {
    cabins,
    bookingEnabled: isBookingWriteEnabled(env),
  };
}
```

Replace `isCabinRangeAvailable` with:

```ts
export async function isCabinRangeAvailable(
  client: BookingmoodClient,
  env: BookingWorkerEnv,
  cabinId: number,
  arrival: string,
  departure: string,
): Promise<boolean> {
  const productId = resolveCabinProducts(env).find((c) => c.cabinId === cabinId)?.productId;
  if (!productId) {
    return false;
  }

  const rows = await client.getAvailability({ productIds: [productId], performSync: true });
  const nights = eachNight(parseDateKey(arrival), parseDateKey(departure));
  const days = mapAvailabilityRowsToDays(rows, productId, nights);
  return isStayAvailable(days, arrival, departure);
}
```

Leave `unavailableCabin`, `listPublicProducts`, and `cabinCatalogMeta` as they are.

In `workers/booking-calendar/src/booking-config.ts`:

- Delete the four `AIRBNB_*` fields from `BookingWorkerEnv`.
- Delete `parseAirbnbListingMap` and `isAirbnbPreviewEnabled`.
- In `isBookingWriteEnabled`, replace the first condition so the preview flag is gone:

```ts
export function isBookingWriteEnabled(env: BookingWorkerEnv): boolean {
  if (!isExplicitBookingWriteFlagEnabled(env)) {
    return false;
  }
```

The rest of `isBookingWriteEnabled` stays the same.

Delete these files:

- `workers/booking-calendar/src/airbnb-preview.ts`
- `workers/booking-calendar/src/airbnb-preview.spec.ts`

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:booking-worker`

Expected: PASS. `availability.spec.ts` covers the iCal sync. `checkout.spec.ts` still passes because its mocked `getAvailability` returns an open interval. No test file imports `./airbnb-preview`.

- [ ] **Step 5: Commit**

```bash
git add workers/booking-calendar/src/availability.ts workers/booking-calendar/src/availability.spec.ts workers/booking-calendar/src/booking-config.ts workers/booking-calendar/src/airbnb-preview.ts workers/booking-calendar/src/airbnb-preview.spec.ts
git commit -m "feat: read multi-cabin availability from Bookingmood iCal sync"
```

---

### Task 2: Remove the preview configuration and document the iCal source

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `wrangler.booking-test.jsonc`
- Modify: `.env.example`
- Modify: `docs/bookingmood/README.md`

**Interfaces:**
- Consumes: Task 1's `BookingWorkerEnv` with no `AIRBNB_*` fields.
- Produces: Wrangler configs and the local env example no longer mention `AIRBNB_LISTING_MAP`, `AIRBNB_PREVIEW_ENABLED`, `AIRBNB_WEB_API_KEY`, or `AIRBNB_PREVIEW_UPSTREAM`. `docs/bookingmood/README.md` describes iCal as the Airbnb source.

- [ ] **Step 1: Remove the Worker vars**

`wrangler.jsonc` currently has a `vars` object whose only key is `AIRBNB_LISTING_MAP`. Delete the whole `vars` object, including the trailing comma that would otherwise sit before `assets`.

`wrangler.booking-test.jsonc` keeps `BOOKINGMOOD_BOOKING_ENABLED`. Delete only the `AIRBNB_LISTING_MAP` line, so `vars` is:

```jsonc
  "vars": {
    "BOOKINGMOOD_BOOKING_ENABLED": "false"
  },
```

- [ ] **Step 2: Remove the env example**

In `.env.example`, delete the block from the comment `# Temporary Airbnb availability preview` through `AIRBNB_PREVIEW_UPSTREAM=`. Leave `BOOKINGMOOD_BOOKING_ENABLED=false` and the Worker-bindings comment.

- [ ] **Step 3: Replace the temporary-preview section in the Bookingmood doc**

In `docs/bookingmood/README.md`, delete the section that starts at `## Temporary Airbnb preview` and runs through the `**Removal:**` paragraph (the paragraph that tells you to delete `airbnb-preview.ts` and the `AIRBNB_*` secrets). Leave `## Airbnb / iCal` and the sentence under it, then add:

```markdown
## Airbnb availability

Each cabin's Airbnb calendar is an imported iCal feed on its Bookingmood unit (Synchronization → Import iCal feed), with event status set to confirmed. `POST /api/availability` and checkout call Bookingmood `GET /availability` with `perform_sync=true`. Bookingmood refreshes those feeds before answering, and it syncs a given feed at most once every 5 minutes. Confirmed imported events come back as `booked`.

The Worker does not call Airbnb. The Bookingmood export that Airbnb reads must leave "Include events from imported calendars" off, so Airbnb bookings are not sent back to Airbnb through Bookingmood.

Dates past Airbnb's open booking window are imported as booked. As of the November 16, 2026 import, every cabin has a block from May 15, 2027 through November 18, 2027. The site shows those nights as booked until they are opened on Airbnb.
```

- [ ] **Step 4: Verify nothing still references the preview**

Run:

```bash
rg -n "AIRBNB_|airbnb-preview|airbnbStatuses|PdpAvailability|isAirbnbPreviewEnabled|parseAirbnbListingMap" --glob '!package-lock.json'
npm run test:booking-worker
```

Expected: `rg` prints no matches. Vitest exits 0.

`src/app/core/utils/reviews.ts` contains `airbnbListingToCabinSlug`. That helper maps review titles to cabins. It is not the calendar preview. The search above does not match it. Do not edit it.

- [ ] **Step 5: Commit**

```bash
git add wrangler.jsonc wrangler.booking-test.jsonc .env.example docs/bookingmood/README.md
git commit -m "docs: drop the temporary Airbnb calendar preview"
```

---

### Task 3: Point the deployed Worker at the product map, then remove the old secrets

This task is done after Tasks 1 and 2 are deployed. Do not commit secret values. Do not run `wrangler secret delete` before the new Worker is serving Bookingmood nights.

**Files:** none. Cloudflare secrets and the local gitignored `.dev.vars` only.

**Interfaces:**
- Consumes: the deployed Worker from Tasks 1 and 2, and the six live Bookingmood product ids below.
- Produces: `BOOKINGMOOD_PRODUCT_MAP` on `remotely-rogers-booking` maps cabin ids 1–6 to those products. `AIRBNB_PREVIEW_ENABLED` and `AIRBNB_WEB_API_KEY` are deleted after the calendar check passes.

The product ids are the ones already committed in `src/app/core/booking/bookingmood-products.ts` (`BOOKINGMOOD_PRODUCT_IDS`). They were checked against the Rentals by Hong Davis account on November 16, 2026. If a unit is recreated, update that constant and the secret together. Do not reuse an id from a deleted unit.

```text
{"1":"936c1ff7-2900-410b-9ced-cc2cf6ec3b65","2":"c7f5ee68-02db-49b5-ae79-85445daa73bf","3":"6fae95f0-7d51-4919-8a66-c097cb9e42bf","4":"1766c9dd-23da-4e30-95ba-c9ef9c8e89ca","5":"39fdf060-b2e7-47c1-9891-3fc6fcbf8804","6":"25557f1a-5582-4258-9eba-b08a7233e463"}
```

Cabin ids match `src/environments/cabin-config.ts`: 1 Black Gum Getaway, 2 Dogwood Den, 3 Running Spring Retreat, 4 Black Walnut Bungalow, 5 White Oak Haven, 6 Post Oak Perch.

- [ ] **Step 1: Set the product map before deploy**

The preview path does not need `BOOKINGMOOD_PRODUCT_MAP`. The new path does. If that secret is missing, every cabin comes back `unconfigured` and the calendar looks empty.

From `workers/booking-calendar` is wrong; run Wrangler from the repo root, where `wrangler.jsonc` lives:

```bash
npx wrangler secret put BOOKINGMOOD_API_KEY
npx wrangler secret put BOOKINGMOOD_PRODUCT_MAP
```

Paste the existing Rentals by Hong Davis API key when prompted for the first secret. Paste the one-line JSON above for the second. Repeat with `-c wrangler.booking-test.jsonc` only if that test Worker should show the same calendars.

In local `.dev.vars` (gitignored), set the same two values and delete any `AIRBNB_PREVIEW_ENABLED`, `AIRBNB_LISTING_MAP`, `AIRBNB_WEB_API_KEY`, and `AIRBNB_PREVIEW_UPSTREAM` lines.

- [ ] **Step 2: Deploy the booking Worker**

```bash
npm run deploy:booking-worker
```

Expected: Wrangler reports a successful deploy of `remotely-rogers-booking`.

- [ ] **Step 3: Check a known Airbnb stay on the live calendar**

Black Gum's imported feed has a confirmed stay November 13–16, 2026 (departure exclusive, so the nights are the 13th, 14th, and 15th).

```bash
curl -s -X POST https://remotely-rogers-booking.drakedavisdev.workers.dev/api/availability \
  -H 'content-type: application/json' \
  -H 'origin: https://remotelyrogers.com' \
  -d '{"arrival":"2026-11-12","departure":"2026-11-17","adults":2}'
```

Expected for cabin id 1:

- `availabilityState` is `ok`
- `days["2026-11-13"]`, `days["2026-11-14"]`, and `days["2026-11-15"]` are `booked`
- `available` is false

Then open `https://remotely-rogers-booking.drakedavisdev.workers.dev/group-booking`, search November 12–17, 2026, and confirm Black Gum is not selectable for that stay. A night inside the May 15, 2027–November 18, 2027 window shows as booked on all six cabins.

If cabin 1 is `unconfigured`, stop. The product map secret did not apply. Do not delete the Airbnb secrets.

- [ ] **Step 4: Delete the unused Airbnb secrets**

Only after Step 3 matches. These secrets are unused by the new code. Deleting them first would matter only if you rolled back to the preview build.

```bash
npx wrangler secret delete AIRBNB_PREVIEW_ENABLED
npx wrangler secret delete AIRBNB_WEB_API_KEY
```

If the test Worker has those secrets, run the same commands with `-c wrangler.booking-test.jsonc`.

`AIRBNB_LISTING_MAP` was a var, not a secret. Task 2 already removed it. The next deploy is what drops it from the Worker. Step 2 is that deploy.
