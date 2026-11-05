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

## Product mapping

1. Create or locate each cabin as a Bookingmood **product** (account UI).
2. Map site cabin numeric ids (see `src/environments/cabin-config.ts`) to product UUIDs via `BOOKINGMOOD_PRODUCT_MAP`.
3. Run `npm run sync-bookingmood-products` (read-only) once a key is available to list product ids safely.

Public catalog endpoint: `GET /api/products` selects only safe columns (never `ical_export_secret`, `exact_address`, or `*`).

## Checkout

- Group cart: `POST /api/checkout` → Worker `cart-validate` + `cart-checkout`.
- Guest pays via Bookingmood `payment_url` when provided; empty URL does not imply success.
- Retired: Stripe Checkout + Lodgify reservation fulfillment (`410` on old routes).

## Webhooks

Implementations: `POST /api/bookingmood/webhook` (Standard Webhooks headers, 5‑minute freshness, id dedupe via Cache API).

Register endpoint in Bookingmood only after deploy. Do not log raw payload, guest contact fields, or booking `secret`.

Legacy `X-Signature` (MD5) is rejected.

## Airbnb / iCal

Bookingmood sync is **iCal import/export**, not full listing import. Feeds can lag; configure feeds in the Bookingmood account. See [iCal synchronization](https://www.bookingmood.com/en-US/docs/synchronization/ical).

## Cutover / rollback

1. Configure products, feeds, form services, and payment provider in Bookingmood.
2. Set Worker secrets + `BOOKINGMOOD_BOOKING_ENABLED=true`.
3. Deploy booking Worker, verify `/api/availability`, then site Worker.
4. Rollback: redeploy previous Worker; watch for in-flight Bookingmood payments still completing.

Historical Lodgify builder/snippet docs were archived under `docs/archive/lodgify/` for migration reference only.
