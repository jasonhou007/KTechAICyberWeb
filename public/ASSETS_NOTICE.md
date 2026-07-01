# Demo Assets Notice

The images under `public/images/about/` and `public/images/news/` are **demo
assets** sourced from the official KTech (Kaitai Vision Information Technology)
website (https://www.kaitai.tech). They are included solely so the demo site
renders representative imagery for the About and News sections.

## Replacement requirement

These assets MUST be replaced with properly-licensed assets before any
non-demo use (production deployment, commercial redistribution, public
marketing, etc.). The demo images are not licensed for redistribution beyond
this development preview.

## Assets extracted (used)

### About (`public/images/about/`)

- `about-who-we-are.webp` — hero photo (800x480)
- `about-regional-fintech.webp` — regional fintech illustration (800x480)
- `culture-icon.png` — culture section icon (60x60)
- `award-aaa-credit.png` — AAA Credit Enterprise certificate
- `award-mnc-hq-2020.png` — MNC Regional Headquarters (Shenzhen) certificate
- `award-national-excellent-2020.png` — National Excellent Enterprise award
- `award-national-excellent-2021.png` — National Excellent Enterprise 2021-2022
- `award-iso9001-quality.png` — ISO 9001 Quality Management certificate
- `award-iso20000-itservice.png` — ISO 20000 IT Service Management certificate
- `award-iso27001-infosec.png` — ISO 27001 Information Security certificate
- `award-shenzhen-fintech-member.png` — Shenzhen FinTech Association member
- `award-guangdong-fintech-member.png` — Guangdong FinTech Association member
- `award-national-hightech.png` — National High-tech Enterprise certificate
- `award-shenzhen-innovative-sme.png` — Shenzhen Innovative SME certificate
- `award-shenzhen-specialized-sme.png` — Shenzhen Specialized SME certificate

### News (`public/images/news/`)

- `news-iso27001-official.webp` — official ISO 27001 news content image (258x258)
- (original cyberpunk vector illustrations, served at vector fidelity #278)
  `ai-fintech.svg`, `blockchain-finance.svg`, `fintech-conference.svg`,
  `iso-certification.svg` — purpose-built SVGs (gradients, grids, neon strokes,
  `<text>` labels) that were previously mislabeled `.webp`; renamed to their
  true vector format so the browser renders them as scalable SVGs.

## Assets deliberately SKIPPED (trademarked / branded)

The following source assets bear the KTech / KASIKORN wordmark, the company
logo, or are marked `alt="logo"` / `alt="KTech"` and are therefore trademarked
or branded. They were intentionally NOT extracted to avoid trademark misuse:

- `n-img11.svg`, `n-img13.svg`, `n-img14.png`, `n-img20.jpg` (news imagery
  embedding the brand wordmark)
- `arrow99.svg` (branded decorative arrow)
- `about1-5.svg` (about-section icons embedding the wordmark — tracked
  separately in follow-up Issue #198, now RESOLVED: original cyber icons
  commissioned instead, see "Original About icons" below)
- the site logo (the official KTech trademark — out of scope for demo reuse)

## News-list images caveat

The official news listing page renders its card images client-side via
JavaScript, so they could not be bulk-extracted by simple asset harvesting.
Only one official news content image (`news-iso27001-official.webp`, 258x258)
was available as a real raster; the remaining news cards use purpose-built
cyberpunk vector illustrations (gradients, grids, neon strokes, `<text>`
labels) that were originally shipped mislabeled as `.webp`. Issue #278 renamed
those 4 files to their true vector format (`.svg`) so the browser serves them
at vector fidelity instead of treating them as broken/unknown bitmaps.
`news-iso27001-official.webp` is now the only News bitmap.

## Original About icons (`src/components/icons/AboutIcon.vue`)

Issue #198 took the BRANDED branch for the trademarked `about1-5.svg`: rather
than integrate the official icons (which embed the KASIKORN/KTech wordmark and
are therefore not safe to redistribute), #198 ships **5 ORIGINAL royalty-free
cyberpunk inline-SVG icons** rendered by a single Vue component,
`src/components/icons/AboutIcon.vue`.

Attestation — the 5 motifs are original geometric line-art and are NOT derived
from the trademarked `about1-5.svg`:

- **NO wordmarks or logos.** The component source and rendered DOM contain
  zero KASIKORN / KBank / KTech text, zero embedded `<text>` elements, and no
  reproduction of the official logo likeness. (Enforced by `AboutIcon.test.ts`
  IP-gate assertions.)
- **NO reproduction of official path data.** The motifs are hand-authored
  primitives (`<polyline>`, `<rect>`, `<circle>`, `<ellipse>`, `<line>`) on a
  fresh `0 0 64 64` viewBox. No path data from `about1-5.svg` was copied,
  traced, or referenced.
- **NO map landmasses, currency symbols, or rocket likeness.** The 5 motifs
  are abstract geometric representations: a stacked-floors building, a
  wireframe globe (circle + ellipses), a coin stack, a calendar wireframe,
  and an upward trajectory line.

The 5 icons are wired into the **Who We Are** section of `About.vue`
(company, parentRegion, capital, established, services), replacing the prior
emoji placeholders. The remaining About emoji (Vision/Mission/Culture/
Achievements) are NOT part of the `about1-5.svg` slot and are tracked in a
separate follow-up.

## Related follow-up issues

- **#198** (RESOLVED) — commissioned original About section icons to replace
  the trademarked `about1-5.svg`; the 5 original inline-SVGs now ship in
  `AboutIcon.vue` for the Who We Are cards.
- **#199** — generate `srcset` responsive image variants for the About/News
  images (this ticket ships a single `webp`/`png` per slot).

## Generated SEO/favicon assets (#263)

The following files under `public/` were missing before #263 (deployed 404 +
absent from the repo), causing blank social previews and blank browser tabs.
#263 generates them from a single inline-SVG source via
`scripts/generate-seo-assets.mjs` (Playwright Chromium rasterizes the SVG at
each target viewport; no external image deps):

- `og-image.jpg` (1200×630 JPEG) — OpenGraph preview
- `twitter-image.jpg` (1200×630 JPEG) — Twitter card preview
- `apple-touch-icon.png` (180×180 PNG) — iOS home-screen icon
- `icon-192.png` / `icon-512.png` (PNG) — PWA manifest icons
- `logo.png` (512×512 PNG) — JSON-LD Organization logo
- `favicon.svg` (SVG) — canonical vector source
- `favicon.ico` (multi-size ICO: 16/32/48 PNG-in-ICO) — browser tab/bookmark

### Regen command

```bash
node scripts/generate-seo-assets.mjs
```

Idempotent — re-running overwrites the same files (deterministic output).

### IP attestation — original cyber primitives only

This generator mirrors the #198 `AboutIcon.vue` IP-clean approach. The motif
set is **original geometric primitives** (`rect` / `circle` / `line` /
`polyline` / `path`) on a `#0a0a0a` background with the project cyan
`#00ffcc`:

- **NO third-party bank wordmark or official logo path data.** The generator
  source contains no reproduction of any external trademarked mark or logo
  path data. (The IP-gate unit test `tests/unit/seo-assets.spec.js` Group C
  asserts the source excludes the forbidden tokens.)
- The `"KTech"` string rendered in the SVG is the project's own abbreviated
  name (matching `manifest.json` `short_name`), NOT any external trademark.
- The motifs are: corner brackets, concentric rings, circuit nodes around the
  ring, an original K monogram constructed from `<line>` + `<polyline>`, a
  scanline, and a background circuit grid. None are derived from any
  third-party logo or path data.

### Base-path fix (#263)

The `index.html` favicon `<link href>` values, the `App.vue` `useHead` favicon
link, and the `manifest.json` `icons[].src` values were changed from a
leading-slash form (`/favicon.ico`) to a relative form (`favicon.ico`). Under
the Vite base subpath `/KTechAICyberWeb/`, a leading slash resolves against
the origin root (origin/favicon.ico → 404 on GitHub Pages), while a relative
href resolves against the document URL and serves correctly. The absolute
`og:image` / `twitter:image` / JSON-LD `logo` URLs in `index.html` are
intentionally left absolute (correct for OG scrapers).

## Related follow-up issues (additional)

- **#301** — per-route `og:image` URLs in `src/utils/seo.js` still point at
  the (now-existing) site-level assets; deferred from #263 (the per-route
  og-image story is tracked there).

