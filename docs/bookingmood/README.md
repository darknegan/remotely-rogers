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
| `BOOKINGMOOD_FORM_SERVICES` | JSON map `{ "firstName": "<service-uuid>", … }` |
| `BOOKINGMOOD_BOOKING_ENABLED` | Set `true` when ready for checkout writes |

Copy `.env.example` → `.dev.vars` for local Worker dev.

## Worker bindings (required for checkout + verified status)

| Binding | Type | Purpose |
|---------|------|---------|
| `BOOKING_STATE` | KV | Webhook event dedupe; public-safe booking reference status |
| `BOOKING_COORDINATOR` | Durable Object (`BookingCoordinator`) | Atomic checkout idempotency per scope key + fingerprint |

Checkout writes are **disabled** until both bindings exist (see `isBookingWriteEnabled`). This does not provide provider exactly-once booking — only best-effort duplicate protection and webhook-verified status.

Replace placeholder KV ids in `wrangler.jsonc` with namespace ids from your Cloudflare account before deploy.

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

## Cutover / rollback

1. Configure products, feeds, form services, and payment provider in Bookingmood.
2. Create KV + DO bindings; set secrets; `BOOKINGMOOD_BOOKING_ENABLED=true`.
3. Deploy booking Worker, verify `/api/availability`, register webhook, then deploy site Worker.
4. Rollback: redeploy previous Worker; reconcile in-flight payments in Bookingmood dashboard (pre-cutover gate).

Content snippet export for third-party HTML widgets: `npm run export:content-snippets` → `dist/content-snippets/` (neutral pipeline, separate from booking API).
