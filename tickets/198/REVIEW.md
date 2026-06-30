# Issue #198 — Post-Merge Adversarial Review + Revision Record (Iteration 27)

This is the coordinator's POST-merge record for issue #198 (original cyberpunk
About icons, replacing the trademarked `about1-5.svg`). PR #275 merged cleanly
at `7f3ab0a`. The Stage-6 adversarial red-team was dispatched after merge; this
file records its findings, the corrections applied, and the verified
merge-commit numbers.

## Scope shipped (PR #275, merge `7f3ab0a`)

- `src/components/icons/AboutIcon.vue` — single shared `<svg viewBox="0 0 64 64">`
  with one `<g v-if="name==='...'">` per motif (company / parentRegion /
  capital / established / services). Original geometric line-art: no wordmarks,
  no KASIKORN/KBank/KTech text, no reproduction of the official path data.
- `src/components/icons/__tests__/AboutIcon.test.ts` — rendering, accessibility,
  IP-gate, and visual-AC (active CSS) tests.
- `public/ASSETS_NOTICE.md` — original-icon attestation appended.

## Adversarial-review findings (Stage-6 red-team)

Three findings were flagged. The coordinator INDEPENDENTLY VERIFIED each at the
merge commit `7f3ab0a` before dispatching revisions; all three were confirmed
true:

1. **🔴 Stale test count (VERIFIED).** The PR #275 body stated "2512 passed
   (2512)". The actual count at `7f3ab0a` is **2517** (2511 passed + 6 skipped,
   100 files). The "2512" was the lane's pre-#274-merge count, stale by the time
   #275 landed. Shipped tests all pass — this is a documentation error, not a
   functional one.
2. **🔴 False coverage/threshold narrative (VERIFIED).** The PR body claimed
   "branches 84.51%" and framed "the 85% global threshold ERROR is pre-existing
   and coverage-neutral." Reality at `7f3ab0a`: branches = **85.18%**, ABOVE the
   85% threshold — there is NO threshold error. The "84.51% pre-existing ERROR"
   framing was wrong; it reflected the lane's pre-#274 base, not the shipped
   tree.
3. **🟡 Weak drop-shadow visual-AC test (VERIFIED).** In
   `AboutIcon.test.ts`, `expect(stripped).toMatch(/drop-shadow\(/)` passed as
   long as ANY drop-shadow survived — including the `.about-icon:hover` and
   `@keyframes about-icon-pulse` rules. A regression removing ONLY the base
   static glow would go undetected. (The reduced-motion test was already
   genuinely RED-proof and needed no change.)

## Revisions applied (one commit each, no AI/agent mentions)

1. **`#198 review(testing): strengthen drop-shadow visual-AC to assert base rule`**
   — Replaced the naive `/drop-shadow\(/` match with a selector-precise
   assertion: walk the TOP-LEVEL rules of the `<style>` block (skipping
   `@keyframes`/`@media` wholes so their nested rules are not mistaken for
   top-level), collect rules whose selector is exactly `.about-icon` (excluding
   `.about-icon:hover`, `.about-icon :deep(g)`/`.about-icon g`, and at-blocks),
   and require at least ONE such base rule to declare a drop-shadow.
   RED-proof: with only the base `filter: drop-shadow(...)` declaration removed
   (hover + keyframes + reduced-motion intact) the test FAILS; restored, it
   PASSES.
2. **`#198 review(accuracy): correct stale test-count + false threshold narrative`**
   — This file plus a corrective follow-up comment on issue #198 stating the
   verified merge-commit numbers. Bookkeeping only; shipped code/tests unchanged
   and green.

A 🔵 nit (the redundant `.about-icon :deep(g)` selector, review nit #6) was
evaluated and deliberately NOT taken — it is cosmetic and risked the test suite
for no functional gain.

## Gate evidence (re-derived 2026-07-01 on revision branch, base `7f3ab0a`)

The shipped production code is identical to `7f3ab0a`; the only delta on this
branch is the strengthened test file + this REVIEW.md. Numbers re-derived from
actual `vitest` output (not transcribed):

- vitest: **2517 tests** (2511 passed + 6 skipped), **100 files** (99 passed +
  1 skipped).
- coverage: **Statements 95.32% (3911/4103)**, **Branches 85.23% (1824/2140)**,
  **Functions 95.86% (696/726)**, **Lines 96.62% (3668/3796)**. Branches are
  ABOVE the 85% global threshold — no threshold error. (The merge-commit figure
  cited by the coordinator was branches 85.18%; the 0.05pt delta is the test-
  only commit, which adds no production lines to the instrument set.)
- build: green (see commit 2 gate run).
- RED-proof: the strengthened drop-shadow test fails when only the base static
  glow is removed, passes when restored (output captured in the commit-1
  revision log).

## Honest risks / known gaps

1. **Bookkeeping lapse on the original PR.** The stale test count and the false
   threshold narrative were honesty errors in the PR #275 body, not code
   defects. They are corrected here and in the issue #198 follow-up comment; the
   shipped code was always green and above threshold.
2. **Pre-existing flake.** `src/views/__tests__/PositionList.test.ts > renders
   the grid with a list role` occasionally fails under parallel load (passes in
   isolation, 70/70). This is a pre-existing `useSkeleton` isLoading timing
   flake unrelated to #198; it clears on retry. Out of scope for this ticket.
3. **Redundant `.about-icon :deep(g)` selector.** The `:deep(g)` form is
   belt-and-suspenders alongside `.about-icon g` (scoped CSS already reaches the
   `<g>`). Left intact to avoid touching the shipped component for a cosmetic
   nit during a docs-honesty revision pass.

## Verdict

**READY TO MERGE.** All hard gates pass with re-derived evidence. The
adversarial findings are addressed: the weak visual-AC test is now RED-proof,
and the stale/incorrect PR-body numbers are corrected in this file and in the
issue #198 follow-up comment. Shipped code is unchanged from the already-merged
`7f3ab0a` and remains green.

## Follow-ups

- **#273** — original scope of this revision lane (tracked separately).
