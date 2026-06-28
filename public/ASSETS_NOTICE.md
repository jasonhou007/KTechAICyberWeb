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
- (pre-existing placeholders) `ai-fintech.webp`, `blockchain-finance.webp`,
  `fintech-conference.webp`, `iso-certification.webp`

## Assets deliberately SKIPPED (trademarked / branded)

The following source assets bear the KTech / KASIKORN wordmark, the company
logo, or are marked `alt="logo"` / `alt="KTech"` and are therefore trademarked
or branded. They were intentionally NOT extracted to avoid trademark misuse:

- `n-img11.svg`, `n-img13.svg`, `n-img14.png`, `n-img20.jpg` (news imagery
  embedding the brand wordmark)
- `arrow99.svg` (branded decorative arrow)
- `about1-5.svg` (about-section icons embedding the wordmark — tracked
  separately in follow-up Issue #198, which will commission original icons)
- the site logo (the official KTech trademark — out of scope for demo reuse)

## News-list images caveat

The official news listing page renders its card images client-side via
JavaScript, so they could not be bulk-extracted by simple asset harvesting.
Only one official news content image (`news-iso27001-official.webp`) was
available as a static asset; the remaining news cards continue to use the
pre-existing `public/images/news/*.webp` placeholders. Replacing those
placeholders is out of scope for this ticket.

## Related follow-up issues

- **#198** — commission original About section icons to replace the current
  emoji icons (the trademarked `about1-5.svg` icons are NOT used).
- **#199** — generate `srcset` responsive image variants for the About/News
  images (this ticket ships a single `webp`/`png` per slot).
