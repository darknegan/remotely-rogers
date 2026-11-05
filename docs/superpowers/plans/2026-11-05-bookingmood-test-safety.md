# Bookingmood test safety prep (2026-11-05)

Scope: post–PR #23 safety only — isolated nonproduction Wrangler config, explicit checkout write gate, aligned API/UI `bookingEnabled`, regression tests. **No deploy, no production changes.**

## Root causes (verified on `main` @ a90d9ef)

1. `isBookingWriteEnabled` treats absent `BOOKINGMOOD_BOOKING_ENABLED` as allowed when other prereqs exist (only explicit `false` blocks).
2. `buildAvailabilityResponse` sets `bookingEnabled` from allowlist + API key, ignoring the write gate — UI can show checkout while server rejects or worse.
3. Default `wrangler.jsonc` is production worker name with placeholder KV + DO migration — not an isolated read-only test profile.
4. Frontend `canCheckout` ignores API `bookingEnabled`.

## Implementation

| Step | Change |
|------|--------|
| 1 | `booking-config.ts`: require explicit `BOOKINGMOOD_BOOKING_ENABLED=true` (trim, case-insensitive); all other/missing/malformed → writes off. |
| 2 | `availability.ts`: `bookingEnabled: isBookingWriteEnabled(env)`. |
| 3 | `booking-state.service.ts`: track `bookingEnabled` from availability; fold into `canCheckout`; disable pay CTA when false. |
| 4 | `wrangler.booking-test.jsonc`: worker name `remotely-rogers-booking-test`, `vars.BOOKINGMOOD_BOOKING_ENABLED=false`, no KV/DO/migrations/routes; same assets + `run_worker_first: ["/api/*"]`. |
| 5 | `package.json`: `build:booking-worker-test`, `dry-run:booking-worker-test` (local `--dry-run` only). |
| 6 | `docs/bookingmood/NONPRODUCTION-TEST-WORKER.md`: manual key/mapping/deploy approval steps; state PR creates no remote resources. |
| 7 | Vitest: flag matrix, checkout reject before upstream (single + group), availability `bookingEnabled`, webhook/status fail-safe (extend existing specs). |

## Verification

- Red: `npx vitest run workers/booking-calendar/src/booking-write-policy.spec.ts` (new) before gate fix.
- Green: same + `booking-config`, `checkout`, `availability`, existing worker specs.
- `npm run build:booking-worker-test && npm run dry-run:booking-worker-test` — local bundle only.
- `npx ng test --watch=false --include='**/booking-state.service.spec.ts'` if added (optional minimal).
- Do **not** run full `ng test` sweep for unrelated compile failures.

## Out of scope

Deploying workers, secrets, DNS, product UUID population, live HTTP to Bookingmood or workers.dev.
