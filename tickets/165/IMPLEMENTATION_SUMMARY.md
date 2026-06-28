# Issue #165 — [ASSETS] Extract and Implement About & News Section Images

**Branch:** `autodev-165-assets`
**Iteration:** 18 (STALLED-AND-RESUMED — see "Stall/Resume" section)
**Status:** Done (pending merge + archive)

## What shipped

A reusable `CyberImage` component that presents the official-site imagery
extracted for AC #165 with a cyberpunk treatment (neon border/glow, local
scanline overlay, grayscale→color hover decode, `prefers-reduced-motion`-guarded
glitch keyframe), wired into the About view (hero, who-we-are feature, culture
image, 11-item awards strip) and the News section (NewsCard list image +
NewsDetail featured image). All public-asset image srcs are rebased against the
Vite `base` subpath so they render correctly under GitHub Pages.

## Commits (this branch, vs `main`)

1. `4018998` — `#165 Extract About/News images from official site + ASSETS_NOTICE`
2. `0d8a467` — `#165 Add CyberImage component with cyberpunk effects (TDD)`
3. `e4f86a7` — `#165 Add localized alt text for About/News images (i18n en+zh)`
4. `186a590` — `#165 Wire CyberImage into About view (hero, feature, awards)`
5. `8557d60` — `#165 Wire CyberImage into News card + detail`
6. (this commit) — `#165 Base-path image resolution + E2E live-DOM spec + evidence`

Commit 6 was the work-in-progress when the previous run stalled against an API
rate limit; this resume finished it (base-path resolution + tests + E2E spec +
evidence + this summary).

## Files changed (full set on the branch)

- `public/ASSETS_NOTICE.md` — demo-assets notice + extraction/skip manifest
- `public/images/about/*.webp` (2), `public/images/about/*.png` (12 incl. culture-icon)
- `public/images/news/news-iso27001-official.webp`
- `src/components/CyberImage.vue` — cyberpunk image wrapper + base-path resolver
- `src/components/__tests__/CyberImage.test.ts` — unit + visual-AC + base-path tests
- `src/views/About.vue` — hero / who-we-are / culture / awards wiring
- `src/components/NewsCard.vue` — list-card image wiring
- `src/views/NewsDetail.vue` — featured-image wiring
- `src/locales/{en,zh}.json` — localized `alt` keys (about.* + news.articleAlts.*)
- `src/data/news.json` — `altKey` on each article
- `tests/e2e/165-about-news-images.spec.ts` — shipped-app live-DOM spec
- `scripts/165-screenshot.mjs` — one-off before/after screenshot harvester
- `tickets/165/evidence/{before,after}-{about,news}.png` + `build-size-{before,after}.txt`
- `tickets/165/{IMPLEMENTATION_SUMMARY,REVIEW}.md`

## Responsible-asset handling

- **Extracted (used):** 16 official images from kaitai.tech — About hero
  (`about-who-we-are.webp`), regional fintech (`about-regional-fintech.webp`),
  culture icon, and 11 award/certificate PNGs; plus 1 official News content
  image (`news-iso27001-official.webp`). All HTTP 200 at harvest time.
- **Deliberately SKIPPED (trademarked/branded):** site logo, `n-img11.svg`,
  `n-img13.svg`, `n-img14.png`, `n-img20.jpg` (news imagery embedding the brand
  wordmark), `arrow99.svg` (branded decorative), `about1-5.svg` (icons embedding
  the wordmark — current About uses emoji icons, NOT these). Each skip is
  documented in `public/ASSETS_NOTICE.md`.
- **News-list card images caveat:** the official news listing renders card
  images client-side via JS and could not be bulk-harvested; only one official
  news content image was available as a static asset. Remaining news cards keep
  the pre-existing `public/images/news/*.webp` placeholders.
- **Follow-up issues filed:** #198 (commission original About icons to replace
  emoji), #199 (generate `srcset` responsive variants).

## Gates (all re-derived 2026-06-28 on the resumed branch — NOT trusted from the stall)

| Gate | Result |
|---|---|
| `node_modules/.bin/vitest run` | **2044/2044 pass** (65 files) |
| Coverage (Lines) | **96.23%** overall (2157/2265 stmts, 2069/2150 lines); `CyberImage.vue` 100% lines / 87.5% branch |
| `node_modules/.bin/vite build` | **green**; entry chunk 117.47→119.22 kB (+1.75 kB raw, +0.71 kB gzip); About chunk 6.23→8.70 kB; CyberImage lazy chunk 0.61 kB. No bundle bloat — images are in `public/` (served, not bundled). |
| Shipped-app (live DOM) | **7/7 Playwright E2E green** — hero, who-we-are, culture, awards (≥3), NewsCard, NewsDetail featured image all render with `naturalWidth > 0` + non-empty `alt` under base subpath `/KTechAICyberWeb/`, on desktop AND mobile viewports. |
| Visual-AC | CSS-source assertions (active CSS, comments-stripped) for neon `box-shadow`, `@keyframes cyber-glitch`, `prefers-reduced-motion` guard, grayscale→color transition, local scanline overlay — PLUS red-test proofs (strip the rule → check flips false) for both neon and glitch keyframe. |
| i18n parity | **880/880 leaves equal** en/zh (`scripts/check-i18n-keys.mjs`); localized `alt` in both locales. |
| No runtime `fetch('/src/...')` | confirmed (grep clean) |
| Security SEC001 | **0 matches** for `(password\|api_key\|secret\|private_key)\s*[:=]\s*['\"]\w+` in diff; no `v-html` in touched files. |
| Dead-reactive-state | none — `resolvedSrc` computed is consumed in template `<img :src="resolvedSrc">`; no orphan refs. |

### Shipped-app test names (live-DOM proof)

`tests/e2e/165-about-news-images.spec.ts`:
- desktop: `About hero image renders with non-zero naturalWidth and non-empty alt`
- desktop: `About awards-strip renders multiple award CyberImages`
- desktop: `About who-we-are feature image and culture image render`
- desktop: `News card images render inside CyberImage figures`
- desktop: `News detail featured image renders inside CyberImage figure`
- mobile: `About hero and awards render on mobile`
- mobile: `News card image renders on mobile`

### Visual-AC test names (CSS-source + red-test)

`src/components/__tests__/CyberImage.test.ts` — `Cyberpunk styling` block:
- `declares a neon box-shadow on .cyber-image`
- `declares an @keyframes cyber-glitch animation`
- `declares a prefers-reduced-motion guard that disables the animation`
- `declares a grayscale->color hover transition on the img`
- `declares a local scanline overlay clipped to the figure`
- `RED-TEST PROOF: neon check returns false when box-shadow is stripped`
- `RED-TEST PROOF: glitch-keyframe check returns false when keyframe is stripped`

## Bundle size (before → after)

| Chunk | Before (main) | After (branch) |
|---|---|---|
| entry `index-*.js` | 117.47 kB (gzip 50.67) | 119.22 kB (gzip 51.39) |
| `About-*.js` | 6.23 kB (gzip 1.65) | 8.70 kB (gzip 2.07) |
| `CyberImage-*.js` (new, lazy) | — | 0.61 kB (gzip 0.40) |
| `CyberImage-*.css` (new) | — | 1.52 kB (gzip 0.57) |

Image assets are in `public/` (served as static files, not in the JS bundle).

## Stall/Resume note (honest record for the training log)

The previous run completed commits 1–5 then stalled mid-commit-6 when the API
hit a 5-hour rate limit. The resume (a) re-derived every gate from scratch
rather than trusting the partial state, (b) finished the genuinely-valuable
base-path resolution that was the heart of commit-6 (without it, every
`/images/...` src would 404 under the `/KTechAICyberWeb/` subpath in
production — the iter-17 silent-E2E failure mode), and (c) committed the E2E
spec + evidence + summaries. No half-applied state survived: vitest 2044/2044,
build green, E2E 7/7 all re-run on the final tree.
