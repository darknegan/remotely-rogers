# Fix: All Properties "undefined Results"

The live page at https://remotelyrogers.com/en/all-properties/ shows **"undefined Results"** when no properties match or property metadata is incomplete.

## Steps in Lodgify Dashboard

### 1. Verify all cabins are published

1. Go to **Properties** in the main Lodgify menu.
2. Open each of the 6 cabins.
3. Confirm status is **Published** / **Active** (not draft).
4. Each property must have:
   - At least one photo
   - Base rate configured
   - Availability calendar open for future dates
   - Room type with max guests set

### 2. Website builder — All Properties page

1. Open **Website → Edit** (builder 631648).
2. Go to **Pages → All properties** (or equivalent listing page).
3. Ensure the page type is **All Properties** / listing — do not replace with a blank custom page.
4. Check page settings: language = English, page is **visible in navigation**.

### 3. Search widget settings

1. In website builder: **Settings → Widgets** (or Website settings → Widgets).
2. Confirm **Search box** widget is configured for **multiple properties**.
3. Regenerate embed code if you changed property selection.
4. On homepage, verify the search widget section is present and not hidden on mobile.

### 4. Property groups (optional)

If using property groups/filters:

1. **Settings → Property groups** — ensure all 6 cabins belong to a group shown on the website.
2. Remove filters that exclude all properties (location, type, etc.).

### 5. Publish and verify

1. Click **Publish website**.
2. Visit https://remotelyrogers.com/en/all-properties/
3. Hard-refresh (Ctrl+Shift+R).
4. Run a search with dates 2+ weeks out — you should see cabin cards with names and prices.

## If still broken

- Contact Lodgify support with account ID **631648** — "All properties page shows undefined Results."
- Check browser console for JavaScript errors on the listing page.
- Confirm subscription includes all 6 property slots.

## Multi-cabin search link

After fix, link group booking CTAs to:

```
/en/all-properties/?adults=2&children=0&infants=0&pets=0
```

With date params when pre-filling from the Angular group-booking widget:

```
/en/all-properties/?from=YYYY-MM-DD&to=YYYY-MM-DD&adults=2
```

The group-booking iframe lives on the Multi-Cabin Stays page — see [BUILDER-GUIDE.md](../BUILDER-GUIDE.md).
