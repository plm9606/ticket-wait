# Design System: The Nocturnal Editorial

> Source: Stitch project `8862225868572198939` — Home & Explore, Concert Details screens

---

## 1. Creative Direction

**North Star**: The Digital Curator — a premium backstage pass, not a database.

- **Quiet Luxury**: Sophisticated monochromatic palette, large-scale typography, generous negative space
- **Organic Minimalism**: Negative space is as important as content
- **No clutter**: No borders, no vivid colors, no "noisy" ticket platform aesthetics

---

## 2. Color Tokens (Monochromatic Surface System)

### Surface Hierarchy (Tonal Layering)

| Token | Hex | Role |
|-------|-----|------|
| `surface` | `#f9f9fb` | Level 0 — Base canvas (body background) |
| `surface-container-low` | `#f3f3f5` | Level 1 — Content grouping sections |
| `surface-container` | `#eeeef0` | Level 1.5 — Mid-weight containers |
| `surface-container-high` | `#e8e8ea` | Level 2 — Secondary buttons, inactive chips |
| `surface-container-highest` | `#e2e2e4` | Level 2.5 — Category chips (inactive) |
| `surface-container-lowest` | `#ffffff` | Level 3 — Interactive cards, inputs, elevated items |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#000000` | High-impact typography, primary CTAs |
| `primary-container` | `#3b3b3b` | CTA gradient endpoint, premium sheen |
| `primary-fixed-dim` | `#474747` | Hover state for primary buttons |
| `on-primary` | `#e2e2e2` | Text on primary backgrounds |
| `on-surface` | `#1a1c1d` | Titles, primary text |
| `on-surface-variant` | `#474747` | Secondary text, metadata, subtitles |
| `tertiary` | `#3b3b3b` | Artist Pulse dot, accent indicators |
| `outline-variant` | `#c6c6c6` | Ghost borders (always at 10-20% opacity) |
| `secondary-container` | `#d6d4d3` | Notification chips background |
| `error` | `#ba1a1a` | Destructive actions only |

### The "No-Line" Rule

- **NEVER** use `border-b`, `border-t`, `<hr>`, or 1px solid borders to separate content
- Boundaries = background color shifts (`surface` -> `surface-container-low`)
- Only exception: **Ghost Border** = `border-outline-variant/10` (10% opacity) for card footer dividers

---

## 3. Typography

### Font Stack

| Role | Family | CSS Variable | Fallback |
|------|--------|-------------|----------|
| Headline / Display | **Manrope** | `font-headline` | Pretendard, system-ui |
| Body / Label | **Inter** | `font-body`, `font-label` | Pretendard, system-ui |

### Type Scale (from Stitch screens)

| Level | Family | Weight | Size | Tracking | Usage |
|-------|--------|--------|------|----------|-------|
| Display-lg | Manrope | 900 (black) | 6xl~8xl | tighter | Concert detail hero artist name |
| Headline-lg | Manrope | 800 (extrabold) | 3xl (1.875rem) | tight | Section titles ("Upcoming for You") |
| Headline-md | Manrope | 800 (extrabold) | xl (1.25rem) | tight | Sidebar section titles |
| Title-lg | Manrope | 700 (bold) | 2xl (1.5rem) | tight | Popular card concert name |
| Title-md | Manrope | 700 (bold) | xl (1.25rem) | tight | Upcoming card concert title |
| Body-lg | Inter | 400 | lg (1.125rem) | normal | Editorial body copy |
| Body-md | Inter | 500 (medium) | sm (0.875rem) | normal | Subtitles, metadata |
| Body-sm | Inter | 500 (medium) | sm (0.875rem) | normal | Venue info, descriptions |
| Label-lg | Inter | 700 (bold) | sm (0.875rem) | normal | Button text, chip text |
| Label-sm | Inter | 700 (bold) | xs (0.75rem) | widest (0.1em) | View All, action links, UPPERCASE |
| Label-xs | Inter/Manrope | 700 (bold) | [10px] | widest (0.1em) | Status badges, tab labels, UPPERCASE |
| Caption | Inter | 600 (semibold) | xs (0.75rem) | wider (0.05em) | Date/venue on card overlays, UPPERCASE |

### The "High-Contrast" Rule
- Titles: `on-surface` (`#1a1c1d`)
- Secondary metadata: `on-surface-variant` (`#474747`)
- Font size alone creates hierarchy — no color needed

---

## 4. Elevation & Depth

### Tonal Layering (Primary depth method)
- **Level 0**: `surface` (The Floor)
- **Level 1**: `surface-container-low` (Section grouping — Popular Near You background)
- **Level 2**: `surface-container-lowest` (Interactive cards atop Level 1)

### Shadows (Ambient Light)
- Cards: `shadow-sm` — minimal, never heavy
- Bottom nav: `shadow-[0_-4px_24px_rgba(0,0,0,0.04)]` — soft upward glow
- FAB/CTA: `shadow-xl` — only for primary floating actions
- No "dirty" pure white shadows — always tinted with surface tone

### Glassmorphism
- **Header**: `bg-surface/80 backdrop-blur-md` (80% opacity + 12px blur)
- **Bottom nav**: `bg-white/90 backdrop-blur-xl` (90% opacity + 24px blur)
- **Badges on images**: `bg-white/90 backdrop-blur` or `bg-primary/90 backdrop-blur-md`

---

## 5. Spacing & Rhythm

| Token | Value | Usage |
|-------|-------|-------|
| `px-6` | 1.5rem (24px) | Standard horizontal padding (pages, cards) |
| `p-8` | 2rem (32px) | Large card content padding |
| `p-3` | 0.75rem (12px) | Compact items (album list, chips) |
| `gap-3` | 0.75rem | Chip spacing |
| `gap-4` | 1rem | Icon groups, compact lists |
| `gap-6` | 1.5rem | Card scroll horizontal gap |
| `gap-10` | 2.5rem | Major section vertical gap |
| `mb-6` | 1.5rem | Section header to content |
| `mb-8` | 2rem | Large section header to content |
| `mb-12` | 3rem | Between major sections |
| `py-12` | 3rem | Background section vertical padding |
| `pb-32` | 8rem | Bottom padding (above fixed nav) |

### Key principle: Let the content breathe
- Section-to-section: `mb-12` (3rem) minimum
- Card-to-card (vertical): `gap-10` (2.5rem)
- Card-to-card (horizontal): `gap-6` (1.5rem)

---

## 6. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-full` | 9999px | Chips, badges, avatar, pulse dot |
| `rounded-3xl` | 1.5rem | Large Popular cards |
| `rounded-2xl` | 1rem | Upcoming concert cards, bottom nav |
| `rounded-xl` | 0.75rem | Buttons, inputs, date badges, album art, active tab pill |
| `rounded-lg` | 0.5rem | Small thumbnails |

---

## 7. Component Specifications

### 7.1 Top App Bar (Header)

```
sticky top-0 h-16 px-6 bg-surface/80 backdrop-blur-md z-50
```

| Element | Spec |
|---------|------|
| Layout | `flex justify-between items-center` |
| Left | Hamburger icon (24px) + Logo |
| Logo | `font-headline font-black tracking-tighter text-2xl` ("Backstage") |
| Right | Profile avatar `w-8 h-8 rounded-full` with `ring-1 ring-outline-variant/20` |
| Concert detail variant | Back arrow left, Logo center, Avatar right |

### 7.2 Bottom Navigation Bar

```
fixed bottom-0 w-full bg-white/90 backdrop-blur-xl
shadow-[0_-4px_24px_rgba(0,0,0,0.04)] rounded-t-2xl
px-4 pb-6 pt-3 z-50
```

| Element | Spec |
|---------|------|
| Items | Home, Explore, Alerts, Profile |
| Icons | Material Symbols Outlined, 24px |
| Inactive | `text-zinc-400` icon + label |
| Active | `bg-zinc-900 text-white rounded-xl px-4 py-1.5` (pill style) |
| Label | `font-headline font-medium text-[10px] uppercase tracking-widest` |

### 7.3 Search Bar

```
Section: px-6 pt-8 pb-6
```

| Element | Spec |
|---------|------|
| Container | `bg-surface-container-lowest border-none h-14 rounded-xl shadow-sm` |
| Left icon | Search icon, `text-on-surface-variant`, padding `pl-12` |
| Placeholder | `text-on-surface-variant/50 font-medium` |
| Focus | `focus:ring-0 focus:border-b-2 focus:border-primary` |

### 7.4 Category Chips

```
Section: pb-10
Scroll: flex overflow-x-auto no-scrollbar gap-3 px-6
```

| State | Spec |
|-------|------|
| Active | `bg-primary text-on-primary rounded-full px-6 py-2.5 font-label text-sm font-semibold tracking-wide` |
| Inactive | `bg-surface-container-highest text-on-surface rounded-full px-6 py-2.5 font-label text-sm font-medium` |
| Hover (inactive) | `hover:bg-surface-variant` |

### 7.5 Upcoming Concert Card (Horizontal scroll)

```
Container: w-[280px] flex-shrink-0
Image: aspect-[4/5] rounded-2xl overflow-hidden
```

| Element | Spec |
|---------|------|
| Image | `object-cover`, hover: `scale-105 duration-700` |
| Gradient overlay | `absolute inset-0 bg-gradient-to-t from-black/60 to-transparent` |
| Status badge | `absolute top-4 left-4`, `bg-primary/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-tighter` |
| Date + Venue | `absolute bottom-4 left-4 right-4`, `text-white/80 text-xs font-semibold uppercase tracking-wider` |
| Title | `text-white font-headline font-bold text-xl leading-tight` |
| No image fallback | `bg-surface-container-low` placeholder |

### 7.6 Popular Concert Card (Large vertical)

```
Container: bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm
Image: aspect-[16/9] overflow-hidden
```

| Element | Spec |
|---------|------|
| Image | `object-cover`, hover: `scale-105 duration-1000` |
| Date badge | `absolute top-6 left-6 w-14 h-16 bg-white/90 backdrop-blur rounded-xl` |
| Date month | `text-[10px] font-black uppercase text-on-surface-variant leading-none` |
| Date day | `text-2xl font-black text-primary leading-none` |
| Content area | `p-8` |
| Title | `font-headline font-bold text-2xl tracking-tight mb-2` |
| Venue row | `flex items-center gap-2 text-on-surface-variant font-medium text-sm` |
| CTA button | `bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm` |
| Artist row | `pt-6 border-t border-outline-variant/10` (Ghost Border exception) |
| Artist avatars | `w-8 h-8 rounded-full border-2 border-white -space-x-2` stack |

### 7.7 Section Header

```
Layout: flex justify-between items-end px-6 mb-6
```

| Element | Spec |
|---------|------|
| Title | `font-headline font-extrabold text-3xl tracking-tight leading-none` |
| Subtitle | `text-on-surface-variant font-medium mt-2` |
| Action link | `text-xs font-bold uppercase tracking-widest text-primary` |
| Live indicator | `w-2 h-2 rounded-full bg-tertiary animate-pulse` + `text-[10px] font-bold uppercase tracking-widest text-on-surface-variant` |

### 7.8 Concert Detail Hero

```
Section: relative h-[618px] w-full overflow-hidden bg-primary
```

| Element | Spec |
|---------|------|
| Hero image | `w-full h-full object-cover opacity-70 grayscale` |
| Gradient | `absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent opacity-60` |
| Tour badge | `rounded-full bg-surface-container-lowest/20 backdrop-blur-md text-white text-xs font-bold tracking-widest uppercase` |
| Artist name | `font-headline font-black text-white text-6xl md:text-8xl tracking-tighter leading-none` |
| Meta row | `flex gap-6 text-on-primary font-medium tracking-tight` with material icons `text-sm` |

### 7.9 Quick Actions Card (Concert Detail)

```
Container: bg-surface-container-lowest p-8 rounded-xl shadow-sm
Position: -mt-10 relative z-10 (overlaps hero)
```

| Element | Spec |
|---------|------|
| Availability label | `text-on-surface-variant text-sm font-semibold uppercase tracking-wider` |
| Pulse dot | `w-2.5 h-2.5 rounded-full bg-zinc-900 animate-pulse` |
| Availability text | `text-2xl font-bold tracking-tight` |
| Secondary button | `bg-surface-container-high rounded-xl px-6 py-4 font-bold` + icon |
| Primary button | `bg-primary text-white rounded-xl px-10 py-4 font-bold shadow-xl` + icon |

### 7.10 Bento Grid (Venue section)

```
Layout: grid grid-cols-1 md:grid-cols-2 gap-6
Card: bg-surface-container-low p-6 rounded-xl h-64
```

| Element | Spec |
|---------|------|
| Title | `font-headline font-extrabold text-xl mb-2` |
| Body | `text-on-surface-variant leading-relaxed` |
| Action links | `text-xs font-bold uppercase tracking-widest` with icon |
| Map | `rounded-xl overflow-hidden grayscale contrast-125` |

### 7.11 Editorial Content Section

| Element | Spec |
|---------|------|
| Divider | `border-t border-outline-variant/20` (Ghost Border) |
| Section title | `font-headline font-black text-4xl tracking-tighter mb-8` |
| Body text | `text-on-surface-variant text-lg leading-relaxed` |
| Emphasis | `font-bold text-on-surface italic` |

### 7.12 Album / List Item

```
Container: bg-surface-container-lowest p-3 rounded-xl
Hover: hover:bg-white
```

| Element | Spec |
|---------|------|
| Thumbnail | `w-16 h-16 rounded-lg overflow-hidden` |
| Title | `font-bold text-sm tracking-tight` |
| Subtitle | `text-on-surface-variant text-xs` |
| Action icon | `text-zinc-300 group-hover:text-zinc-900` |

### 7.13 Similar Artist Card

```
Container: aspect-square rounded-xl overflow-hidden
```

| Element | Spec |
|---------|------|
| Image | `object-cover grayscale`, hover: `scale-110 duration-700` |
| Gradient | `absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent` |
| Name | `absolute bottom-3 left-3 text-white font-bold text-xs tracking-widest uppercase` |

### 7.14 Artist Pulse Dot

```
Position: fixed right-6 bottom-28 z-40
```

| Element | Spec |
|---------|------|
| Ping ring | `animate-ping absolute w-3 h-3 rounded-full bg-tertiary opacity-75` |
| Core dot | `relative w-3 h-3 rounded-full bg-tertiary` |

---

## 8. Interaction Patterns

### Hover Effects
- Card images: `transition-transform duration-700 group-hover:scale-105`
- Popular cards: `duration-1000` (slower, more premium feel)
- Buttons: `active:scale-95` (tap feedback)
- Primary button hover: shift to `primary-fixed-dim` (`#474747`)
- Links/actions: `hover:opacity-70` (only for text links)

### Animations
- `animate-pulse`: Live indicators, availability dots
- `animate-ping`: Artist Pulse outer ring
- `animate-fade-in`: Page/section entry
- `animate-slide-up`: Sequential card loading

### Scrolling
- Horizontal sections: `overflow-x-auto no-scrollbar` (hidden scrollbar)
- Category chips: `gap-3`, cards: `gap-6`
- Vertical: Natural scroll, `pb-32` for bottom nav clearance

---

## 9. Responsive Strategy

| Breakpoint | Behavior |
|-----------|----------|
| Mobile (< md) | Single column, bottom nav visible, full-width sections |
| Desktop (>= md) | 12-col grid, bottom nav hidden (`md:hidden`), sidebar appears |
| Concert detail | Mobile: stacked. Desktop: `lg:col-span-8` + `lg:col-span-4` sidebar |
| Hero text | Mobile: `text-6xl`. Desktop: `text-8xl` |

---

## 10. Do's and Don'ts

### Do
- Use background shifts for section boundaries
- Use `tracking-tighter` on display/headline sizes
- Use `uppercase tracking-widest` for small labels
- Use `grayscale` on hero/similar-artist images for editorial mood
- Use generous padding (`p-8` for cards, `px-6` for pages)

### Don't
- No 1px solid borders (except Ghost Border at 10% opacity)
- No vivid colors (stay monochromatic)
- No heavy drop shadows
- No default browser blue for links
- No `<hr>` elements
- No tight spacing between major sections
