# Payment Strategy — Multi-Cabin Bookings

**Client preference:** Single checkout for multiple cabins.

**Lodgify limitation:** Each cabin is a separate property. Native Lodgify checkout processes **one property per transaction**. The admin `/calendar/multi` view is host-only and **cannot** be embedded on the public website.

## Recommended approach

**Option B+:** Unified cart UX in the **Angular group-booking app**, with **one combined payment step** via Stripe Checkout, backed by linked Lodgify reservations created by the BFF.

| Option | Description | Angular / BFF status |
|--------|-------------|----------------------|
| **A — Stripe single charge** | BFF creates tentative Lodgify bookings → Stripe Checkout for combined total | **Recommended** — implement in `CheckoutService` + BFF |
| **B — Sequential Lodgify checkout** | Angular opens Lodgify booking URL per cabin in order | Fallback when Stripe not configured |
| **C — Manual group quote** | `QuoteRequestComponent` → email to host | Always available as backup tab |

## Decision recorded

For Remotely Rogers, default to **Option A** when `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are set on the BFF (Cloudflare Worker, NestJS, etc.). Without Stripe, the Angular app falls back to **Option B** (sequential Lodgify property checkout links).

## Client action items

1. Create a [Stripe](https://stripe.com) account and add keys to **BFF secrets** (not Angular `environment.ts` — only publishable key goes client-side).
2. Generate a Lodgify API key: **Settings → Public API**.
3. Run property sync after BFF is wired:

   ```powershell
   $env:LODGIFY_API_KEY = "your-key"
   npm run sync-properties
   ```

   Confirms all 6 cabin IDs in `src/environments/cabin-config.ts`.

4. Review cancellation/refund policy for group bookings (single charge = single refund policy).

## Angular implementation map

| Layer | Responsibility |
|-------|----------------|
| `GroupBookingComponent` | Date range, cabin grid, cart (signals) |
| `CheckoutFacade` | Calls BFF `POST /api/checkout`, redirects to Stripe or Lodgify URLs |
| `QuoteRequestComponent` | Reactive form → BFF `POST /api/quote` |
| BFF (separate deploy) | Holds `LODGIFY_API_KEY`, Stripe secret, CORS for `remotelyrogers.com` |

Generate checkout feature:

```powershell
ng generate component features/group-booking/checkout --standalone
ng generate service features/group-booking/checkout --flat
ng generate service core/lodgify-api
```

## Reconciliation workflow (Option A)

1. Guest completes Stripe Checkout for combined total.
2. BFF creates one Lodgify booking per selected cabin with shared `group_id` in notes.
3. Host receives Lodgify notifications per cabin; Stripe dashboard shows one charge.
4. Mark bookings as paid in Lodgify if status remains tentative until webhook confirms.

## Why not Lodgify MCP for payments?

Lodgify MCP tools can create bookings and payment links **one reservation at a time** — useful for debugging, not for guest-facing single checkout. Production flow goes through the Angular app → BFF → Lodgify API + Stripe.
