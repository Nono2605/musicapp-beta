# BRAND — Landing Page

Public marketing landing page for **BRAND**. This is a completely
independent static website — it contains **no** application framework,
backend, database, or authentication. It exists purely to introduce the
product and hand off to the real application at `app.BRAND.com`.

## Architecture

```
www.BRAND.com            →  this static landing page
app.BRAND.com            →  future music streaming application (separate project)
```

The landing page never implements the application itself. All "Start
listening", "Log in", and "Join as a creator" actions link out to the
application via placeholder URLs defined centrally in
[`js/brand.js`](js/brand.js):

- `https://app.BRAND.com`
- `https://app.BRAND.com/login`
- `https://app.BRAND.com/signup`
- `https://app.BRAND.com/creator`

## Tech stack

- HTML5 (semantic markup)
- CSS3 (custom properties / design tokens, no preprocessor, no framework)
- Vanilla JavaScript (no build step, no dependencies)

No React, Vue, Angular, Next.js, or any other framework is used.

## Project structure

```
/
├── index.html
├── css/
│   └── style.css       # design tokens, typography, layout, components
├── js/
│   ├── brand.js         # central brand configuration (single source of truth)
│   └── main.js          # brand injection, nav skeleton, footer year
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
└── README.md
```

## Brand system

All brand-facing text and URLs come from a single configuration object
in [`js/brand.js`](js/brand.js):

```js
const BRAND = {
    name: "BRAND",
    shortName: "BRAND",
    tagline: "Your music. Your artists. Your impact.",
    description: "A music platform connecting listeners and creators through transparent, user-centric royalties.",
    appUrl: "https://app.BRAND.com",
    loginUrl: "https://app.BRAND.com/login",
    signupUrl: "https://app.BRAND.com/signup",
    creatorUrl: "https://app.BRAND.com/creator"
};
```

To rebrand the entire site, change the values in this object only —
**never hardcode the brand name elsewhere in HTML, CSS, or JS.**

[`js/main.js`](js/main.js) applies these values to the DOM at page load
using two data attributes:

- `data-brand="<key>"` — replaces the element's text content with `BRAND[key]`
- `data-brand-href="<key>"` — sets the element's `href` attribute to `BRAND[key]`

Example:

```html
<a class="btn btn--primary" data-brand-href="appUrl" href="https://app.BRAND.com">Start listening</a>
```

## Design system

Design tokens (colors, gradient, typography, spacing, radii) are defined
as CSS custom properties in `:root` at the top of
[`css/style.css`](css/style.css).

| Token | Value |
| --- | --- |
| `--color-bg` | `#05070D` |
| `--color-bg-secondary` | `#071A33` |
| `--color-card` | `#0D111A` |
| `--color-blue` | `#1683FF` |
| `--color-blue-bright` | `#38A7FF` |
| `--color-violet` | `#7047FF` |
| `--color-violet-soft` | `#9B7BFF` |
| `--color-text` | `#F7F9FC` |
| `--color-text-muted` | `#9AA4B2` |

Signature gradient (used selectively, e.g. primary buttons, highlighted text):

```css
linear-gradient(135deg, #1683FF 0%, #7047FF 100%)
```

**Typography:** headings use `Space Grotesk`, body copy uses `Inter`
(both loaded from Google Fonts in `index.html`).

**Layout:** max content width `1280px`, responsive from `320px` upward.

## Current scope

This pass establishes only the foundation:

1. HTML structure
2. Global CSS
3. Typography
4. CSS custom properties (design tokens)
5. Responsive breakpoints
6. Reusable buttons (`.btn`, `.btn--primary`, `.btn--secondary`, `.btn--ghost`)
7. Reusable cards (`.card`)
8. `js/brand.js`
9. `js/main.js`
10. Navigation skeleton
11. Footer skeleton

Full landing page sections (hero, features, pricing, testimonials, etc.)
are intentionally **not** built yet — they will be added in a later pass
on top of this foundation.

## Local development

No build step is required. Serve the directory with any static file
server, for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
