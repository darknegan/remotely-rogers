# Nonproduction booking Worker (`remotely-rogers-booking-test`)

This repository includes **`wrangler.booking-test.jsonc`** — a standalone Wrangler profile for a future **test** booking Worker. It is **not** deployed by the safety-prep PR and **must not** be treated as production.

## What this PR provides

| Item | Purpose |
|------|---------|
| `wrangler.booking-test.jsonc` | Worker name `remotely-rogers-booking-test`, `BOOKINGMOOD_BOOKING_ENABLED=false`, no KV/DO/migrations/routes |
| `npm run build:booking-worker-test` | Same Angular `booking-worker` static build used for packaging |
| `npm run dry-run:booking-worker-test` | **Local** `wrangler deploy --dry-run` only — bundles the Worker; does **not** create Cloudflare resources |

A dry run validates packaging and config shape. It **does not** prove live Bookingmood behavior, webhook delivery, or payment flows.

## Manual steps (separate approval required)

Do **not** perform these as part of the safety-prep PR:

1. **Create Cloudflare resources** (if ever needed for a dedicated test Worker): KV namespace, Durable Object migration, and Worker deploy — only after explicit approval. This PR intentionally omits bindings so read-only packaging cannot provision remote state.
2. **Install a test API key** (not production): `wrangler secret put BOOKINGMOOD_API_KEY -c wrangler.booking-test.jsonc` on the **test** Worker only, using a Bookingmood key scoped to nonproduction inventory.
3. **Verify cabin → product mapping**: populate `BOOKINGMOOD_PRODUCT_MAP`, `BOOKINGMOOD_CAPACITY_GROUP_ID`, and `BOOKINGMOOD_FORM_SERVICES` from verified Bookingmood dashboard values (see `src/environments/cabin-config.ts` ids). Run `npm run sync-bookingmood-products` read-only to list products — never commit secrets or real UUIDs until reviewed.
4. **Enable checkout writes** only when mapping, form services, bindings, and webhook registration are complete: set `BOOKINGMOOD_BOOKING_ENABLED=true` on that Worker (not on production until cutover approval).

Production deploy commands (`deploy:booking-worker`, default `wrangler.jsonc`) are unchanged.

## Isolation checklist

- Production Worker name remains `remotely-rogers-booking` in `wrangler.jsonc`.
- Test config has **no** `routes`, **no** `services`, **no** shared KV/DO ids, **no** migrations.
- Webhooks remain inactive without signing secret and storage bindings (503 fail-closed).

Nothing in production (`remotely-rogers-booking`, `remotely-rogers-web`, DNS, secrets, or payment setup) is modified by merging this PR alone.
