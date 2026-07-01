# COLOR_ROLE_MAP.md — Issue #286 Secondary-Text Role-Token Uniformity Pass

This document is the **role→token map** for the secondary/tertiary text tier
across all 20 views. It is the deliverable for AC#2 of #286 and the source of
truth for the 110 token swaps in AC#3.

## Background

#252 made the **prominent** tier (primary headings, badges, form labels, brand
accents) route through canonical tokens and fixed the clear WCAG AA failures.
The **secondary/tertiary** tier still drifted: the same semantic role (e.g.
"card meta") used `var(--text-secondary)` on some pages and `var(--text-muted)`
on others. #286 closes that gap by introducing five **per-role** tokens so each
role resolves to ONE token on every page.

## The five role tokens (added in `src/assets/styles/variables.css`)

| token | hex | derives from | role | WCAG vs `#0a0a0a` |
|-------|-----|--------------|------|-------------------|
| `--text-section-subtitle` | `#b0b0b0` | `--text-secondary` | hero / section / overview subtitle | 9.13:1 |
| `--text-card-meta` | `#b0b0b0` | `--text-secondary` | card / section body copy (prose) | 9.13:1 |
| `--text-list-label` | `#8a9acc` | `--text-muted` | stat / step / filter / group label | 7.14:1 |
| `--text-caption` | `#9aa0b0` | (new blue-gray hue) | caption / helper / empty-state / breadcrumb / cta-line / short-bullet | 7.57:1 |
| `--text-timestamp` | `#8a9acc` | `--text-muted` | date / time / meta / related-date | 7.14:1 |

All five pass WCAG AA (≥ 4.5:1) against `--bg-primary #0a0a0a` AND the worst-case
gradient end `#16213e` (≥ 5.7:1). The two `#b0b0b0` tokens stay distinct so a
future redesign of subtitles vs card body can diverge without re-auditing.

## Classification rules (selector-keyword based)

A site's role is decided by its **selector** (keyword + descendant parent):

| role | selector signals |
|------|------------------|
| `section-subtitle` | `*-subtitle`, `.page-subtitle`, `.hero-subtitle`, `.section-description`, `*-overview-text`, `*__not-found-text`, `.message` |
| `card-meta` | `*__card-description`, `*-card p`, `.content-block p`, `.item-list li`, `.service-features li`, `.disclaimer`, `.position-card__description`, `.position-modal__section p` |
| `list-label` | `*stat-label`, `*filter*`, `.checkbox-label`, `.social-label`, `.group-label`, `*label` |
| `caption` | `*caption`, `*helper`, `*empty-message`, `*breadcrumb*`, `*separator`, `.demo-description`, `*cta-description`, `.cta p`, `.cta-content p`, `.note`, `:deep(blockquote)`, `::placeholder`, `.benefit-item span`, `.position-modal__list li` |
| `timestamp` | `*date`, `*time`, `*timestamp`, `*__meta`, `.page-meta`, `*__meta-item`, `*related-date` |

### Reasoning notes (ambiguous selections)

- **`.cta-card p` → `card-meta`** (not `caption`): in `ServiceProjectManagement.vue` it is a multi-sentence prose paragraph, same tier as other `*-card p` body copy. The single-line CTA supporting text (`.cta p`, `.cta-content p`, `*cta-description`) is `caption`.
- **`.disclaimer` → `card-meta`** (not `caption`): legal body copy is multi-sentence prose, same tier as `.content-block p`.
- **`.benefit-item span` → `caption`**: short supporting text, not a prose paragraph (the prose sibling `.benefit-item p` is `card-meta`).
- **`.position-modal__list li` → `caption`**: short qualification bullets, distinct from the prose `.position-modal__section p` (`card-meta`).
- **`.filter-active` → `list-label`**: the active-filter chip is a label-tier element, same family as the `.filter-* label` siblings.
- **`.position-card__meta-item` / `.position-modal__meta` → `timestamp`**: meta/location rows in a job card are the same role as a news `__meta`/`__date`.
- **`.breadcrumb` / `.breadcrumb .separator` → `caption`**: breadcrumb text is caption-tier inline navigation. (The `rgba(0,255,204,0.5)` *decorative* `*-breadcrumb-separator` rules that pre-exist the WCAG 4.31:1 FAILs are NOT in this matrix — they are cyan brand accents, not secondary text, and are out of #286 scope.)

## Per-view drift matrix (110 sites)

Each row is `file : line : selector : current-token → target-token : role`.
Counts: **section-subtitle 27 · card-meta 38 · list-label 8 · caption 30 · timestamp 7**.

### About.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L440 | `.page-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L483 | `.content-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L594 | `.achievement-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L634 | `.vmc-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L702 | `.service-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L739 | `.stat-label` | `var(--text-muted)` | `var(--text-list-label)` | list-label |

### Blockchain.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L174 | `.breadcrumb` | `var(--text-muted)` | `var(--text-caption)` | caption |
| L188 | `.breadcrumb .separator` | `var(--text-muted)` | `var(--text-caption)` | caption |
| L212 | `.page-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L243 | `.overview-text` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L277 | `.overview-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L346 | `.feature-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L400 | `.benefit-item p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L432 | `.cta p` | `var(--text-secondary)` | `var(--text-caption)` | caption |

### Contact.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L536 | `.page-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L544 | `.breadcrumb` | `var(--text-muted)` | `var(--text-caption)` | caption |
| L618 | `.form-input::placeholder` | `var(--text-muted)` | `var(--text-caption)` | caption |
| L664 | `.checkbox-label` | `var(--text-muted)` | `var(--text-list-label)` | list-label |
| L779 | `.info-item p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L803 | `.social-label` | `var(--text-muted)` | `var(--text-list-label)` | list-label |
| L834 | `.demo-description` | `var(--text-secondary)` | `var(--text-caption)` | caption |

### Home.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L421 | `.hero .cyber-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L488 | `.solution-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |

### JoinUs.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L189 | `.subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L241 | `.section-description` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L277 | `.culture-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L309 | `.benefit-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L371 | `.process-step p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |

### MobileApp.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L176 | `.breadcrumb` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L250 | `.hero-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L288 | `.section-description` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L333 | `.overview-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L376 | `.feature-content p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L416 | `.benefit-item span` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L439 | `.cta-content p` | `var(--text-secondary)` | `var(--text-caption)` | caption |

### News.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L97 | `.news-page__breadcrumb-link` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L153 | `.news-page__subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |

### NewsDetail.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L345 | `.news-detail__breadcrumb-link` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L469 | `.news-detail__not-found-text` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L541 | `.news-detail__meta` | `var(--text-secondary)` | `var(--text-timestamp)` | timestamp |
| L545 | `.news-detail__date` | `var(--text-secondary)` | `var(--text-timestamp)` | timestamp |
| L583 | `.news-detail__caption` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L654 | `.news-detail__markdown :deep(blockquote)` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L814 | `.news-detail__related-date` | `var(--text-secondary)` | `var(--text-timestamp)` | timestamp |

### NotFound.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L77 | `.message` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |

### PositionList.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L381 | `.breadcrumb-separator` | `var(--text-muted)` | `var(--text-caption)` | caption |
| L449 | `.filter-search label` | `var(--text-muted)` | `var(--text-list-label)` | list-label |
| L477 | `.filter-group label` | `var(--text-muted)` | `var(--text-list-label)` | list-label |
| L505 | `.filter-active` | `var(--text-muted)` | `var(--text-list-label)` | list-label |
| L571 | `.position-card__meta-item` | `var(--text-muted)` | `var(--text-timestamp)` | timestamp |
| L582 | `.position-card__description` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L650 | `.empty-message` | `var(--text-muted)` | `var(--text-caption)` | caption |
| L741 | `.position-modal__meta` | `var(--text-muted)` | `var(--text-timestamp)` | timestamp |
| L761 | `.position-modal__section p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L776 | `.position-modal__list li` | `var(--text-secondary)` | `var(--text-caption)` | caption |

### PrivacyPolicy.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L160 | `.page-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L166 | `.page-meta` | `var(--text-secondary)` | `var(--text-timestamp)` | timestamp |
| L178 | `.disclaimer` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L198 | `.content-block p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L209 | `.item-list li` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L224 | `.note` | `var(--text-secondary)` | `var(--text-caption)` | caption |

### ServiceBigData.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L467 | `.bd__breadcrumb-link` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L536 | `.bd__hero-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L603 | `.bd__overview-text` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L665 | `.bd__card-description` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L696 | `.bd__stat-label` | `var(--text-secondary)` | `var(--text-list-label)` | list-label |
| L757 | `.bd__step-description` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L781 | `.bd__cta-description` | `var(--text-secondary)` | `var(--text-caption)` | caption |

### ServiceCrossBorderPayment.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L340 | `.cbp__breadcrumb-link` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L404 | `.cbp__hero-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L469 | `.cbp__overview-text` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L530 | `.cbp__card-description` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L552 | `.cbp__cta-description` | `var(--text-secondary)` | `var(--text-caption)` | caption |

### ServiceDigitalAssetCustody.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L330 | `.dac__breadcrumb-link` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L394 | `.dac__hero-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L459 | `.dac__overview-text` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L520 | `.dac__card-description` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L542 | `.dac__cta-description` | `var(--text-secondary)` | `var(--text-caption)` | caption |

### ServiceProjectManagement.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L236 | `.hero-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L268 | `.overview-text` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L312 | `.capability-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L361 | `.step-content p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L417 | `.cta-card p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |

### ServiceRetailLending.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L456 | `.rl__breadcrumb-link` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L525 | `.rl__hero-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L592 | `.rl__overview-text` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L654 | `.rl__card-description` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L685 | `.rl__stat-label` | `var(--text-secondary)` | `var(--text-list-label)` | list-label |
| L746 | `.rl__step-description` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L770 | `.rl__cta-description` | `var(--text-secondary)` | `var(--text-caption)` | caption |

### ServiceStablecoin.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L330 | `.sc__breadcrumb-link` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L394 | `.sc__hero-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L459 | `.sc__overview-text` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L520 | `.sc__card-description` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L542 | `.sc__cta-description` | `var(--text-secondary)` | `var(--text-caption)` | caption |

### Services.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L366 | `.service-features li` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L374 | `.service-card:hover .service-features li` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |

### SupplyChainFinance.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L304 | `.scf__breadcrumb-link` | `var(--text-secondary)` | `var(--text-caption)` | caption |
| L373 | `.scf__hero-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L440 | `.scf__overview-text` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L506 | `.scf__feature-description` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L552 | `.scf__benefit-description` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L611 | `.scf__step-description` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L635 | `.scf__cta-description` | `var(--text-secondary)` | `var(--text-caption)` | caption |

### Terms.vue

| line | selector | current | target | role |
|------|----------|---------|--------|------|
| L161 | `.page-subtitle` | `var(--text-secondary)` | `var(--text-section-subtitle)` | section-subtitle |
| L167 | `.page-meta` | `var(--text-secondary)` | `var(--text-timestamp)` | timestamp |
| L179 | `.disclaimer` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L199 | `.content-block p` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L210 | `.item-list li` | `var(--text-secondary)` | `var(--text-card-meta)` | card-meta |
| L225 | `.note` | `var(--text-secondary)` | `var(--text-caption)` | caption |

