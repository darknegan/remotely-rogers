# Bookingmood integration

Official API: [API reference](https://www.bookingmood.com/en-US/api-reference) · [OpenAPI](https://api.bookingmood.com/v1/openapi.json)

## Secrets (names only)

Set on the **booking Worker** with Wrangler — never in Angular or git:

| Secret | Purpose |
|--------|---------|
| `BOOKINGMOOD_API_KEY` | Bearer token (org-scoped) |
| `BOOKINGMOOD_WEBHOOK_SIGNING_SECRET` | Standard Webhooks HMAC verification |
| `BOOKINGMOOD_PRODUCT_MAP` | Optional JSON `{"1":"<product-uuid>",…}` cabin id → product |
| `BOOKINGMOOD_CAPACITY_GROUP_ID` | Occupancy map key for cart/book |
| `BOOKINGMOOD_FORM_SERVICES` | JSON map. A Bookingmood `name` service uses `{ "name", "email", "phone" }` and is sent as `{ first_name, last_name }`. Split text fields use `{ "firstName", "lastName", "email" }`. |
| `BOOKINGMOOD_BOOKING_ENABLED` | Must be **`true`** (explicit) to allow checkout writes; unset/`false`/other values keep writes off |

Copy `.env.example` → `.dev.vars` for local Worker dev.

## Worker bindings (required for checkout + verified status)

| Binding | Type | Purpose |
|---------|------|---------|
| `BOOKING_STATE` | KV | Webhook event dedupe; public-safe booking reference status |
| `BOOKING_COORDINATOR` | Durable Object (`BookingCoordinator`) | Atomic checkout idempotency per scope key + fingerprint |

Checkout writes are **disabled** until both bindings exist (see `isBookingWriteEnabled`). This does not provide provider exactly-once booking — only best-effort duplicate protection and webhook-verified status.

Replace placeholder KV ids in `wrangler.jsonc` with namespace ids from your Cloudflare account before deploy.

For an isolated nonproduction packaging profile (no bindings, writes off by default), see [NONPRODUCTION-TEST-WORKER.md](./NONPRODUCTION-TEST-WORKER.md).

## Product mapping

1. Create or locate each cabin as a Bookingmood **product** (account UI).
2. Map site cabin numeric ids (see `src/environments/cabin-config.ts`) to product UUIDs via `BOOKINGMOOD_PRODUCT_MAP`.
3. Run `npm run sync-bookingmood-products` (read-only) once a key is available to list product ids safely.

Public catalog: `GET /api/products` returns allowlisted DTO fields only (never `ical_export_secret`, `exact_address`, or `*`).

## Checkout

- Group cart: `POST /api/checkout` → `cart-validate` + `cart-checkout` (server-side pricing).
- Optional `Idempotency-Key` header scopes durable dedup; fingerprint always includes cart + guest email.
- Upstream timeout/5xx → **indeterminate** (503/504); do not auto-retry.
- Guest pays via Bookingmood `payment_url` when provided (HTTPS allowlist); empty URL does not imply success.
- `GET /api/booking/status?reference=` returns webhook-backed public status (payment vs confirmation separate).

Retired legacy payment/session routes return **410**.

## Webhooks

`POST /api/bookingmood/webhook` verifies **Standard Webhooks** (`webhook-id`, `webhook-timestamp`, `webhook-signature`) on raw body. Legacy-only `X-Signature` (MD5) is rejected; requests with both Standard and legacy headers authenticate via Standard only.

Event JSON shape: `{ id, date, event_type, payload: { new, old } }` per [webhook docs](https://www.bookingmood.com/en-US/docs/developers/webhooks).

Handled types:

- `payments.paid` → `paymentRecorded` on reference
- `calendar_events.confirmed` → `bookingConfirmed`
- `calendar_events.cancelled` → `cancelled`

Other types are acknowledged but ignored. Dedupe uses `BOOKING_STATE` KV keyed by event `id`.

## Airbnb / iCal

Bookingmood sync is **iCal import/export**, not full listing import. See [iCal synchronization](https://www.bookingmood.com/en-US/docs/synchronization/ical).

## Airbnb availability

Each cabin's Airbnb calendar is an imported iCal feed on its Bookingmood unit (Synchronization → Import iCal feed), with event status set to confirmed. `POST /api/availability` and checkout call Bookingmood `GET /availability` with `perform_sync=true`. Bookingmood refreshes those feeds before answering, and it syncs a given feed at most once every 5 minutes. Confirmed imported events come back as `booked`.

The Worker does not call Airbnb. The Bookingmood export that Airbnb reads must leave "Include events from imported calendars" off, so Airbnb bookings are not sent back to Airbnb through Bookingmood.

Dates past Airbnb's open booking window are imported as booked. As of the November 16, 2026 import, every cabin has a block from May 15, 2027 through November 18, 2027. The site shows those nights as booked until they are opened on Airbnb.

## Switching to a new Bookingmood account

API keys only work for the organization that created them, so every ID from the old account is invalid in the new one.

1. In the new account, create six units, one per cabin, using the same names.
2. Under **Settings › API keys**, create a key.
3. Locally, put the key in `.dev.vars` and run `BOOKINGMOOD_API_KEY=… npm run sync-bookingmood-products` (read-only; the script reads the key from the environment or `.env`). Record each unit's product UUID.
4. Replace every account-specific value on the booking Worker with `npx wrangler secret put` (add `-c wrangler.booking-test.jsonc` for the test Worker): `BOOKINGMOOD_API_KEY`, `BOOKINGMOOD_PRODUCT_MAP` (`{"1":"<uuid>",…,"6":"<uuid>"}`), `BOOKINGMOOD_CAPACITY_GROUP_ID`, and `BOOKINGMOOD_FORM_SERVICES`.
5. Register `https://<booking worker>/api/bookingmood/webhook` in the new account and update `BOOKINGMOOD_WEBHOOK_SIGNING_SECRET`. Delete the webhook in the old account.
6. Leave `BOOKINGMOOD_BOOKING_ENABLED` unset or `false` until payments and form services are configured in the new account.
7. Check that `GET /api/products` lists the new units.

## Cutover / rollback

1. Configure products, feeds, form services, and payment provider in Bookingmood.
2. Create KV + DO bindings; set secrets; `BOOKINGMOOD_BOOKING_ENABLED=true`.
3. Deploy booking Worker, verify `/api/availability`, register webhook, then deploy site Worker.
4. Rollback: redeploy previous Worker; reconcile in-flight payments in Bookingmood dashboard (pre-cutover gate).

Content snippet export for third-party HTML widgets: `npm run export:content-snippets` → `dist/content-snippets/` (neutral pipeline, separate from booking API).

## Pre-production release gates (not live-ready)

These are **review / cutover gates** — not automated in this migration PR:

| Gate | Notes |
|------|--------|
| **Concurrency / ordering** | Status merges are atomic per reference in `BookingCoordinator` DO; **KV webhook dedupe** is not cross-isolate atomic. Extreme parallel delivery may need operational monitoring. |
| **Checkout timeout E2E** | Coordinator marks stale pending **indeterminate**; full **cart-checkout timeout → guest outcome** path is not covered by Vitest E2E. |
| **Webhook before seed** | `calendar_events.*` needs `booking:id:{uuid}` from checkout; early webhook → **422** (retry). No live Bookingmood booking lookup in Worker yet. |
| **Cloudflare plan** | SQLite-backed Durable Object (`BookingCoordinator`, `state.storage`, `migrations.new_sqlite_classes`). The Workers free plan rejects classic `new_classes` migrations. |

Keep **`BOOKINGMOOD_BOOKING_ENABLED`** off until secrets, product map, bindings, and webhook registration are done. PR remains unmerged until review sign-off — not production approval.
