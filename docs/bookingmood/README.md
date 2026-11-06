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

## Temporary Airbnb preview

A stopgap so `POST /api/availability` shows real Airbnb availability before the cabins' Airbnb `.ics` feeds are imported into Bookingmood (`workers/booking-calendar/src/airbnb-preview.ts`).

- It calls Airbnb's **undocumented** `PdpAvailabilityCalendar` query through Bookingmood's `airbnb-availability` relay. It can break without warning if Airbnb rotates the query hash or web key, or if Bookingmood changes the route. Demo use only.
- It is **read-only**. While the flag is on, it takes precedence over the Bookingmood account even when a key and product map are set, `bookingEnabled` is `false`, and `POST /api/checkout` is refused. Nights come back as `available` or `blocked` (Airbnb doesn't say booked vs closed), prices are `0`, and nights outside the response are `unknown`.
- Upstream responses are cached at the edge for 5 minutes.

| Name | Type | Purpose |
|------|------|---------|
| `AIRBNB_PREVIEW_ENABLED` | var | `true` turns the preview on; anything else uses Bookingmood |
| `AIRBNB_LISTING_MAP` | var | JSON site cabin id → Airbnb listing id (numeric strings) |
| `AIRBNB_WEB_API_KEY` | secret | Airbnb's public web API key, sent as `X-Airbnb-Api-Key` |
| `AIRBNB_PREVIEW_UPSTREAM` | var (optional) | Override base URL, e.g. `https://www.airbnb.com/api/v3/PdpAvailabilityCalendar/<hash>` if the Bookingmood relay is blocked |

`AIRBNB_LISTING_MAP` is set in `vars` in `wrangler.jsonc` and `wrangler.booking-test.jsonc`:

```
AIRBNB_LISTING_MAP={"1":"1522512039110168394","2":"1547465342213988673","3":"1515997598220048670","4":"1511108076176473313","5":"1509551118415599833","6":"1497757944361518833"}
```

Enable on a deployed Worker (add `-c wrangler.booking-test.jsonc` for the test Worker). `AIRBNB_PREVIEW_ENABLED` is stored as a secret so `wrangler deploy` doesn't wipe it and it can be flipped without a redeploy:

```bash
npx wrangler secret put AIRBNB_WEB_API_KEY      # paste the d306… key
npx wrangler secret put AIRBNB_PREVIEW_ENABLED  # true
```

The web key is embedded in Airbnb's own page HTML. To get the current value:

```bash
curl -s -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' \
  https://www.airbnb.com/rooms/1522512039110168394 | rg -o '"key":"d306[a-z0-9]+"'
```

A cabin with no listing id is `unconfigured`; a failed or malformed upstream response (including a missing or stale key) is `error`.

**Removal:** import each cabin's Airbnb `.ics` into its unit in the Bookingmood account, confirm the Bookingmood calendar shows the Airbnb nights, then run `npx wrangler secret delete AIRBNB_PREVIEW_ENABLED` (locally, set it to `false` in `.dev.vars`). In a follow-up, delete `airbnb-preview.ts` and its spec, the `AIRBNB_*` env fields and helpers in `booking-config.ts`, the preview branch in `availability.ts`, `AIRBNB_LISTING_MAP` from the Wrangler `vars`, and the `AIRBNB_WEB_API_KEY` secret.

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
| **Cloudflare plan** | **Classic** Durable Object (`BookingCoordinator`, `state.storage`, `migrations.new_classes`). Confirm account Workers plan supports classic DOs; replace placeholder KV ids before deploy. |

Keep **`BOOKINGMOOD_BOOKING_ENABLED`** off until secrets, product map, bindings, and webhook registration are done. PR remains unmerged until review sign-off — not production approval.
