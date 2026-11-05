# Bookingmood migration plan (2026-11-05)

## Goal

Replace legacy hosted builder as the reservation upstream with [Bookingmood REST API](https://www.bookingmood.com/en-US/api-reference) while keeping the existing Angular group calendar UI and Cloudflare booking Worker BFF.

## Architecture

- **Browser → booking Worker** (`/api/*`): CORS-restricted JSON API; no API keys in Angular.
- **Worker → Bookingmood** (`https://api.bookingmood.com/v1`): `Authorization: Bearer BOOKINGMOOD_API_KEY` (Wrangler secret only).
- **Site cabin → product UUID**: allowlisted mapping via `BOOKINGMOOD_PRODUCT_MAP` (JSON) merged with optional per-cabin fields in `cabin-config.ts`. Unknown caller product IDs are rejected.
- **Checkout**: `POST /cart-validate` then `POST /cart-checkout` (group cart). Single-cabin flows use the same BFF checkout or onsite `/cabins/:slug` + group calendar — not legacy legacy hosted builder URLs.
- **Payments**: Bookingmood-managed `payment_url` from `BookingConfirmation`. Retire Stripe→legacy hosted builder fulfillment in this repo.
- **Webhooks**: `POST /api/bookingmood/webhook` with Standard Webhooks HMAC (`webhook-id`, `webhook-timestamp`, `webhook-signature`). Handler implemented + tested; live endpoint registration is an account step.

## Availability semantics

- Source: `GET /availability?product_ids=…&perform_sync=false&show_booked_as=booked&show_closed_as=closed&show_pending_as=TENTATIVE`.
- Map interval statuses to calendar `DayStatus`: `available`, `booked`, `closed`, `pending`, `blocked` (unavailable), `unknown` (upstream/mapping failure).
- Stay selection requires every night `available` (exclusive departure, turnover nights blocked when pending/booked/closed).
- Pricing display: `POST /search` for window/stay totals; authoritative quote at checkout via `cart-validate` (cents, tax, deposit — charge total per API, do not double-count deposit).
- Errors: cabin `availabilityState: 'error'`, UI copy **Availability unavailable**, booking disabled. Production never uses Angular `useMockAvailability`.

## Configuration gates

Booking writes disabled until all are set:

| Name | Purpose |
|------|---------|
| `BOOKINGMOOD_API_KEY` | Bearer token (secret) |
| `BOOKINGMOOD_PRODUCT_MAP` | `{"1":"<uuid>",…}` site cabin id → product |
| `BOOKINGMOOD_CAPACITY_GROUP_ID` | Occupancy map key for cart items |
| `BOOKINGMOOD_FORM_SERVICES` | JSON map of guest field → Bookingmood service id |
| `BOOKINGMOOD_WEBHOOK_SIGNING_SECRET` | Webhook verification (secret) |

Optional: `BOOKINGMOOD_BOOKING_ENABLED=true` explicit enable flag.

## Tests (Vitest)

Fixtures/mock fetch only — no live Bookingmood calls. Cover availability mapping, validate/checkout, webhook HMAC, idempotency cache, missing config, malformed upstream.

## Deployment modes

- **booking Worker**: `environment.booking-worker.ts` (`apiBaseUrl: ''` same-origin).
- **site Worker**: `environment.site-worker.ts` (interim workers.dev booking API until custom domain active).

## Cutover / rollback

1. Configure Bookingmood products + iCal feeds (account) per [iCal sync docs](https://www.bookingmood.com/en-US/docs/synchronization/ical).
2. Set secrets + product map on booking Worker; enable `BOOKINGMOOD_BOOKING_ENABLED`.
3. Deploy booking Worker, then site Worker.
4. Rollback: redeploy previous Worker version; in-flight Bookingmood payments may still complete — monitor Bookingmood dashboard.

## Out of scope (this PR)

Live deploy, secret submission, webhook registration, real UUID population, payment capture.
