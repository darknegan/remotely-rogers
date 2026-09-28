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

## Round 2 — three richer homepages

Option B (Quiet Scandinavian A-frame) was the strongest of round 1. Round 2 should keep that calm, architectural intelligence, but the first three mocks were too sparse / template. These three must look like finished 2026 hospitality sites — Kinfolk, Aesop, Inness, AutoCamp — not a SaaS landing page with cabin photos dropped in.

| | D — Cinematic dusk lodge | E — Paper and cedar | F — Ozark maison |
|---|---|---|---|
| Mood | Film still, golden hour, quiet luxury | Japanese-Ozark retreat, ink on paper | Design hotel / inn, gallery-rich |
| Photography | Full-viewport heroes, dark timber, window glow, overlapping crops | Architecture as art, lots of wood grain, negative space that still feels lush | Large gallery grids, pull-quote over photo, art-directed stills |
| Type | Wide elegant sans + a single display serif word | Refined grotesque + a calligraphic or high-contrast serif | Big editorial serif + thin sans |
| Palette | Charcoal, warm black, honey, fog | Rice paper, cedar, sumi, one vermilion mark | Limestone, walnut, oxblood, brass |
| Layout | Immersive, layered, type on photography | Asymmetric, very considered, not a 3-up card stack | Magazine: varied rhythm, bento, full-bleed then quiet |

### Round 2 prompt

Save the Option B file. New project (or “save this and try a completely different approach”). Attach the same real cabin photos. Paste:

```
Round 2 of homepage mocks for Remotely Rogers. Keep the same content as before. I liked Option B from round 1 (quiet Scandinavian A-frame — calm, architectural, pale oak, whitespace) for its restraint, but those three designs were not visually rich enough. I need three NEW homepage directions that are clearly more beautiful: cinematic photography, distinctive type, varied section rhythm, finished hospitality craft. Not another white page of equal cards.

PROPERTY: six private A-frame cabins on 70 acres in Rogers, Arkansas, near Bentonville. Couples, families, groups, remote workers. Primary CTA: Check availability. Real copy only — no lorem ipsum. Use ONLY the attached Remotely Rogers cabin photos (homepage/01 as a possible hero; each cabin’s 01 as its card). No Unsplash, no stock cabins, no generic forest-green rental template, no Fancy Hill visual language.

CONTENT to include (helpful info, rewritten for this property):
- Full-bleed photo hero with headline, subhead, Check availability
- The six cabins: Black Gum Getaway, Dogwood Den, Running Spring Retreat, Black Walnut Bungalow, White Oak Haven, Post Oak Perch — who each stay is for
- Nearby with drive times: Lake Atalanta ~8 min, downtown Rogers ~15 min, Bentonville trails ~20 min, Beaver Lake ~20 min, Crystal Bridges ~25 min
- How far from home: Fayetteville ~30 min, Tulsa ~1.5 hr, Springfield ~2 hr, Little Rock ~3 hr, Kansas City ~3.5 hr, Dallas ~5 hr
- What we offer: private A-frames, 70 acres, pet-friendly, Wi-Fi, book one cabin or several
- Pets + groups (short, practical)
- Short “our story” / host note (Jeff)
- Reviews from Jordan, Dakota, Daniel, Lorna (real quotes)
- Easy contact — not a stack of “book direct and save” banners

VISUAL BAR: every option must feel like a finished boutique-stay website, not a wireframe with photos. Required in all three:
- At least one full-viewport photo hero (real attached photo, not a tinted color block)
- Cabin presentation that is NOT six identical cards in a row — mix sizes, overlap, a featured cabin, a horizontal gallery, a bento, something designed
- Varied rhythm: large photo, then quiet type, then a different layout — never three stacked clones
- Distinctive typography you can name (not Inter / system UI / generic Airbnb)
- Hover/pressed states on buttons
- Sticky nav with logo, links, Check availability
- Desktop 1440 wide, polished, lots of craft: grain, soft shadow, careful crops, generous but not empty space

Give me three distinct homepages on the canvas:

D) Cinematic dusk lodge — still calm like Option B, but atmospheric. Full-bleed dusk/interior photos, type over imagery, charcoal / honey / fog, filmic. Quiet luxury, not camping brochure.

E) Paper and cedar — Japanese-inspired Ozark retreat. Rice-paper ground, cedar and sumi, one vermilion mark. Asymmetric, architectural photography, extremely considered. More beautiful than sparse Scandinavian.

F) Ozark maison — design-hotel / inn. Limestone, walnut, oxblood, brass. Big editorial serif, gallery grids, pull quotes on photos. Rich and inviting, not rustic-campground.

Do not reuse round 1’s cream/ink/oxblood magazine, pale-oak card grid, or bold condensed outdoor look. Do not invent checkout chrome. Label each artboard D, E, and F.
```

## Option F — full website (chosen)

Clients picked **F — Ozark maison**. Expand that style across every public flow that exists on [remotelyrogers.com](https://remotelyrogers.com) today, plus the multi-cabin booking calendar already built in this repo. Do not drop pages. Do not invent a new product.

Live nav today: **Home · All properties · Activities · Recommendations · Work Stays · Multi-Cabin Stays · Contact us**. Cabin URLs are `/en/{slug}/` for all six rentals. Reviews live on Home (per-cabin carousels + “Show all” modal), not a separate page. Work Stays has a Lodgify **booking inquiry** form. Contact is a full inquiry form + map. Do not add FAQ / Our story / Maps as standalone pages — they are not on the live site.

### Style lock (every screen)

- Mood: design hotel / inn, gallery-rich, limestone · walnut · oxblood · brass
- Type: big editorial serif + thin sans (name the fonts)
- Layout: magazine rhythm, bento and gallery grids, pull quotes on photos — not six identical cards
- Photography: only attached Remotely Rogers cabin photos
- Chrome: sticky nav (logo, Home, Cabins, Activities, Recommendations, Work Stays, Multi-Cabin, Contact, Check availability), multi-column footer (phone **479-440-5011**, email **Jeff@remotelyrogers.com**, **11611–11601 Lindy Lane, Rogers, AR 72756**, Instagram **@remotely.rogers**, Map/Directions)
- Currency **USD**. Never show EUR. Never show “Powered by Lodgify”
- Desktop 1440 for every page. Mobile 375 for Home, Cabins listing, Cabin detail, Group calendar, Contact, plus open mobile nav
- Hover/pressed on buttons. Real copy. No lorem ipsum. No forest-green Lodgify look. No Fancy Hill visuals

### Cabin display names (no SEO suffixes)

Black Gum Getaway · Dogwood Den · Running Spring Retreat · Black Walnut Bungalow · White Oak Haven · Post Oak Perch  
Each: 4 guests, 2-night minimum, Vacation Home, Wi‑Fi, from **$132 / night** (rates vary by date)

### Sitemap to mock (parity with the live site)

1. **Home** — full-bleed hero; booking bar (check-in, check-out, guests popover with adults / children / infants / pets, Search); Discover Remotely Rogers copy (70 acres, six A-frames, 4 guests, 1 pet); “comfortable cabins” amenities; “six cabins on one property” (book one or several); guest reviews grouped by cabin (Airbnb carousel, prev/next, Show all modal); CTA
2. **Cabins / All properties** — check-in, check-out, guests, Search, More filters, Sort by price; **6 results**; six cards (photo, name, Vacation Home · 4 guests, Wifi, from $132/night); map of Rogers / the property; empty/no-match state (designed — never “undefined Results”)
3. **Cabin detail (template: Black Gum Getaway)** — same template for all six. Gallery + View more pictures lightbox; 4 guests / 2 bedrooms / 3 beds / 1 bath; description (Beaver Lake, Crystal Bridges, MTB, book multiple cabins; note: two friendly free-range GSP dogs on site); highlights (parking, pets, Wi‑Fi); full amenity groups; house rules; check-in 3:00 PM / check-out 11:00 AM; location; rates; payment / cancel / $250 security hold; availability calendar; that cabin’s reviews; About host (Jeff Wolfe); sticky booking widget; cabin switcher for the other five
4. **Activities** — category filter (All, Outdoor, Biking, History, Dining, Nightlife, Weekend); featured; outdoor spots; trail cards; downtown / museum / Railyard Live; dining; sample adventure day; empty filter state; CTA
5. **Recommendations** — curated picks with external links; local tips; plan-a-day; pick-your-vibe itineraries (Outdoor day, Culture trip, Foodie evening); area map embed
6. **Work Stays** — cabin-as-office, Wi‑Fi, dedicated workspace, nature between meetings, team retreats; balanced workday; stay options (solo week, extended stay, team offsite); CTA; **booking inquiry form** (email, first name, last name, guests, phone, check-in, check-out, comment, which rental)
7. **Multi-Cabin Stays** — how group booking works (pick dates → select cabins → one checkout); **group booking calendar** (start date, guests 1–4, legend, six cabin rows with nightly price + min stay, cart, continue)
8. **Group checkout** — first name, last name, email, phone optional, notes optional, cart, Back + Pay now (one Stripe payment; **no fake card fields**)
9. **Checkout success** — payment received; per-cabin booked / failed; Book more cabins
10. **Contact** — phone, email, address, map; form (email, first name, last name, phone, date, time window, which rental, notes, Send); success after send

### How to run this in Claude Design

Stay in the **Option F** project if you still have it. If not: new project, attach Option F homepage screenshots plus the same cabin photos (`docs/design/assets/cabins/`). Paste the prompt below as one message. If the canvas fills up, send: “Continue the remaining labeled artboards in the same style lock, do not restyle.”

### Option F full-site prompt

Stay in the Option F project (or attach F screenshots). Attach cabin photos. Paste:

```
You already designed Option F — Ozark maison — for Remotely Rogers. Expand that EXACT visual system into mocks for the WHOLE public website. Cover every guest flow that exists on remotelyrogers.com today, plus the multi-cabin group calendar/checkout already on the property. Do not drop pages. Do not invent a new product. Do not add FAQ, Our story, or Maps as standalone pages. Do not invent a fake credit-card form.

This is a design-hotel rebuild of an existing six-cabin rental site, not a new startup landing page.

PROPERTY FACTS (keep; rewrite only for tone):
Remotely Rogers — six private A-frame cabins on 70 acres of Ozark woodland in Rogers, Arkansas, near Bentonville. Couples, families, groups, remote workers, corporate retreats. Each cabin: 4 guests, 2-night minimum, 1 pet welcome (arrange first). Check-in 3:00 PM, check-out 11:00 AM. Quiet hours 10:00 PM–8:00 AM. Two friendly free-range GSP dogs live on site.
Cabins (display names only — never the long SEO titles): Black Gum Getaway, Dogwood Den, Running Spring Retreat, Black Walnut Bungalow, White Oak Haven, Post Oak Perch.
Public contact: 479-440-5011 · Jeff@remotelyrogers.com · 11611–11601 Lindy Lane, Rogers, AR 72756 · Instagram @remotely.rogers
Host: Jeff Wolfe.
Currency: USD. Listing cards show from $132 per night (rates vary by date). Never EUR. Never “Powered by Lodgify”. Never “undefined Results”.

Primary CTA language: Check availability / Search / Book now / Pay now. Booking still happens through the calendar/widget — you are designing those widgets, not a new checkout product.

STYLE LOCK (every artboard, no exceptions):
- Ozark maison: design hotel / inn. Limestone, walnut, oxblood, brass. Name hex values on Foundations and reuse them.
- Big editorial serif + thin sans. Name the fonts (not Inter, not system UI, not Vollkorn-on-forest-green). Same pairing everywhere.
- Magazine rhythm: full-bleed photography, gallery / bento grids, pull quotes on photos, varied section weight. NEVER six identical equal cards in a row.
- Sticky nav on every page: wordmark, Home, Cabins, Activities, Recommendations, Work Stays, Multi-Cabin, Contact, Check availability.
- Footer on every page: phone, email, address, Instagram, Map/Directions. No Lodgify badge.
- ONLY the attached real Remotely Rogers cabin photos. No Unsplash, no stock cabins, no ChatGPT-generated interiors.
- Hover and pressed states on buttons and links. Real copy, no lorem ipsum.
- Desktop 1440 for pages. 375 for the mobile set listed below.

BUILD ORDER:
1) Artboard F-00 Foundations — palette swatches with hex, type scale, Default/Hover/Active buttons, text inputs, selects, date fields, cards, nav, footer, review card, cabin card, map chrome.
2) Then each labeled artboard below on its own canvas page. Keep Option F’s richness. Do not flatten into a Lodgify rental template.

ARTBOARDS — mock ALL of these, labeled exactly:

— SHARED OVERLAYS (can sit on top of a page) —
F-00a Mobile nav (375) — full-screen or sheet: same links + Check availability.
F-00b Guest popover — Adults, Children, Infants, Pets steppers. Cap so a stay stays within 4 guests per cabin. Apply / Reset.
F-00c Date-range calendar popover — check-in / check-out, 2-night minimum hint, blocked nights, Apply.

— 1. HOME (match live sections, Ozark maison craft) —
F-01 Home 1440
Full-bleed photo hero (attached homepage/01). Headline + subhead. Booking bar: Check-in, Check-out, Guests, Search.
Discover Remotely Rogers: 70 private acres, six A-frames, up to 4 guests, one pet, Ozark woodlands in Rogers AR, glass wall / seasons, trails.
Comfortable cabins: kitchenette with cookware, dishes, wine glasses, countertop appliances; towels, bedding, shampoo/conditioner/soap, hair dryer; fridge/freezer; designated parking.
Six cabins on one property: book one cabin or several together for family, friends, wedding parties, retreats — private spaces, shared land.
Guest Reviews: six cabin bands (photo + short name linking to that cabin). Each band is a review carousel (guest, stars, stay dates, quote, Airbnb). Prev/next. “Show all N reviews”. Stats like 5 · 12 reviews · Airbnb.
CTA to Cabins and to Multi-Cabin.
F-01b Home reviews modal — “All guest reviews” for one cabin, close.
F-M01 Home 375 — booking bar stacks; reviews become a single-column carousel.

— 2. CABINS / ALL PROPERTIES —
F-02 Cabins 1440
Toolbar: Check-in, Check-out, Guests, Search, More filters, Sort by price (min–max). Results count: “6 cabins”.
Six property cards using each cabin’s 01 photo: name, Vacation Home · 4 guests, Wifi, from $132 per night. Cards are NOT a boring identical grid — magazine / masonry / featured + list is fine as long as all six are findable.
Map of Rogers / Lindy Lane beside or below the list; pins for the property.
F-02b Cabins empty — dates with no availability. Designed empty state + “Try different dates” / “Ask about a group stay”. Never the text “undefined Results”.
F-02c More filters overlay — amenities (Wi-Fi, pets, parking, workspace, fireplace), bedrooms, apply/clear. Show the listing still populated behind it.
F-M03 Cabins 375 — list first, map accessible (tab or sheet).

— 3. CABIN DETAIL (Black Gum Getaway is the template for all six) —
F-03 Cabin detail 1440
Hero gallery + “View more pictures”. Facts: 4 guests, 2 bedrooms, 3 beds, 1 bathroom.
Description (keep facts): Welcome to Remotely Rogers, a six-cabin modern A-frame retreat. Central Rogers, AR — Beaver Lake, Crystal Bridges, MTB trails. Traveling with friends or extended family? Book multiple cabins. NOTE: 2 friendly free-range GSP dogs live on site.
Highlights: Parking, Pets welcome, Wireless internet.
Amenities by group (all of these belong on the page):
  Parking & facilities — Parking, Patio or balcony
  Kitchen & dining — BBQ, kitchenette, coffee machine, cookware, microwave, oven, fridge/freezer, toaster, dishes, wine glasses, dining table, coffee, cooking basics, cleaning products
  Internet & office — Wi-Fi, dedicated workspace
  Heating & cooling — A/C, ceiling fans, central heat, fireplace
  Bathroom & laundry — shower, towels, hair dryer, shampoo/conditioner/body soap, linens, extra pillows, room-darkening shades, clothing storage; laundromat nearby; cleaning available during stay
  Location — Mountain, rural, private entrance
  Safety — Smoke detector
  Policies — Children welcome, pets only after arrangement, no smoking, long-term stays allowed, credit cards accepted, accessible 24/7
House rules: quiet 10:00 PM–8:00 AM; pets by arrangement; no smoking; children welcome; check-in 3:00 PM; check-out 11:00 AM.
Location: Rogers, Benton County, AR. 12.6 mi to airport. Map.
Rates: prices vary by date — select a period.
Payment: 50% due at reservation; remainder 7 days before arrival.
Cancellation: 100% refund 30+ days; 50% at 14+ days; 0% after.
Security deposit: $250 pre-authorization, voided 2 days after departure.
Availability month calendar.
This cabin’s reviews (carousel + Show all) — Airbnb quotes.
About the host: Jeff Wolfe. Email Jeff@remotelyrogers.com, phone 479-440-5011. Do not use any other phone number.
Sticky booking widget: from $132/night, stars, check-in, check-out, guests, night count, estimated total, Book now.
Cabin switcher or “More cabins on this property” so the other five are one click away.
F-03b Gallery lightbox — grid of real Black Gum photos, close, next/prev.
F-03c Booking widget with dates chosen — 2+ nights, line items (nights × rate), Book now enabled.
F-M02 Cabin detail 375 — gallery on top, widget becomes a sticky bottom bar (from $132 · Check availability) that expands.

— 4. ACTIVITIES —
F-04 Activities 1440
Hero: Activities & Adventures. Stats: 70 private acres · 6 A-frames · 15 min to downtown.
Category filter: All, Outdoor, Biking, History, Dining, Nightlife, Weekend trips. Show All selected.
Featured: Hobbs State Park (25 min), Lake Atalanta (8 min), World-class biking (Slaughter Pen / Coler).
Outdoor: Lake Atalanta, Prairie Creek Marina, War Eagle Cavern, Hobbs.
Trails: Lake Atalanta 8 min, Slaughter Pen 20 min, Coler 22 min, Fitzgerald Mountain 25 min.
Culture: Historic Downtown Rogers (12 min), Rogers Historical Museum, Railyard Live.
Dining: The Buttered Biscuit, Smokin’ Joe’s Ribhouse, Louise Café, House 1830, Tekila’s, Crystal Bridges Café.
Sample adventure day: morning trails/lake → afternoon ride/explore → evening downtown dinner & music.
CTA to Recommendations and Check availability.
F-04b Activities filtered to Biking — only biking featured + trail cards; other sections hidden or emptied on purpose.
F-04c Activities empty filter — a category with nothing visible gets a designed empty + “Show all”.

— 5. RECOMMENDATIONS —
F-05 Recommendations 1440
Hero: Our Recommendations. Stats: 6 curated picks · 12 min to downtown · NWA day-trip region.
Six linked picks: The Buttered Biscuit, Crystal Bridges (25 min), Beaver Lake (20 min), Downtown Rogers (12 min), Railyard Live, Pea Ridge National Military Park.
Local tips: start mornings slow; Bentonville is a day trip; book dining on weekends; rain backup; ask Jeff for seasonal events; most drives 8–25 min.
Plan a day: brunch → lake or culture → downtown Rogers.
Pick your vibe: Outdoor day · Culture trip · Foodie evening.
Area map embed (Rogers & Northwest Arkansas) for pinned favorites.
CTA: Book your stay.

— 6. WORK STAYS —
F-06 Work Stays 1440
Hero: Work Stays at Remotely Rogers. Stats: 6 private cabins · 70 work-ready acres · Wi-Fi in every cabin.
Private A-frame offices (desk, chair, Wi-Fi, natural light). Nature between meetings. Team & corporate retreats (multi-cabin).
Need list: high-speed Wi-Fi; dedicated workspace; no shared walls; weekly/extended stays; Rogers & Bentonville access; on-site parking.
Balanced workday: Coffee & deep work → Walk or ride → Calls & collaboration.
Stay options: Solo work week (1 cabin, 5–7 nights); Extended stay (4+ weeks); Team offsite (multiple cabins).
Link to Multi-Cabin. CTA: Inquire about a work stay.
Inquiry form (this is on the live Work Stays page — keep it): Email, First name, Last name, Guests, Phone, Check-in, Check-out, Comment, Which rental (dropdown of the six cabins), Send.

— 7. MULTI-CABIN STAYS + GROUP CALENDAR —
F-07 Multi-Cabin 1440
Hero: Multi-Cabin Stays. Stats: 6 private cabins · 70 shared acres · 1 combined checkout.
How it works: (1) Pick dates (2) Select cabins (3) One combined checkout.
Then the group booking calendar (this is real product UI, design it in Option F materials — not a spreadsheet, not Lodgify admin):
  - Start date, Guests (1–4 per cabin), Update
  - Hint: click available nights on a cabin row; click a second night 2–5 days away to fill between; click again to clear that cabin. Cabins may have different check-in/out.
  - Toolbar: month label, prev / next / Today
  - Legend: Available, Reserved, Closed, Selected
  - Six cabin rows: thumbnail, short name, horizontal night cells. Available cells show $ price and min-stay (moon + 2). Reserved = lock bar. Closed = ban bar.
  - Cart: selected cabins + date ranges + line totals + estimated total + Continue to checkout. Empty cart copy when nothing selected.
  - Note: You’ll pay for every selected cabin in one Stripe checkout. Do not draw card fields here.
F-07b Calendar with two cabins selected (e.g. Black Gum + Dogwood, possibly different dates), cart filled, Continue enabled.
F-07c Calendar error/empty — loading spinner treatment; availability error message; selection conflict warning (e.g. min nights).
F-M04 Group calendar 375 — rows scroll horizontally; cart stacks below or as a sticky sheet.

— 8. GROUP CHECKOUT —
F-08 Checkout 1440
Guest details: First name, last name, email (required); phone optional; notes optional. Inline errors for missing name/email.
Lead-in: You’ll pay for every selected cabin in one Stripe checkout. After payment we create one reservation per cabin.
Cart summary of selected cabins. Back + Pay now.
Do NOT draw credit-card number / CVC / expiry fields. Pay now is a handoff.
F-08b Checkout validation — first name + email errors visible; Pay now disabled or showing errors.

— 9. CHECKOUT SUCCESS —
F-09 Success 1440
Payment received. We’re confirming each cabin reservation.
Per-cabin result list: Booked · #id  OR  a failed cabin with an error line.
Group id. Book more cabins.
Also show a confirming/loading treatment (spinner + “Confirming your payment and creating reservations”).

— 10. CONTACT —
F-10 Contact 1440
Headline Contact. Phone 479-440-5011, Jeff@remotelyrogers.com, 11611–11601 Lindy Lane, Rogers, AR 72756. Map/Directions.
Form matching live fields: Email, First name, Last name, Phone, Date, Time window (2-hour slots), Which rental, Notes, Send.
F-10b Contact sent — success confirmation, not a dead end (link Home / Cabins).
F-M06 Contact 375.

COPY TO USE (do not replace with lorem):
Hero: Six private A-frames on 70 acres. Minutes from Bentonville trails and downtown Rogers.
Jordan: “Couldn’t recommend this place more! 11/10. Not only is it clean, peaceful, and beautiful, it feels like a piece of home.”
Dakota: “This place was perfect! We wanted a quiet, modern place that allowed pets and that was exactly what we got.”
Daniel: “On a 3k mile road trip, this was the most pristine and aesthetically pleasing place we stayed.”
Lorna: “Such a beautiful place and Jeff was amazing — great directions, recommendations, and a wonderful home.”
Also use other real Airbnb quotes already in the brief/home (Cody, Dianna, Alex, Kathryn, etc.) for cabin-grouped reviews.

HARD NO:
- Forest green + terracotta Lodgify look, Vollkorn default, EUR currency, Powered by Lodgify
- Fancy Hill campground / RV / tent / waterfall / “book direct and save” banners
- Fake card-checkout chrome, Stripe Elements drawing, order-confirmation emails
- Stock photography
- New pages that are not on the live site
- Dropping Reviews, inquiry forms, map, filters, calendar, or any of the six cabins
```
