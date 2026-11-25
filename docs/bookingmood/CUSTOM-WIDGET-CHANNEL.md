# Custom Bookingmood channel widget (browser)

Dev channel id: `b36240bc-5dae-404e-b55d-f51efb502d73` (Custom widget interaction, not bookable).

## Build flags (`src/environments/*.ts`)

| Flag | Default in this repo | Purpose |
|------|----------------------|---------|
| `useCustomBookingComponents` | `false` | When `true`, cabin detail and `/group-booking/checkout` use native Angular components instead of the timeline iframe. |
| `bookingmoodChannelBookingEnabled` | `false` | When `false`, `POST …/cart/checkout` throws before any network call; UI shows reservations-off. |
| `bookingmoodChannelId` | dev channel uuid | Public channel id for `GET /channels/:id` (allowlisted). |

## Allowlist

Only `b36240bc-5dae-404e-b55d-f51efb502d73` is permitted. `4285e82a-1454-4405-b34b-25a8cac7f4ce` (production embed) is rejected in `bookingmood-channel-allowlist.ts`.

## Live validate evidence (2026-11-23)

```
POST https://www.bookingmood.com/api/public/v1/channels/b36240bc-…/cart/validate
HTTP 403
{"code":"channel_not_bookable","message":"This channel doesn't accept bookings"}
```

`GET /channels/b36240bc-…` returns 200 with six products, one capacity group (`f8558449-…`, empty name), and per-product services: Name, Email, Phone, Address.

### `form_values` shapes (verify before go-live)

Official channel docs only show a string example for `form_values`. This PR maps:

| Service `type` | Value sent under `form_values[SERVICE_ID]` |
|----------------|--------------------------------------------|
| `name` | string (single full name) |
| `email` / `phone` | string |
| `address` | `{ street, city, zip, country }` — per design HANDOFF / cart-validate example; **not** enumerated on the channel `services` payload |

Capacity **max** per product comes from `products[].capacity[groupId].max` (dev channel: **2**), not site “sleeps 4” copy.

## Bundle scan

After `npm run build`, run `npm run scan:booking-bundle-secrets`.