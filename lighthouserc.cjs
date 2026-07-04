/**
 * @file lighthouserc.cjs
 * @description Lighthouse CI configuration for the DESKTOP perf regression
 * gate. Originated in #253 (AC #11 scaffold, all-warn thresholds); tightened
 * in #302 to error-level per the measured runtime numbers.
 *
 * MOBILE GATE LIVES ELSEWHERE (#342):
 * This config gates the DESKTOP form factor only (collect.settings.preset =
 * 'desktop'). The MOBILE counterpart — same URLs, same numberOfRuns, same
 * error-level assertions, but preset='mobile' — lives in
 * `lighthouserc.mobile.cjs`, added by #342. The two configs are wired to two
 * separate CI jobs in .github/workflows/lighthouse-ci.yml (`lighthouse` for
 * desktop, `lighthouse-mobile` for mobile) so a regression on either form
 * factor fails the PR.
 *
 * The mobile gate was deferred from #302 (mobile LCP missed AC on /about,
 * /contact, /news) and again from #340 (which shipped the structural
 * mobile-LCP fixes — defer render-blocking global CSS bundle via preload +
 * async-onload, move cyber.css to an async chunk, expand the inline
 * critical-CSS seed, preload the /news first-card image). #340 did NOT
 * re-enable the mobile preset because #344 had not yet landed: #340's
 * defer-entry-CSS optimization was a no-op in the CI audit build (a regex
 * bug in the inline-script rewriting index.html matched the production
 * /KTechAICyberWeb/ base but NOT the audit base=/, so the audit build kept
 * the render-blocking CSS bundle and the mobile LCP did not move in CI).
 * #344 fixed the regex; with #344 merged (PR #345) the audit build reflects
 * the deferred-CSS optimization, so the mobile preset's error level now
 * reflects the real end-user experience and was turned on by #342.
 *
 * #302 TIGHTENING (measured, not assumed):
 * The capture harness (scripts/302-lighthouse-capture.mjs) ran Lighthouse
 * 12.8.2 against the 5 key routes (Home/About/Services/Contact/News) on BOTH
 * the desktop preset and the mobile (perf) preset, saving raw JSON +
 * metrics-summary.json to projects/kttech-cyber/tickets/302/evidence/. The
 * error-level assertions below are gated on a metric passing its AC threshold
 * on ALL 5 DESKTOP routes — anything that failed on even one route stays at
 * warn so the gate stays honest rather than auto-failing CI on every PR.
 *
 * Per-metric verdict from the measured desktop numbers (formFactor=desktop):
 *   - categories:performance   -> error minScore 0.9    (all 5 pass: 95/91/100/98/99)
 *   - largest-contentful-paint -> error max 2500ms      (all 5 pass: 570/754/424/447/791)
 *   - total-blocking-time      -> error max 200ms       (all 5 pass: 0/0/0/0/0)
 *   - interactive (TTI)        -> error max 3800ms      (all 5 pass: 570/754/424/447/791)
 *   - cumulative-layout-shift  -> error max 0.1         (#335 RESOLVED the gap — see below)
 *
 * #335 RESOLVED THE CLS GAP (was warn, now error):
 *   Desktop CLS used to exceed the 0.1 AC on Home (0.132) and About (0.191)
 *   and mobile on both as well (0.147 / 0.198). #335 re-diagnosed the source
 *   (NOT font reflow, as the original ticket assumed — the saved layout-shifts
 *   audit proved the same elements shifted with the same scores before and
 *   after font-display:optional) and fixed the three actual causes:
 *     1. SelfDrivingDemo async-component reflow on Home (.self-driving-section
 *        wrapper had no min-height) -> reserved clamp(280px,38vh,360px).
 *     2. Lazy-route footer reflow on About (App.vue <main> had no min-height,
 *        so the global footer rode up while the About chunk loaded) ->
 *        min-height:100vh on .main-content. The single load-bearing rule.
 *     3. Unsized About hero/feature/award images (collapsed to 0px then
 *        expanded when decoded) -> aspect-ratio reservations.
 *   After-CLS (scripts/335-cls-capture.mjs, all 4 route×device combos):
 *     /        desktop  0.132 -> 0.0001   /about   desktop  0.191 -> 0.0302
 *     /        mobile   0.147 -> 0.0000   /about   mobile   0.198 -> 0.0000
 *   Evidence: projects/kttech-cyber/tickets/335/evidence/metrics-summary-335.json.
 *   CLS is now at error (0.1) — the regression gate the #302 follow-up asked for.
 *
 * INP — NOT ASSERTED:
 *   The desktop/mobile Lighthouse lab presets do not collect
 *   interaction-to-next-paint (the audit `metrics/interaction-to-next-paint`
 *   is absent from every captured JSON). INP is a field metric; lab
 *   verification requires CrUX / real-user data. Filed as follow-up issue
 *   (CrUX field-INP verification, deferred from #302).
 *
 * NOTE on assertion audit IDs: LHCI asserts on Lighthouse AUDIT IDs (not
 * metric IDs). `largest-contentful-paint`, `cumulative-layout-shift`,
 * `total-blocking-time`, and `interactive` are all audit IDs with a
 * numericValue; LHCI uses `maxNumericValue` for these. `categories:performance`
 * is the category-score assertion form and uses `minScore` (0..1).
 *
 * @ticket #253 (scaffold), #302 (measured tightening)
 */
module.exports = {
  ci: {
    collect: {
      // The 5 key routes from AC #10. The workflow builds an audit variant with
      // Vite base=/ and serves it at the web root, so routes are root-relative
      // (NOT under /KTechAICyberWeb/ as in production). See lighthouse-ci.yml
      // "Build (audit variant, base=/)" for why — the production base breaks
      // local asset loading and triggers NO_FCP.
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/about',
        'http://localhost:4173/services',
        'http://localhost:4173/contact',
        'http://localhost:4173/news',
      ],
      // Number of Lighthouse runs per URL (LHCI median over runs to reduce
      // variance). 3 is the LHCI-recommended default.
      numberOfRuns: 3,
      // Settings passed through to each Lighthouse run. Desktop form factor +
      // no throttling mirrors the dev-machine profile the FPS sampler targets.
      // The MOBILE preset (4G throttling, formFactor=mobile) lives in a
      // separate config — lighthouserc.mobile.cjs, added by #342 — wired to
      // its own CI job (lighthouse-mobile). Mobile was previously tracked as
      // a follow-up because the mobile LCP missed AC on /about, /contact,
      // /news (#302 measurement); #340 fixed the structural causes and #344
      // fixed the regex bug that had kept #340's defer-entry-CSS optimization
      // from landing in the CI audit build, so the mobile gate is now live.
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      // #302: error-level on the metrics that MEASURED-pass on all 5 desktop
      // routes; warn on the ones with a known gap (CLS). See header for the
      // per-route measured numbers and the gap rationale.
      assertions: {
        // Performance score (0..1) — error at 0.9 (AC: score >= 90).
        'categories:performance': ['error', { minScore: 0.9 }],
        // LCP — error at 2500ms (AC: LCP < 2.5s).
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        // TBT — error at 200ms (proxy for INP in lab; AC: INP < 200ms).
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        // TTI — error at 3800ms (AC: TTI < 3.8s). Audit ID is `interactive`.
        'interactive': ['error', { maxNumericValue: 3800 }],
        // CLS — ERROR (max 0.1). #335 resolved the Home/About CLS regression
        // (was warn: Home 0.132, About 0.191 desktop + mobile exceeded 0.1).
        // After #335 all 4 route×device combos measure < 0.1 (see header).
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
