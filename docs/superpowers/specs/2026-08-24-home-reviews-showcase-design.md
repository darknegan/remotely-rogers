# Home guest-reviews showcase

Date: 2026-08-24  
Status: approved for planning  
Supersedes: `docs/superpowers/specs/2026-08-22-cabin-review-carousel-design.md`

## Problem

Lodgify default rental pages cannot take a Raw HTML widget unless they are converted to custom pages. Six per-cabin paste files therefore cannot land on cabin profiles. Guest reviews still need a public home for the six A-frames.

## Decision

One all-in-one Home block. `/preview/reviews` becomes a six-row gallery. Export **one** file, `reviews-home.html`, pasted into the Lodgify **Home** page Raw HTML widget.

Do **not** paste reviews onto rental pages. Do **not** keep the six `reviews-*.html` cabin files.

## Assumptions

- Home can take a Raw HTML widget (same as Activities / Work Stays).
- `GUEST_REVIEWS`, `public/reviews/avatars/{id}.jpg`, and `CABIN_CONFIG` listing photos stay the source of truth.
- Airbnb screenshots are never shown — only transcribed cards and cropped avatars.

## Architecture

```
Reviews page
  └─ six ReviewBand rows (CABIN_CONFIG order)
        ├─ cabin portrait + short name → /en/{slug}/
        └─ two visible reviews, shift-by-one every 15s
Export: dist/lodgify-snippets/reviews-home.html
Paste: Lodgify Home → Raw HTML
```

### Angular

- `/preview/reviews` is the full gallery (no cabin-chip sandbox).
- Reuse review cards (avatar, name, stars, stay dates, quote).
- Refit `ReviewCarousel` (or a sibling `ReviewBand`) so each cabin row takes: `slug`, `name`, `imageUrl`, `imageOnLeft` (odd rows true).
- Single export host: `data-rr-host="app-reviews"` wrapping `.rr-page`.

### Cabin order and sides

| # | Cabin | Photo side |
|---|---|---|
| 1 | Black Gum Getaway | left |
| 2 | Dogwood Den | right |
| 3 | Running Spring Retreat | left |
| 4 | Black Walnut Bungalow | right |
| 5 | White Oak Haven | left |
| 6 | Post Oak Perch | right |

Short name under the photo is the label before the first `-` in `CABIN_CONFIG` (e.g. `Black Gum Getaway`). Photo + name link to `https://remotelyrogers.com/en/{slug}/`.

## UI behavior

Each band shows **two** review cards stacked.

| Control | Behavior |
|---|---|
| Auto-advance | Every **15 seconds**, shift the window by **one** review (1+2 → 2+3 → … → last+first) |
| Pause | Pointer hover on that band, modal open, or `document.hidden` |
| Reduce motion | No auto-advance |
| Fewer than 3 reviews | No rotate; show what exists |
| Show all reviews | Modal with every card for that cabin (`role="dialog"`); Close, backdrop, Escape |
| Photo fail | Keep the name link |
| Avatar fail | Initials fallback |

Desktop: two columns (portrait \| reviews or the reverse). Narrow screens: portrait above reviews for every row.

## Export

`npm run export:lodgify-snippets` writes:

- `dist/lodgify-snippets/reviews-home.html`

The file must:

- Include all six bands in the order above
- Inline avatars as `data:image/jpeg;base64,...` (no `/reviews/avatars/` URLs)
- Include widget CSS plus vanilla script for 15s shift-by-one + per-band modal
- Be Lodgify-safe (no Angular / PrimeNG tags, no `{{ }}`)

Delete leftover `reviews-black-gum.html` … `reviews-post-oak.html` and `cabin-reviews.html` on export. Update `docs/lodgify/BUILDER-GUIDE.md` and `docs/lodgify/STYLES.md`.

### Paste

1. Run `npm run export:lodgify-snippets`
2. Open `dist/lodgify-snippets/reviews-home.html`
3. Select all, copy
4. Lodgify → **Home** → Add widget → Raw HTML
5. Paste → Save → Publish
6. Check the **live** home URL

## Helpers

Replace `REVIEW_CAROUSEL_INTERVAL_MS = 20_000` with `REVIEW_BAND_INTERVAL_MS = 15_000`.  
Add `visibleReviewWindow(reviews, startIndex, size = 2)` that wraps.  
Keep `reviewsForCabin`, `averageRating`, `guestInitials`.  
`REVIEW_SNIPPETS` six-file mapping can go away.

## Testing

- Window wrap: last index + size 2 uses first review as the second card
- Interval is 15_000 ms
- Auto-advance off when `< 3` reviews, modal open, or reduce-motion
- Odd rows `imageOnLeft === true`, even rows false
- Export file contains all six slugs and no `/reviews/avatars/`

## Out of scope

- Custom Lodgify rental templates
- Changing transcribed quotes
- Recropping avatars
- Footer injection
- A separate all-reviews marketing page besides Home
