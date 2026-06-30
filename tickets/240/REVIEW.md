# #240 — Self-review / coordinator review

## AC checklist (from issue #240)
- [x] The performance-monitoring panel is **not visible** on any user-facing page.
  - Proven: live-DOM gate (`rumDashboard=0` against `vite preview` build) + `after-footer.png` shows no panel; unit live-DOM test in `App.nav-wiring.test.ts`.
- [x] No broken refs / dead imports left from the removal.
  - Proven: `grep` for `\b(useRumBeacon|RumDashboard|setRumEnabled|rumEnabled|footer-rum|VITE_RUM|__rum|web-vitals)\b` across `src/` → only matches are inside the new `App.no-rum.test.ts` (asserting absence) + one RED-proof comment. Build is green (a dangling import would fail the build).
- [x] (Decision) Fully remove the RUM component (default chosen).
  - Removed: composable + component + tests + dep + preference + i18n + App.vue wiring.
- [x] Build green; tests updated; no regression to CWV collection if kept.
  - N/A — fully removed (no CWV collection kept). Build green, vitest 2493 pass.

## Gate evidence (all machine-derived)
| Gate | Method | Result |
|---|---|---|
| Build | `npm run build` | exit 0, 30 chunks |
| Unit tests | `vitest run` | 96 files / 2493 pass, 0 fail |
| Coverage | `vitest run --coverage` | Stmts 95.18% / Br 85.03% / Fn 96.02% / Ln 96.54% |
| Failure-delta | baseline vs after deletion | −2 files, −50 tests, 0 collateral |
| Bundle | gzip total across dist/assets | 170,305 → 164,141 (−5,730) |
| i18n parity | en vs zh top-level keys | 27 = 27, no drift, `rum` gone both |
| Dangling refs | `grep -rnE '\b(...)\b' src/` | 0 in shipped source |
| Shipped-app | Playwright vs `vite preview` | rumDashboard=0, footerPresent=1, consoleErrors=[] |
| SEC001 | regex on diff | 0 matches |
| Visual | before/after footer screenshots | panel visible → panel gone |

## Recurring-weakness check (training log)
- **Bookkeeping (iter-11/12/13/19/23/24/25):** every number above was re-derived from `git diff --shortstat`, `vitest --coverage` JSON, `grep -c`, and the Playwright capture — none hand-typed. The bundle figures come from a fresh `vite build` + `gzip.compress` measurement, not memory.
- **Deletion archetype (iter-14/30):** the proof is structural (`App.no-rum.test.ts` absence gate + live-DOM mount), not "tests pass after removing tests." RED-proof documented for the tag-removal branch.
- **Shipped-app (iter-9/23):** the live-DOM test mounts the REAL App — a component only its own tests reference would be dead code; here we prove the footer renders without the panel against the real build.
- **Visual gate (iter-13/15):** DOM tests can't see CSS/UI presence reliably for a removal either — the before/after screenshots + the Playwright `elementFromPoint`-style count gate close that gap.

## Scope honesty
No scope narrowing. The ticket's default decision (remove) was applied fully;
the alternative (dev-gate) was not chosen, so no AC was deferred. #217 (remote
RUM dashboard follow-up) is closed as obsolete because its premise (the #187
client-side RUM it would extend) no longer exists.

## Verdict
APPROVE. All ACs met, all gates green, deletion proven structurally + visually.
