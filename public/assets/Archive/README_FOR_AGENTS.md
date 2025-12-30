# FixAlways – Asset Pack (Agent / Builder README)

This pack contains web-ready design assets for **FixAlways** based on the approved **top hero banner concept** (semi-3D friendly style).

Use this when building the website UI, marketing pages, and share previews.

---

## 1) Quick Start

**Recommended default usage**
- Use **WebP** assets on the web for performance
- Fall back to **PNG** when transparency is needed or for compatibility
- Use the CSS tokens in `brand-kit/tokens.css` to keep colors consistent

**Folder you should import**
- `hero/` (homepage hero banners)
- `logos/` + `icons/` (branding + favicons)
- `banners/` + `social/` + `email/` (supporting headers + share images)
- `brand-kit/` (palette + CSS tokens)

---

## 2) Folder Structure

```
FixAlways_Asset_Pack/
├─ hero/
│  ├─ desktop/
│  ├─ tablet/
│  └─ mobile/
├─ logos/
├─ icons/
│  └─ favicons/
├─ banners/
├─ social/
├─ email/
├─ brand-kit/
│  ├─ palette.json
│  └─ tokens.css
├─ README.txt
└─ README_FOR_AGENTS.md  <-- (this file)
```

---

## 3) Brand Specs (Use These)

### Typography
**Primary font:** Inter  
**Fallback stack:**
```css
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

**Weights**
- Body: 400 (Regular)
- Buttons: 500 (Medium)
- Headings: 600 (SemiBold) / 700 (Bold)

**Suggested sizes**
- H1 (hero): 44–56px (responsive)
- H2: 28–36px
- Body: 16–18px
- Small: 14px

---

### Colors (Official)
These values are also in `brand-kit/palette.json` and `brand-kit/tokens.css`.

**Primary**
- Trust Blue: `#1F3A5F`
- Action Green (CTA): `#2ECC71`

**Interaction**
- CTA Hover: `#27AE60`

**Neutrals**
- Soft Sky: `#EAF2F8`
- Neutral Gray: `#F4F6F8`
- Text Charcoal: `#2B2B2B`

---

## 4) Which Assets To Use Where

### Logos
Use the horizontal logo for the header nav:
- `logos/fixalways-logo-horizontal.png`
- (WebP version is included alongside it)

Icon-only usage (app mark / favicon base):
- `icons/fixalways-icon.png`

### Favicons
Use everything in:
- `icons/favicons/`

Typical implementation:
- `favicon.ico`
- `apple-touch-icon.png`
- 16/32 PNGs if needed

### Homepage Hero
Primary desktop hero:
- `hero/desktop/fixalways-hero-1920x720.webp` (preferred)
- `hero/desktop/fixalways-hero-1920x720.png`

Tablet:
- `hero/tablet/fixalways-hero-1440x600.webp`
- `hero/tablet/fixalways-hero-1024x600.webp`

Mobile (stacked composition):
- `hero/mobile/fixalways-hero-375x520.webp`

### Section Header Banners
These are neutral headers intended for key pages:
- `banners/fixalways-section-categories-1920x360.webp`
- `banners/fixalways-section-about-us-1920x360.webp`
- `banners/fixalways-section-how-it-works-1920x360.webp`
- `banners/fixalways-section-blog-1920x360.webp`

### Social Share (Open Graph)
Use for meta tags + link previews:
- `social/fixalways-open-graph-1200x630.webp`

### Email Header
Use for marketing + transactional templates:
- `email/fixalways-email-header-600x200.webp`

---

## 5) UI Component Guidelines

### Primary CTA Button
- Background: `#2ECC71`
- Hover: `#27AE60`
- Text: white
- Radius: 10–12px
- Padding: 12px 18px (desktop), 12px 16px (mobile)

### Search Bar
- Background: white
- Border: `1px solid #E0E6EB`
- Radius: 12px
- Focus border: `#2ECC71`
- Placeholder: `#7A8894`

---

## 6) Accessibility + Contrast Notes

- Trust Blue (`#1F3A5F`) on white works well for headings and nav
- Ensure button text remains white on Action Green (it does)
- Keep body copy at least `#2B2B2B` on light backgrounds for readability

---

## 7) Implementation Notes

- Use `tokens.css` as the single source of truth for color variables
- Prefer responsive type scaling (clamp) for hero headings
- Use WebP for banner images (reduced file sizes)
- Keep hero image `loading="eager"` for above-the-fold impact; all others can be lazy loaded

---

## 8) If You Need More

If you need:
- true vector SVG logos
- editable source files (Figma/AI)
- additional page banners
- category icon set (plumbing, electrical, cleaning, auto, etc.)

Ask and we can generate them in the same semi-3D style.

---
**Pack Owner:** FixAlways  
**Design Direction:** Semi-3D friendly local-service marketplace look
