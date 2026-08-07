# Lodgify Global Styles — Remotely Rogers

Apply these settings once in the website builder: **Styles** tab.

## Colors

| Setting | Value | Notes |
|---------|-------|-------|
| Primary / Links | `#2d4a3e` | Deep forest green |
| Primary darker | `#1e3329` | Hover states |
| Secondary | `#5a7d6a` | Sage accent |
| Buttons and actions | `#c45c3e` | Warm terracotta CTA |
| Button hover | `#a84d34` | Darker terracotta |
| Text | `#3d3d3d` | Body copy |
| Headings | `#1e3329` | Section titles |

## Fonts

The site already uses **Vollkorn**. Keep it consistent:

| Element | Font | Weight |
|---------|------|--------|
| Main heading | Vollkorn | 700 |
| Paragraph | Vollkorn | 400 |
| Buttons | Vollkorn or system sans | 400–600 |

If Vollkorn is not selected, choose it under **Styles → Fonts**.

## Logo

Under **Styles → Logo**, resize so the header stays balanced on mobile (use the slider; ~120–160px width is typical).

## Buttons

- Border radius: **8px** (small/medium)
- Primary button background: `#c45c3e`
- Primary button text: white

## Page setup checklist

For each content page (Activities, Recommendations, Work Stays, Multi-Cabin Stays):

1. Open **Pages → [page name]**
2. **Remove** existing plain Text widgets with emoji headers
3. **Add new widget → Raw HTML**
4. Paste the matching file from `dist/lodgify-snippets/` (exported from Angular — see [BUILDER-GUIDE.md](BUILDER-GUIDE.md))
5. Drag the widget to the top of the page (below nav if a hero is included)
6. **Publish website**

## Multi-Cabin page SEO fix

**Pages → Multi-Cabin Stays → Page settings (gear icon):**

- **Page title / SEO title:** `Multi-Cabin Stays | Remotely Rogers`
- **Meta description:** `Book multiple private A-frame cabins together on 70 acres in Rogers, Arkansas. Perfect for families, groups, and corporate retreats.`

## Header custom HTML (optional)

To load shared styles site-wide, add to **Settings → Advanced → Header – Custom HTML**:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Vollkorn:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
```
