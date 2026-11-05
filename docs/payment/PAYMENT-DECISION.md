# Payment architecture (Bookingmood)

## Decision

**Unified group cart in Angular** → **booking Worker BFF** → **Bookingmood `cart-validate` + `cart-checkout`**.

Guests pay through Bookingmood when `payment_url` is returned. The Worker does not run a parallel Stripe charge or create legacy legacy hosted builder reservations.

## Retired paths

- Stripe Checkout session + legacy hosted builder `createBookedBooking` fulfillment (`410` on `/api/checkout/session` and `/api/stripe/webhook`).
- Sequential per-cabin legacy hosted builder property checkout links.

## Configuration

See [bookingmood/README.md](../bookingmood/README.md) for secret names, product mapping, form service IDs, and webhook setup.

## Test vs live payments

- Local/dev: checkout stays disabled until `BOOKINGMOOD_BOOKING_ENABLED=true` and mapping secrets are set.
- Live payment behavior depends on the Bookingmood account payment provider — verify in Bookingmood before enabling writes.

## Group bookings

One `cart-checkout` call covers the whole cart. Bookingmood returns a single `BookingConfirmation` (reference + optional `payment_url`). Do not infer payment success from browser redirect alone; use webhooks and Bookingmood dashboard for reconciliation.
