# Food Ordering Platform — UI Standards

Production color system and usage rules for customer-facing web UI. Default tenant: **Jay's Kerala Kitchen** (`jkkfds`).

---

## 1. Brand identity

The platform design should feel:

- Premium
- Warm
- Trustworthy
- Homely
- Food-focused
- Modern Kerala-inspired
- Clean and minimal

**Visual mood:** earthy elegance, premium organic food service, calm and welcoming.

**Avoid:**

- Neon colors
- Overly saturated tones
- Sharp contrast-heavy UI
- Cold corporate styling

---

## 2. Core brand colors

### Primary brand color

```css
#1f6f5f
```

**Purpose:** primary CTA buttons, active states, important highlights, selected cards, progress indicators.

**Usage:** main brand identity color on customer flows (`TenantHome`, `AccountSetupPage`, `OrderAddressPage`, and related screens).

### Primary dark variant

```css
#183f38
```

**Purpose:** hover states, dark sections, footer backgrounds, premium contrast areas, hero overlays.

### Secondary brand green

```css
#2c5d54
```

**Purpose:** secondary UI accents, card borders, tags, info sections, subtitles.

---

## 3. Accent colors

### Food accent orange

```css
#fe8c00
```

**Purpose:** CTA highlights, offer badges, price emphasis, active icons, decorative wave accents (low opacity).

**Rules:**

- Use sparingly
- Do not dominate entire screens
- Prefer green for primary actions; orange for emphasis only

---

## 4. Background system

| Token | Hex | Purpose |
|-------|-----|---------|
| Main background | `#f6f1e7` | Global application background |
| Soft background | `#f7f4ee` | Cards, image wells, secondary panels |
| Section background | `#f4f3ed` | Feature strips, alternate sections |
| Hero section | `#f9f6ee` | Landing hero band |
| Pure warm surface | `#fffdf7` | Primary cards, important content, checkout panels |

---

## 5. Surface colors

| Token | Hex | Purpose |
|-------|-----|---------|
| Soft surface border | `#ddd8cc` | Borders, dividers, section separators |
| Modal border | `#d9cfbf` | Modals, elevated cards |
| Secondary surface | `#e2dccf` | Alternate card backgrounds, feature tiles |
| Warm elevated surface | `#ece4d7` | Premium sections, hero image frames |
| Divider | `#e7e2d8` | Inline “or” dividers, light separators |

---

## 6. Typography colors

| Token | Hex | Purpose |
|-------|-----|---------|
| Primary text | `#1f2e2a` | Main text, headings, form labels |
| Brand heading | `#183f38` | Marketing headings, card titles |
| Secondary text | `#3f4a46` | Body text, descriptions |
| Accent text green | `#244f46` | Labels, feature copy, success text |
| Muted text | `#5f5f57` | Metadata, subtext, modal body |
| Light muted | `#6f6b60` | Disabled labels, secondary metadata |
| Placeholder muted | `#9b968b` | Dividers, “or” labels |
| Location muted | `#5f6f69` | GPS / address helper text |

---

## 7. Success and status colors

| Token | Hex | Purpose |
|-------|-----|---------|
| Success background | `#eef7f4` | Secondary button hover, soft green tint |
| Success panel | `#f4fbf8` | “Delivering to” confirmation cards |
| Success border | `#cfe5df` | Success card borders |
| Success highlight | `#cde3d8` | Decorative blurs, soft accents |

Use for: successful order states, delivery confirmed, address confirmation panels.

---

## 8. Warning and offer colors

| Token | Hex | Purpose |
|-------|-----|---------|
| Offer text (on dark band) | `#f3f1de` | Headlines on dark green sections |
| Offer subtext | `#d3e2da` | Supporting copy on dark bands |
| Offer CTA surface | `#eef0d7` | Light buttons on dark sections |
| Offer CTA text | `#1f4e45` | Text on light offer buttons |

Use for: promotions, meal-plan highlights, marketing bands.

---

## 9. Dark section palette (marketing bands)

| Token | Hex | Purpose |
|-------|-----|---------|
| Band border | `#275447` | Section top/bottom border |
| Band gradient start/end | `#143f34` | Dark green section edges |
| Band gradient center | `#1a4f41` | Dark green section middle |
| Hero image overlay | `#15352f` (35% opacity) | Image readability gradient |

---

## 10. Input and border standards

| State | Value |
|-------|--------|
| Default border | `#ddd8cc` or Tailwind `border-gray-300` |
| Focus ring | Tailwind `focus:ring-orange-500` / `focus:ring-orange-100` (inputs) |
| Focus border | Tailwind `focus:border-orange-400` (phone gate) |
| Primary focus ring | `focus:ring-[#1f6f5f]/30` (interactive cards) |
| Error border / text | Tailwind `red-200`, `red-50`, `red-500`, `red-600` |

Outlined secondary actions: border `#1f6f5f`, text `#1f6f5f`, hover background `#eef7f4`.

---

## 11. Shadow standards

| Level | Value | Purpose |
|-------|--------|---------|
| Soft | `rgba(15, 23, 42, 0.06)` | Cards, inputs, small surfaces |
| Medium | `rgba(15, 23, 42, 0.08)` | Form panels |
| Card | `rgba(15, 23, 42, 0.12)` | Highlight cards |
| Elevated | `rgba(15, 23, 42, 0.18)` | Hover cards, hero frames |
| Modal | `rgba(15, 23, 42, 0.22)` | Modals, overlays |
| CTA glow | `rgba(31, 111, 95, 0.35)` | Primary button shadow on landing |
| Hero frame | `rgba(27, 66, 58, 0.18)` | Hero image container |

Avoid excessive or stacked shadows.

---

## 12. Gradient and overlay standards

### Page wash (top)

```css
linear-gradient(
  180deg,
  rgba(255, 255, 255, 0.55) 0%,
  rgba(246, 241, 231, 0.85) 35%,
  rgba(246, 241, 231, 1) 100%
);
```

### Dot pattern (sections)

```css
radial-gradient(circle at 1px 1px, rgba(31, 78, 69, 0.08) 1px, transparent 0);
/* background-size: 18px 18px or 20px 20px */
```

### Hero pattern (landing)

```css
radial-gradient(circle at 1px 1px, rgba(31, 78, 69, 0.08) 1px, transparent 0),
linear-gradient(120deg, rgba(31, 78, 69, 0.03), rgba(140, 118, 86, 0.03));
```

### Glass effect

```css
rgba(255, 255, 255, 0.55);
```

Use on: hero overlays, blurred overlays, decorative top waves (`#1f6f5f` / `#fe8c00` at 12–18% opacity).

### Modal overlay

```css
bg-black/40  /* coming soon */
bg-black/45  /* phone gate */
```

---

## 13. UI usage rules

### Primary CTA buttons

| Property | Value |
|----------|--------|
| Background | `#1f6f5f` |
| Hover | `#183f38` or `hover:brightness-105` |
| Text | `#ffffff` |
| Radius | `rounded-xl` / `rounded-full` (marketing) |

### Secondary buttons

| Property | Value |
|----------|--------|
| Background | `#f7f4ee` or transparent |
| Border | `#1f6f5f` or `#ddd8cc` |
| Text | `#1f2e2a` or `#1f6f5f` |
| Hover | `#eef7f4` |

### Cards

| Property | Value |
|----------|--------|
| Background | `#ffffff` or `#fffdf7` |
| Border | `#ddd8cc` / `#e2dccf` |
| Shadow | `rgba(15, 23, 42, 0.06)` – `0.12` |
| Radius | `rounded-2xl` |

---

## 14. Mobile UI styling rules

Mobile UI should feel: soft, touch-friendly, spacious, premium.

- Larger touch targets (`py-2.5`–`py-3` minimum on actions)
- Warm surfaces (`#f6f1e7`, `#fffdf7`)
- Rounded corners (`rounded-xl`, `rounded-2xl`)
- Generous padding (`px-4`, `p-4`–`p-6`)
- Respect safe areas: `paddingBottom: env(safe-area-inset-bottom)`

---

## 15. Cursor / AI implementation instructions

When generating UI for this platform:

- Use warm earthy colors from this document
- Prioritize readability and contrast on `#f6f1e7` backgrounds
- Maintain premium food-brand appearance
- Use soft backgrounds and subtle shadows
- Use **green** (`#1f6f5f`) as primary brand on customer flows
- Use **orange** (`#fe8c00`) only for emphasis, not full-page fills
- Keep spacing consistent (`max-w-2xl` forms, `max-w-7xl` marketing)
- Match existing pages: `TenantHome.jsx`, `AccountSetupPage.jsx`, `OrderAddressPage.jsx`

**Never:**

- Neon colors
- Pure black (`#000`) page backgrounds
- Excessive gradients
- Harsh 1px high-contrast borders everywhere
- Default bright blue link/button styles

---

## 16. Tailwind mapping (recommended)

Add to `tailwind.config.js` `theme.extend.colors` when centralizing tokens:

```js
colors: {
  brand: {
    primary: '#1f6f5f',
    primaryDark: '#183f38',
    secondary: '#2c5d54',
    accent: '#fe8c00',
  },
  surface: {
    background: '#f6f1e7',
    soft: '#f7f4ee',
    card: '#fffdf7',
    elevated: '#ece4d7',
  },
  border: {
    DEFAULT: '#ddd8cc',
    soft: '#d9cfbf',
    secondary: '#e2dccf',
  },
  text: {
    primary: '#1f2e2a',
    heading: '#183f38',
    secondary: '#3f4a46',
    muted: '#5f5f57',
    lightMuted: '#6f6b60',
  },
}
```

Until tokens exist in Tailwind, use arbitrary values: `bg-[#1f6f5f]`, `text-[#183f38]`, etc. (as in current pages).

---

## 17. Company: Jay's Kerala Kitchen (`jkkfds`)

This section applies to the **default production tenant**.

| Item | Value |
|------|--------|
| URL path | `jkkfds` (see `VITE_DEFAULT_COMPANY_PATH`, `Client/src/utils/companyPaths.js`) |
| Theme config key | `jkfds` (see `Client/src/config/tenantThemes.js`) |
| Terms key alias | `jkkfds` → `jkfds` (see `Client/src/config/tenantTerms.js`) |
| Brand name | Jay's Kerala Kitchen |
| Tagline context | Healthy Food Hub / Kerala cuisine meal service |

### 17.1 Customer-facing UI (current standard)

Protected and onboarding flows use the **green + warm cream** palette in sections 2–13 above. Reference implementations:

- `Client/src/pages/TenantHome.jsx` — landing, dark marketing band, hero
- `Client/src/pages/AccountSetupPage.jsx` — setup, phone gate, modals
- `Client/src/pages/OrderAddressPage.jsx` — delivery address, GPS panel

### 17.2 Legacy / theme config accents (`tenantThemes.jkfds`)

`tenantThemes.js` still defines orange-forward tokens for navbar, auth slider tabs, and older marketing home:

| Token | Hex | Usage |
|-------|-----|--------|
| `primaryColor` | `#FE8C00` | Theme primary (auth, legacy CTAs) |
| `accentColor` | `#FE8C00` | Links, accents when `theme.accentColor` is read |
| `brandDisplayColor` | `#F58220` | Navbar brand display text |
| `navBg` | `bg-[#989494]/50` | Navbar background class |
| `homeGradient` | `from-orange-50 via-white to-orange-50` | Legacy home gradients |

**Guidance for new `jkkfds` screens:**

1. **Prefer** section 2–13 greens and creams for new customer UI (aligned with `TenantHome` / `OrderAddressPage`).
2. **Use** `#fe8c00` / theme `accentColor` only for links, badges, and decorative accents—not as the main CTA fill when a green CTA is on the same flow.
3. **Resolve accent in code:** `theme.accentColor || theme.primaryColor || '#FE8C00'` (see `AccountSetupPage.jsx`) for terms links and small highlights.

### 17.3 Typography (jkkfds brand)

| Token | Value |
|-------|--------|
| Display font | `font-jkfdsBrand` → Nunito (`tailwind.config.js`) |
| Weight | `font-extrabold` / `font-black` for headlines |
| Brand text shadow (legacy banner) | `2px 2px 5px rgba(0, 0, 0, 0.55)` on orange display type |

### 17.4 jkkfds quick reference

```js
// Production customer UI (preferred)
primary: '#1f6f5f',
primaryDark: '#183f38',
background: '#f6f1e7',
surface: '#fffdf7',
textPrimary: '#1f2e2a',
accentEmphasis: '#fe8c00',

// tenantThemes.jkfds (legacy / auth / nav)
themePrimary: '#FE8C00',
brandDisplay: '#F58220',
```

---

## 18. Other tenants (reference only)

Do not apply this document wholesale to other companies:

| Path | Brand | Primary UI |
|------|--------|------------|
| `jlg` | Jay's Leafy Greens | Emerald greens (`#059669`, `#065f46`) |
| `ml` | MaXHub Logistics | Orange/dark logistics theme |

Add separate appendix docs if those brands need formal standards.

---

## 19. Final design goal

The application should visually feel like:

- A premium cloud kitchen
- A healthy meal subscription service
- A modern Kerala-inspired food platform
- Warm and trustworthy
- Simple and elegant

Balance **modern SaaS cleanliness** with **warm food-oriented aesthetics**.

---

## 20. Related files

| File | Role |
|------|------|
| `Client/src/config/tenantThemes.js` | Per-company theme overrides |
| `Client/src/config/tenantTerms.js` | Per-company legal copy |
| `Client/src/utils/companyPaths.js` | Default `jkkfds` path |
| `Client/tailwind.config.js` | Fonts (`jkfdsBrand`) and future color tokens |
| `Client/src/pages/TenantHome.jsx` | Landing color reference |
| `Client/src/pages/AccountSetupPage.jsx` | Onboarding color reference |
| `Client/src/pages/OrderAddressPage.jsx` | Address flow color reference |
