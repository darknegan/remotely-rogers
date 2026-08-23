# Cabin review carousel

Date: 2026-08-22  
Status: approved for planning

## Problem

Cabin profile pages need guest reviews at the bottom without a full reviews page. The current `/preview/reviews` export is a site-wide block meant for Footer Custom HTML. The host wants a reusable widget they can paste into each rental page’s Raw HTML field, with only that cabin’s reviews.

## Decision

Build one Angular `ReviewCarousel` component. Export **six** self-contained HTML snippets (one per cabin). Paste each file into that cabin’s Lodgify Raw HTML widget.

Do **not** use Footer Custom HTML injection or an iframe embed.

## Assumptions

- Each Lodgify rental page can take a Raw HTML widget. If a template still blocks it, this paste path will fail and we revisit Footer injection.
- Existing `GUEST_REVIEWS` data and `public/reviews/avatars/{id}.jpg` stay the source of truth.
- Airbnb screenshots are never shown on the site — only transcribed cards and cropped avatars.

## Architecture

```
ReviewCarousel (slug) → reviewsForCabin(slug)
        │
        ├─ Angular preview: /preview/reviews (sandbox, pick a cabin)
        └─ Export: six HTML files, each one cabin’s widget
```

### Angular

- New standalone component: `src/app/features/content/reviews/review-carousel/`
- Input: cabin `slug` (Lodgify rental slug)
- Renders: heading, average, count, one card, dots, prev/next, “Show all reviews”
- `/preview/reviews` becomes a sandbox host: cabin chips + the six carousels in the DOM (one visible). No hero, no site-wide stats, no “Book Your Stay” CTA. Each carousel root has a unique export host hook (`data-rr-host="app-reviews-black-gum"`, etc.) so the existing flatten/export pipeline can cut six files from one prerendered page.

### Data

Reuse:

- `src/app/features/content/reviews/reviews.data.ts`
- `src/app/core/utils/reviews.ts` (`CABIN_SLUGS`, `reviewsForCabin`, `averageRating`, `guestInitials`)
- Avatar URL pattern `/reviews/avatars/{id}.jpg`

Remove carousel use of `VISIBLE_REVIEW_LIMIT` / `visibleReviews` (those exist for the old “show first 4” grid). Keep listing-title → slug helpers; they are unrelated to the widget.

## UI behavior

Compact widget, one card at a time.

| Control | Behavior |
|---|---|
| Auto-advance | Every **20 seconds** |
| Pause | Pointer hover, modal open, or `document.hidden` |
| Reduce motion | If `prefers-reduced-motion: reduce`, no auto-advance |
| Dots / prev / next | Manual change; restart the 20s timer |
| Single review | Show the card; hide dots, arrows, and auto-advance |
| Show all reviews | Open a modal overlay with every card for that cabin |
| Close modal | Close button, backdrop click, or Escape |
| Photo fail | Keep initials fallback behind the image |

Card content (unchanged): circular avatar, guest name, star rating, stay dates, quote. Source line may stay “Guest reviews from Airbnb” in the heading subtitle.

## Export

`npm run export:lodgify-snippets` writes six files instead of `cabin-reviews.html`:

| File | Cabin | Slug |
|---|---|---|
| `reviews-black-gum.html` | Black Gum Getaway | `black-gum-getaway-cozy-forest-a-frame-near-bentonville` |
| `reviews-dogwood.html` | Dogwood Den | `dogwood-den--cozy-forest-a-frame-near-bentonville` |
| `reviews-running-spring.html` | Running Spring Retreat | `running-spring-retreat-cozy-forest-a-frame-near-bentonville` |
| `reviews-black-walnut.html` | Black Walnut Bungalow | `black-walnut-bungalow-cozy-forest-a-frame-near-bentonville` |
| `reviews-white-oak.html` | White Oak Haven | `white-oak-haven-cozy-forest-a-frame-near-bentonville` |
| `reviews-post-oak.html` | Post Oak Perch | `post-oak-perch-cozy-forest-a-frame-near-bentonville` |

Each file must:

- Contain only that cabin’s reviews
- Inline avatars as `data:image/jpeg;base64,...` (no `/reviews/avatars/` URLs)
- Include widget CSS plus a small vanilla script for rotate + modal
- Be valid Lodgify Raw HTML (no Angular / PrimeNG tags, no `{{ }}`)

Remove `cabin-reviews.html` and the site-wide reviews injector (`tools/lodgify-reviews-inject.mjs`). Update `docs/lodgify/BUILDER-GUIDE.md` and `docs/lodgify/STYLES.md` to the six-file paste path.

### Paste

1. Run `npm run export:lodgify-snippets`
2. Open the matching `reviews-*.html`
3. Select all, copy
4. Lodgify → that cabin’s rental page → Add widget → Raw HTML
5. Paste → Save → Publish
6. Check the **live** cabin URL (builder preview is often wrong for Raw HTML)

Place the widget at the **bottom** of the rental page.

## Error handling

- Unknown or empty slug: render nothing
- Missing avatar file at export time: fail the export (same as today’s `inlineReviewAvatars`)
- Broken image at runtime: hide the `img` so initials show
- Modal uses `role="dialog"` and `aria-modal="true"`. Close button, backdrop click, and Escape all close it. On close, restore scroll and resume auto-advance.

## Testing

Unit tests (Vitest):

- `reviewsForCabin(slug)` returns only that cabin
- Advance helper / index wrap: last → first
- Auto-advance interval is 20_000 ms
- Auto-advance is disabled when modal is open, when there is one review, or when reduce-motion is set
- Export packaging (or a fixture flatten): each snippet file name maps to one slug and contains no other cabin’s guest names

Keep existing slug-mapping and data-coverage tests.

Manual:

- `/preview/reviews` — switch cabins, wait 20s, use arrows, open/close modal
- After export, open one `reviews-*.html` in a browser and confirm rotate + modal without Angular

## Out of scope

- Changing transcribed review text
- Recropping avatars
- Native Lodgify review sync
- Footer fallback (unless Raw HTML on rental pages is confirmed impossible after trying)
- A public all-reviews marketing page
