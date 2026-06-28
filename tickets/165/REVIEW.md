# Issue #165 — Coordinator Pre-Merge Self-Review (Iteration 18)

This is the coordinator's gate self-review BEFORE merge. The Stage-6 adversarial
red-team is dispatched separately after merge and its scores are appended to
`docs/AGENT_TRAINING_LOG.md`.

## Acceptance criteria — all met

- **Extract About/News imagery from the official site:** 16 images extracted,
  all HTTP 200. Trademarked/branded assets (logo, n-img*, arrow99, about1-5.svg)
  explicitly skipped and documented in `public/ASSETS_NOTICE.md`.
- **Render in the shipped About section:** hero, who-we-are feature, culture
  image, 11-item awards strip — all wired via `CyberImage`.
- **Render in the shipped News section:** NewsCard list image + NewsDetail
  featured image.
- **Cyberpunk stylization:** neon border/glow, local scanline overlay,
  grayscale→color hover decode, reduced-motion-guarded glitch keyframe.
- **i18n:** localized `alt` in en+zh for every image; 880/880 leaf parity.
- **Responsible assets:** trademarked assets excluded; `ASSETS_NOTICE.md`
  marks all imagery as demo assets requiring replacement before non-demo use.

## Gate evidence (re-derived 2026-06-28)

- vitest: 2044/2044 pass, 96.23% lines.
- build: green, +1.75 kB entry (no bloat).
- shipped-app: 7/7 E2E with `naturalWidth > 0` on desktop+mobile.
- visual-AC: CSS-source assertions + red-test proofs.
- security: 0 SEC001, no XSS in scope.
- i18n: 880/880 parity.

## Honest risks / known gaps (carried to follow-ups)

1. **News-list card images** are mostly the pre-existing placeholders; only one
   official news content image was harvestable. Tracked in `ASSETS_NOTICE.md`
   (out of scope for #165; no separate follow-up filed because the placeholders
   are pre-existing demo assets, not a regression).
2. **About section icons** are emoji, not the trademarked `about1-5.svg`. A
   follow-up to commission original icons is filed as **#198**.
3. **No responsive `srcset` variants** — a single webp/png per slot. Filed as
   **#199**.
4. The `before-*` screenshots were captured on `main` (pre-image state) by the
   stalled run; the `after-*` were regenerated on the resumed branch. Both sets
   are valid PNGs and the E2E suite provides the authoritative live-DOM proof.

## Stall/Resume integrity check

Confirmed no half-applied state survived the rate-limit stall:
- `git status` shows only the legitimate commit-6 files (component+test mod,
  e2e spec, screenshot script, evidence, summaries) plus the `tickets/177/`
  leftovers from a different ticket which are EXCLUDED from the #165 commit.
- Every gate re-run on the final tree, not trusted from the stall.
- The base-path resolution (the substantive part of commit-6 that was
  in-progress at stall time) is complete, unit-tested (7 base-path cases), and
  E2E-validated (all 7 E2E tests hit URLs under `/KTechAICyberWeb/` and assert
  images load).

## Verdict

**READY TO MERGE.** All hard gates pass with re-derived evidence. Responsible-
asset constraints honored. Follow-up issues #198/#199 filed for deferred scope.
