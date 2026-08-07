# Lodgify Website Builder — Implementation Guide

Account: **631648** | Builder: https://app.lodgify.com/website-builder/631648  
Live site: https://remotelyrogers.com

## Quick start (30 minutes)

1. Apply global styles → [STYLES.md](STYLES.md)
2. Build content snippets from Angular → paste into Lodgify Raw HTML widgets
3. Deploy group booking Angular app → embed iframe on Multi-Cabin Stays
4. Fix All Properties listing → [fixes/all-properties.md](fixes/all-properties.md)

## What Lodgify builder can do

| Capability | Supported? |
|------------|------------|
| Native Text / Image / Form widgets | Yes |
| **Raw HTML** widget (paste custom markup) | Yes — primary method for modern layouts |
| Custom JavaScript modules in builder | Limited — static HTML/CSS only |
| Embed external app (iframe) | Yes — use for multi-cabin booking calendar |
| Embed admin `/calendar/multi` | **No** — host-only, not available on public site |

The multi-cabin admin calendar at https://app.lodgify.com/calendar/multi must be **recreated** as a custom Angular app, deployed separately, and embedded via iframe on the Multi-Cabin Stays page.

## Page-by-page

| Page | Lodgify path | Angular source | Lodgify action |
|------|--------------|----------------|----------------|
| Activities | Pages → Activities | `src/app/features/content/activities/` | Raw HTML widget — replace emoji text blocks |
| Recommendations | Pages → Recommendations | `src/app/features/content/recommendations/` | Raw HTML + optional Google My Maps iframe |
| Work Stays | Pages → Work Stays | `src/app/features/content/work-stays/` | Raw HTML **above** existing inquiry form |
| Multi-Cabin Stays | Pages → Multi-Cabin Stays | Hero: content component; Booking: `group-booking` feature | Raw HTML hero + iframe embed for calendar |

## Phase 1 — Content pages (Activities, Recommendations, Work Stays)

These pages currently show basic AI-generated text with emoji headers. Goal: card-based layouts, hero sections, and Remotely Rogers palette (forest green `#2d4a3e`, cream `#f7f4ef`, terracotta `#c45c3e`).

### Generate Angular content components

```powershell
ng generate component features/content/activities --standalone
ng generate component features/content/recommendations --standalone
ng generate component features/content/work-stays --standalone
ng generate component features/content/multi-cabin-stays --standalone
```

Shared UI (cards, hero, badges):

```powershell
ng generate component shared/ui/hero --standalone
ng generate component shared/ui/card --standalone
ng generate component shared/ui/badge --standalone
```

Styles live in `src/styles.scss` and component SCSS — match tokens in [STYLES.md](STYLES.md).

### Export static HTML for Lodgify paste

Lodgify Raw HTML does not run `ng serve`. Export prerendered HTML from the Angular preview routes:

```powershell
npm run export:lodgify-snippets
```

This runs `ng build` (SSR prerender for the four `/preview/*` routes), then packages self-contained HTML into `dist/lodgify-snippets/`:

- `activities.html`
- `recommendations.html`
- `work-stays.html`
- `multi-cabin-stays.html`

Each file is plain HTML with a single compact `<style>` block (~9 KB). No external fonts, CSS files, or custom Angular/PrimeNG tags required — it uses your Lodgify site font (Vollkorn if configured under Styles → Fonts).

**Do not edit files in `dist/lodgify-snippets/` by hand** — regenerate from Angular source after any content or style change.

### Paste into Lodgify

**Important:** Paste from `dist/lodgify-snippets/*.html` only — **not** from `src/app/features/content/` (Angular templates show raw `@if` / `{{ }}` with no styling).

1. Run `npm run export:lodgify-snippets`.
2. Open the matching file in **`dist/lodgify-snippets/`** (e.g. `activities.html` — about 26 KB).
3. Select all (Ctrl+A) and copy the **entire** file.
4. Lodgify → **Pages** → select page → **Add new widget** → **Raw HTML**.
5. Paste → **Save** → **Publish website**.
6. Verify on the **live URL** (builder preview is often wrong for Raw HTML).

### Work Stays — form placement

The Work Stays snippet ends before the inquiry form. Leave the existing Lodgify **Booking inquiry** form widget at the **bottom** of the page.

## Phase 2 — Multi-Cabin booking embed

### Deploy Angular app

```powershell
ng build --configuration production
```

Deploy `dist/remotely-rogers/browser/` to **Cloudflare Pages**, **Netlify**, or similar (e.g. `https://booking.remotelyrogers.com`).

Environment config (no secrets in browser bundle):

```typescript
// src/environments/environment.prod.ts
export const environment = {
  apiBaseUrl: 'https://booking-api.remotelyrogers.com',
  siteBaseUrl: 'https://remotelyrogers.com',
};
```

### Paste iframe on Multi-Cabin Stays page

Add a **second** Raw HTML widget below the hero content:

```html
<iframe
  src="https://booking.remotelyrogers.com/group-booking"
  title="Book multiple cabins at Remotely Rogers"
  style="width:100%;min-height:720px;border:0;border-radius:12px"
  loading="lazy">
</iframe>
<p style="text-align:center;margin-top:0.75rem">
  <a href="https://booking.remotelyrogers.com/group-booking" target="_blank" rel="noopener">
    Open booking in a new tab
  </a>
</p>
```

Replace the URL with your deployed Angular app URL. Optional: Angular app sends `postMessage` to resize iframe height on mobile.

### Multi-Cabin SEO fix

**Pages → Multi-Cabin Stays → Settings:**

- Title: `Multi-Cabin Stays | Remotely Rogers`
- Meta description: `Book multiple private A-frame cabins together on 70 acres in Rogers, Arkansas.`

## Rebuild snippets after editing Angular components

```powershell
npm run export:lodgify-snippets
# or, during development:
ng serve
# preview at /preview/activities, /preview/recommendations, etc.
```

Do not edit files in `dist/lodgify-snippets/` by hand — regenerate from Angular source.

## Optional: Google My Maps

On Recommendations, replace the map iframe `src` in the Angular component with your [Google My Maps](https://www.google.com/maps/d/) embed URL, then re-export.

## Optional: Replace placeholder photos

Swap Unsplash URLs in Angular components for client photos (Lodgify media library URLs or uploaded CDN links), then `npm run export:lodgify-snippets` and re-paste.

## Client checklist before go-live

- [ ] Lodgify API key for BFF (Settings → Public API)
- [ ] All 6 cabins published with photos, rates, availability
- [ ] Stripe keys on BFF if using single combined checkout
- [ ] Deploy URLs for Angular app + BFF confirmed
- [ ] Publish website after every Raw HTML change
