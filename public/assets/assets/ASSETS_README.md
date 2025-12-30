# FixAlways – Asset Pack Requirements (v1) – Builder Notes

This `assets/` directory matches the required structure for FixAlways.
Everything is designed for **dark UI surfaces** and intended to be used as real UI assets (not baked into images).

---

## Folder Map

- `brand-kit/tokens.css` – design tokens (single source of truth)
- `logos/` – SVG-first logo set + raster fallbacks
- `hero/` – hero background images with calm left side for text overlay
- `icons/` – single-color SVG UI icons (CSS tint using `currentColor`)
- `social/og-default.png` – Open Graph default preview image
- `favicon/` – favicon + app icons

---

## Logos

Primary files:
- `logos/logo-horizontal.svg`
- `logos/mark.svg`

Raster fallbacks:
- `logos/logo-horizontal.webp` and `.png`
- `logos/mark.webp` and `.png`

Monochrome variants (for special cases):
- `logos/*-black.*`
- `logos/*-white.*`

Rules:
- Transparent backgrounds only
- No glow, shadows, or rounded rectangles
- Must work on dark backgrounds

---

## Hero Images (background-only)

- `hero/desktop.webp` (1920×720)
- `hero/tablet.webp` (1440×600)
- `hero/mobile.webp` (1080×1350)

Rules:
- Left ~40% is reserved for text overlay (kept intentionally calm)
- Do NOT place UI elements inside the hero image
- If readability needs a boost, add a CSS gradient overlay (preferred)

---

## Icons

Located in `icons/`:
- `phone.svg`
- `website.svg`
- `map.svg`
- `star.svg`
- `search.svg`
- `filter.svg`

All icons are single-color and tintable:
- stroke icons use `stroke="currentColor"`
- the star uses `fill="currentColor"`

Usage example:
```css
.icon { color: var(--muted); }
.icon--primary { color: var(--primary); }
```

---

## Tokens

Use `brand-kit/tokens.css` for:
- background/surface colors
- text + muted text
- primary colors
- radius + shadow
- font stack + type scale

Do not hardcode values; extend tokens if needed.

---

## Social + Favicons

- `social/og-default.png` – 1200×630
- `favicon/` – includes `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`

---

If any asset doesn’t fit the layout, adjust the asset (not the UI) so everything stays consistent.


## Hero Accent (Option B)

Added:
- `hero/accent-right.webp` (and `.png`) — place on the far right as a decorative layer.

Usage:
- Position absolute right: 0; bottom: 0;
- Set width ~45–55% of hero container.
- Keep opacity ~0.18–0.28.
- Do not overlap the left 40% text-safe region.
