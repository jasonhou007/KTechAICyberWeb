# #225 — Desktop Lighthouse a11y on Home: fix the 2 failing audits (98 → 100)

## Scope

Issue #225 asks to capture the **desktop** Lighthouse a11y score for Home (the
issue title's "mobile" framing was a dispatcher mix-up — #190 already shipped
mobile Home = 100; this ticket is the desktop-completeness follow-up). The
pre-fix baseline captured under #226 (`tickets/226/evidence/lighthouse-desktop-home.report.json`)
scored **98** with exactly two failing audits. This ticket fixes both and
recaptures a **fresh** artifact under `tickets/225/`.

- Form factor: **desktop** (`--preset=desktop` → `configSettings.formFactor === "desktop"`).
- Build: production `vite build` served via `vite preview --port 4173 --strictPort`
  at the `/KTechAICyberWeb/` subpath (vite.config `base`).
- Lighthouse binary: project-local `node_modules/.bin/lighthouse`.

## Pre-fix baseline (re-derived from `tickets/226/evidence/lighthouse-desktop-home.report.json`)

| field | value |
|---|---|
| `configSettings.formFactor` | `desktop` |
| `categories.accessibility.score` | `0.98` → **98** |
| failing audit 1 | `aria-allowed-role` (w=1, "ARIA roles on incompatible elements") |
| failing audit 2 | `heading-order` (w=3, "Heading elements are not in a sequentially-descending order") |

## The two fixes

### Fix 1 — `aria-allowed-role` → `src/components/selfdriving/PipelineCard.vue` (~line 33)

The card root was `<article ... role="listitem">`. `<article>`'s implicit role is
`article`, which is **incompatible** with `role="listitem"` → Lighthouse flags it.

- **Change:** opening `<article` → `<li`, closing `</article>` → `</li>`.
- **Kept (unchanged):** `class="pipeline-card"`, `:class`, `:style`,
  `:data-phase`, `:data-current`, and the explicit `role="listitem"`. A native
  `<li>`'s implicit role *is* `listitem`, so the explicit role becomes
  allowed-by-implicit-role (allowed-and-redundant) and the parent
  `role="list"` SR contract is preserved.
- **Updated** the comment block to record the new host tag + the #225 rationale.
- **Visual noop:** `.pipeline-card { display: flex; }` (scoped, line 65) still
  owns all styling; `display: flex` overrides the `<li>` default
  `display: list-item`, so **no UA list marker (bullet) is rendered** — the
  watch-item is structurally neutralized, no `list-style: none` edit needed.
  The parent `.pipeline-track` is a `<div role="list">` (not `<ul>`/`<ol>`), so
  there is no container-side UA list styling either.

### Fix 2 — `heading-order` → `src/components/SelfDrivingDemo.vue` (~line 177)

The visible region label was `<h3 class="self-driving-heading neon-text">…</h3>`.
On Home this `<h3>` renders in DOM order *before* the page's first `<h2>`
("Our Business"), so the outline went h1 → h3 (skipping h2) → axe `heading-order`
fails.

- **Change:** `<h3 ...>` → `<p ...>`, `</h3>` → `</p>`. Kept the
  `self-driving-heading neon-text` classes and the `{{ t('selfDriving.heading') }}`
  binding. `.self-driving-heading` styles by class (font, letter-spacing,
  text-transform, neon glow), so the rendered label looks identical.
- A `<p>` is the semantically-correct "visible label text" element and does NOT
  enter the heading outline, so the page outline is now clean h1 → h2
  ("Our Business"). The `<section>` already carries
  `:aria-label="t('selfDriving.aria.regionLabel')"`, so the landmark stays
  named for SR users independent of the heading.
- **Updated** the comment block: the prior comment *incorrectly* claimed the
  `<h3>` kept heading order valid. Replaced with the correct #225 rationale.

## Post-fix recapture (re-derived from `tickets/225/evidence/lighthouse-desktop-home.report.json`)

```
formFactor: desktop
a11y score (raw): 1 -> displayed: 100
  aria-allowed-role: score=1 (1=pass)
  heading-order: score=1 (1=pass)
--- all non-passing a11y audits (score<1, not N/A) ---
  (none — clean 100)
```

| field | baseline (#226) | post-fix (#225) |
|---|---:|---:|
| `categories.accessibility.score` | 0.98 (98) | 1.00 (**100**) |
| `aria-allowed-role` | 0 (fail) | 1 (pass) |
| `heading-order` | 0 (fail) | 1 (pass) |
| other failing a11y audits | — | none |

**Threshold gate:** desktop Home a11y = **100** ≥ 90 (target met). Both target
audits pass; **zero** remaining a11y failures on the route.

## No-regression verification

- **`node_modules/.bin/vitest run`** — `Test Files 102 passed (102)`
  / `Tests 2527 passed (2527)`. **0 failed, 0 skipped.** (No `PositionList`
  flake in this run; the #287 order-dependent flake is the only accepted
  pre-existing failure and did not surface here.)
- **`node_modules/.bin/vite build`** — passes (`✓ built in 1.20s`).
- **#224 first-h2 e2e contract** (`tests/e2e/accessibility.spec.ts:47`):
  asserts the page's first `<h2>` contains "Our Business" / "我们的业务". The
  fix *strengthens* this contract: demoting the self-driving `<h3>` to `<p>`
  removes a stray heading from the outline entirely, so the first `<h2>` is
  unambiguously "Our Business". (Previously the h3 preceded the h2 in DOM but
  the h2 contract already held; the change does not regress it.)
- **Bullet watch-item:** resolved by existing `.pipeline-card { display: flex }`
  scoped rule — see Fix 1 above. No `list-style: none` edit required.

## Files

- `src/components/selfdriving/PipelineCard.vue` — `<article role="listitem">` →
  `<li role="listitem">` + updated comment (Fix 1).
- `src/components/SelfDrivingDemo.vue` — `<h3 class="self-driving-heading …">` →
  `<p class="self-driving-heading …">` + updated comment (Fix 2).
- `src/components/__tests__/PipelineCard.test.ts` — **new**. Asserts root is
  `<li>` (not `<article>`), `role="listitem"`, and `pipeline-card` class.
- `src/components/__tests__/SelfDrivingDemo.test.ts` — added `tagName === 'p'`
  assertion on `.self-driving-heading`; updated comment.
- `tickets/225/evidence/lighthouse-desktop-home.report.json` — **fresh** desktop
  Home a11y artifact (score 100).
- `tickets/225/IMPLEMENTATION_SUMMARY.md` + `tickets/225/REVIEW.md` — this doc set.

## Recapture command (reproducible)

```bash
node_modules/.bin/vite build
node_modules/.bin/vite preview --port 4173 --strictPort &
PREVIEW_PID=$!; sleep 4
mkdir -p tickets/225/evidence
node_modules/.bin/lighthouse "http://localhost:4173/KTechAICyberWeb/" \
  --preset=desktop --only-categories=accessibility \
  --output=json --output-path=tickets/225/evidence/lighthouse-desktop-home.report.json \
  --quiet --chrome-flags="--headless=new --no-sandbox"
kill $PREVIEW_PID 2>/dev/null
```

Verification (paste from real python3 output, not retyped):

```python
import json
r = json.load(open('tickets/225/evidence/lighthouse-desktop-home.report.json'))
assert r['configSettings']['formFactor'] == 'desktop'
print(round(r['categories']['accessibility']['score']*100))  # -> 100
```
