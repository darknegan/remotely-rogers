# Remotely Rogers — Claude Design brief

Paste the **First prompt** below into a new Claude Design project. Do not import this repo as a design system (that would lock in the old Lodgify look).

## Context (facts, not style)

- **Business:** Remotely Rogers — six private A-frame cabins on 70 acres in Rogers, Arkansas, near Bentonville, Beaver Lake, and world-class bike trails.
- **Audience:** couples, families, groups, remote workers, corporate retreats.
- **Booking:** guests book one cabin or several together. Primary CTA is **Check availability**. Booking still goes through Lodgify (or similar) later — do not invent a fake checkout.
- **Cabins (4 guests each, 2-night minimum):** Black Gum Getaway, Dogwood Den, Running Spring Retreat, Black Walnut Bungalow, White Oak Haven, Post Oak Perch.
- **Later pages:** Home, cabin listing, cabin detail, Activities, Recommendations, Work Stays, Multi-Cabin, FAQ / guest info, Maps & getting here, Our story, Contact.

## Attach these files

From `docs/design/assets/`:

1. `current-homepage-leaving-not-copying.png` — label it **what we are leaving, not copying**.
2. Real cabin photos from remotelyrogers.com (1600px) in `cabins/`:
   - `homepage/` — live homepage photos (use `01.jpg` as the hero)
   - `black-gum/`, `dogwood/`, `running-spring/`, `black-walnut/`, `white-oak/`, `post-oak/` — full galleries (`01` is that cabin’s listing cover)

For a homepage pass, attach `cabins/homepage/01.jpg` plus `01` from each cabin folder. For a cabin-detail mock, attach that cabin’s folder. No stock or Unsplash.

## Copy to use (no lorem ipsum)

**Hero:** Six private A-frames on 70 acres. Minutes from Bentonville trails and downtown Rogers.

**Stats:** 70 private acres · 6 A-frame cabins · 15 min to downtown.

**Reviews (Airbnb):**

- Jordan: “Couldn’t recommend this place more! 11/10. Not only is it clean, peaceful, and beautiful, it feels like a piece of home.”
- Dakota: “This place was perfect! We wanted a quiet, modern place that allowed pets and that was exactly what we got.”
- Daniel: “On a 3k mile road trip, this was the most pristine and aesthetically pleasing place we stayed.”
- Lorna: “Such a beautiful place and Jeff was amazing — great directions, recommendations, and a wonderful home.”

**Activities:** Hobbs State Park, Lake Atalanta, Slaughter Pen / Coler bike trails, Beaver Lake.

**Work stays:** Private cabin as office, Wi‑Fi in every cabin, team retreats with room to breathe between meetings.

**Multi-cabin:** Book multiple private A-frames together — families, wedding parties, corporate retreats, one combined checkout.

## Content model (not visual)

The client wants the *kind of helpful information* on [Fancy Hill Cabins](https://www.fancyhillcabinsandrvpark.com/) — not their look, layout, rustic-campground vibe, RV/tent camping, Ouachita waterfalls, or copy.

Steal these **information types**, rewritten for Remotely Rogers / Northwest Arkansas:

- **Stay options with who they’re for** — six private A-frames (4 guests each), plus multi-cabin groups and work stays. Not RV/tent.
- **Nearby, with drive times** — downtown Rogers ~15 min, Lake Atalanta ~8 min, Bentonville / Slaughter Pen ~20 min, Crystal Bridges ~25 min, Beaver Lake ~20 min, Hobbs State Park ~25 min.
- **How far from home** — Bentonville ~15 min, Fayetteville ~30 min, Tulsa ~1.5 hr, Springfield ~2 hr, Kansas City ~3.5 hr, Little Rock ~3 hr, Dallas ~5 hr.
- **What we offer** — private A-frames on 70 acres, pet-friendly stays, Wi‑Fi, multi-cabin groups, trail / lake / downtown access. Skip Fancy Hill-only items (hot tubs, fiber-optic campsites) unless we confirm them for RR.
- **Pets and groups, with real rules** — pets welcome (Dakota’s review); groups book adjacent cabins together.
- **Our story** — short host/property story (Jeff as host), not Fancy Hill’s campground origin.
- **Area map / getting here** — property in Rogers, AR; useful for a later Maps page.
- **Guest policies / FAQ** — check-in, min nights (2), max guests (4 per cabin), Wi‑Fi, pets, parking, what to bring. Placeholder FAQ is OK if we don’t have Jeff’s exact answers yet.
- **Reviews + easy contact** — phone/text/email, not a noisy “book direct and save” banner stack.

Do **not** copy Fancy Hill’s palette, serif-on-photo hero, popup, or “book direct / skip the fees” chrome.

## Three directions (must look different)

| | A — Warm editorial lodge | B — Quiet Scandinavian A-frame | C — Bold outdoor adventure |
|---|---|---|---|
| Mood | Magazine, hospitality, photo-led | Calm, airy, architectural | High-energy trail / trip |
| Type | Display serif + quiet sans | Geometric sans + a restrained serif | Oversized condensed sans |
| Layout | Overlapping photos, pull quotes | Generous whitespace, thin rules | Huge type, full-bleed crops |
| Palette | Cream, ink, oxblood, warm gold | Pale oak, charcoal, clay (not the old terracotta) | Bone, off-black, a bright accent that is **not** forest green `#2d4a3e` |

Do **not** default to forest green + terracotta + Vollkorn.

## First prompt

```
New marketing site for Remotely Rogers: six private A-frame cabins on 70 acres in Rogers, Arkansas, near Bentonville. Guests are couples, families, groups, and remote workers. Primary CTA is Check availability. Write real copy, no lorem ipsum.

CONTENT (helpful information to include — rewrite for this property, do not copy Fancy Hill’s words or look):
- Photo-led hero
- The six cabins (Black Gum Getaway, Dogwood Den, Running Spring Retreat, Black Walnut Bungalow, White Oak Haven, Post Oak Perch) with who each stay is for
- Nearby with drive times: Lake Atalanta ~8 min, downtown Rogers ~15 min, Bentonville trails ~20 min, Beaver Lake ~20 min, Crystal Bridges ~25 min
- How far from home: Fayetteville ~30 min, Tulsa ~1.5 hr, Springfield ~2 hr, Little Rock ~3 hr, Kansas City ~3.5 hr, Dallas ~5 hr
- What we offer: private A-frames, 70 acres, pet-friendly, Wi-Fi, book one cabin or several together
- Pets + groups (short, practical)
- A short “our story” / host note (Jeff)
- Guest reviews from Jordan, Dakota, Daniel, and Lorna using the real quotes in the brief
- Easy contact (not a stack of “book direct and save” banners)

Give me three visually distinct homepage directions on the canvas, desktop 1440 wide:

A) Warm editorial lodge — magazine layout, cream/ink/oxblood, display serif.
B) Quiet Scandinavian A-frame — pale oak, charcoal, lots of whitespace, geometric type.
C) Bold outdoor adventure — oversized condensed type, high contrast, a bright accent that is not forest green.

The attached current-homepage screenshot is what we are leaving, not copying. Fancy Hill Cabins (fancyhillcabinsandrvpark.com) is a CONTENT reference only — borrow the kinds of guest-helpful info (nearby distances, how far, amenities, pets/groups, story, reviews), not their visual design, rustic-campground branding, RV/tent camping, or waterfall copy. Use the cabin photos as real photography. Do not start from a generic forest-green rental template. Do not invent checkout chrome.
```

## After the three homepages

Pick one direction with the client. Then expand that **same** project: cabin listing, one cabin detail (Black Gum Getaway), Activities, Work Stays, Multi-Cabin, FAQ / guest info, Maps & getting here. Desktop first, then a 375px homepage.
