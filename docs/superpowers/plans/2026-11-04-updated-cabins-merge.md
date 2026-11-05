# Updated Cabins merge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/cabins` to match `docs/design/assets/mocks/Updated Cabins.html` (F-02 v2 · Cabins + Multi-Cabin merged · Book your stay), folding multi-cabin booking into that page, and remove the standalone Multi-Cabin page/route.

**Architecture:** Keep listing + date search on `/cabins`. Add a lower multi-cabin band (anchor `#group`) that embeds existing `app-group-booking-shell`. Redirect `/multi-cabin` (and preview alias) to `/cabins` (with `#group` hash when useful). Do not change Lodgify, Stripe, `/group-booking/*`, or Bookingmood.

**Tech Stack:** Angular 21 + PrimeNG Aura (Ozark maison), `core/cabins/cabin-search.store.ts`, `group-booking/booking-state.service.ts`, Cloudflare Worker site deploy.

**Mock source:** branch `cursor/claude-design-brief-photos` @ `dd2d65d` (pushed Nov 4, 8:09 PM CT) — `docs/design/assets/mocks/Updated Cabins.html`. Mock has a **1440 frame only** (no mobile frame yet). That branch also carries the full Ozark Maison rebuild (~362 files vs `main`) — paths below are **branch paths**, not `main`.

**Base-branch call (need Drake):** Implement on the Ozark branch (merge rebuild first), or port the redesign onto `main`? **Recommend:** build on Ozark branch in 3 small PRs.

## Global Constraints

- Match mock at **1440**; QA **~375** against Designer mobile stack below (no mobile mock frame yet).
- Reviewer CLEAR: `/multi-cabin` + `preview/multi-cabin-stays` redirect cleanly; Multi-Cabin removed from nav/footer/CTAs; no Bookingmood scope creep.
- Keep `/cabins/:slug`, `/group-booking`, `/group-booking/checkout` working.
- API keys stay server-side (unchanged).

## Locked from mock + Designer (2026-11-04)

**Product (from mock / Designer):**

- URL: `/cabins` only; calendar section **`#group`**; `/multi-cabin` redirects there (with `#group` hash when useful).
- Nav label: **Cabins** only (drop Multi-Cabin).
- How-it-works: keep, compact inside `#group` (3 steps).

**Mobile 375 stack (Designer proposal — QA target until a mobile mock exists):**

1. Sticky nav (Cabins active)
2. Compact photo hero — Book Your Stay + one-line meta
3. Search card full-width (check-in/out/guests stacked → Update availability)
4. Availability + sort/filters toolbar (filters sheet)
5. Available cards 1-col
6. Booked strip — horizontal scroll + See open nights
7. `#group` — eyebrow, short H2, 3 steps stacked, embedded calendar
8. Where you’ll be — copy then map ~280px
9. Footer

**Empty dates:** no list/map tabs unless 0 results — empty state “Try different dates” + jump to `#group`.

**Still open (need Drake / product):** Ozark branch vs `main` (recommend Ozark); pets field; “Book this cabin” → detail vs checkout.

## File map (Ozark branch)

| Area | Paths |
|------|--------|
| Mock | `docs/design/assets/mocks/Updated Cabins.html` |
| Cabins page | `src/app/features/cabins/cabin-listing.{html,ts}` + `styles/ozark.scss` |
| Search store | `src/app/core/cabins/cabin-search.store.ts` |
| Embed calendar | reuse `app-group-booking-shell` + `group-booking/booking-state.service.ts` (next-open dates) |
| Remove | `src/app/features/content/multi-cabin-stays/**` |
| Routes | `app.routes.ts` (~30 multi-cabin, ~45 preview alias), `app.routes.server.ts` (~7), `tools/prerender-routes.txt` (~12) |
| Nav/CTAs | `core/content/site-nav.ts` (~13), `home.html` (~77), `work-stays.html` (~65), `work-stays.ts` (~71) |

## Mock section map (top → bottom)

1. **Hero** — “Book Your Stay”; strip: Six cabins · One property · 70 private acres.
2. **Date bar** — check-in 3:00 PM / check-out 11:00 AM / guests (+ pets in mock) / “Update availability”.
3. **Results heading** — “{N} nights · Available {dates}” + “{M} of 6 cabins available”; sort (low→high) + More filters.
4. **Available cards** — Available badge, size, from $X/night, stay total, “Book this cabin”.
5. **Booked strip (new)** — taken cabins + next-open date; “See open nights ↓” jumps to `#group`.
6. **Multi-cabin band (`#group`)** — H2 “Book one cabin, or several on one calendar”; 3 steps; embed group calendar.
7. **Where you’ll be** — full-width map, Lindy Lane address (replaces today’s split list/map).

---

### Task 1: Rebuild listing to F-02 v2

**Files:** `cabin-listing.{html,ts}`, `styles/ozark.scss`, wire `cabin-search.store.ts`

- [ ] Hero + date bar + results heading + available cards + full-width map per mock.
- [ ] “Update availability” filters via existing store.
- [ ] Commit: `feat(cabins): F-02 v2 listing layout and date search`.

### Task 2: Booked strip + embed calendar

**Files:** `cabin-listing.*`; reuse `app-group-booking-shell`; next-open from `booking-state.service.ts`

- [ ] Booked strip + “See open nights ↓” → `#group`.
- [ ] Date bar fills calendar; keep checkout via `BookingStateService` → `/group-booking/checkout`.
- [ ] Commit: `feat(cabins): booked strip + embedded multi-cabin calendar`.

### Task 3: Remove Multi-Cabin page + redirects

- [ ] Delete `features/content/multi-cabin-stays/`.
- [ ] Redirect `multi-cabin` → `cabins#group` when useful (`app.routes.ts`); same for `preview/multi-cabin-stays`.
- [ ] Drop server/prerender entries; remove nav in `site-nav.ts`.
- [ ] Repoint `home.html`, `work-stays.html` / `work-stays.ts`.
- [ ] Redirect tests; commit: `refactor: remove multi-cabin page; redirect to /cabins`.

### Task 4: QA gate

- [ ] Designer PASS at 1440 + ~375.
- [ ] Reviewer CLEAR (redirects, nav, no Lodgify/Bookingmood diffs).
- [ ] Undraft → merge → redeploy when Drake says go.

## Open product calls (need Drake)

1. **Base:** Ozark branch first, or port to `main`? (Recommend Ozark.)
2. **Pets field:** real booking field or mock-only?
3. **“Book this cabin”:** cabin detail page vs straight checkout?
4. **Home Multi-Cabin tile:** retarget to `/cabins#group` or remove?

## Out of scope

Bookingmood switch; Lodgify/Stripe replacement; cabin detail redesign; new map provider.
